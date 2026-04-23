import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { MenuItem, MenuSeparator } from "@/components/ui/menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  resolveDefaultParams,
  singletonKeyFor,
} from "@/contexts/registry"
import { useContexts } from "@/contexts/store"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { usePlacement, type PinnedItem } from "@/stores/placementStore"
import { useDock, type DockPosition } from "./dockStore"
import { useUI } from "./uiStore"

type Orientation = "horizontal" | "vertical"

function effectivePosition(
  stored: DockPosition,
  isMobile: boolean,
): DockPosition {
  if (stored === "hidden") return "hidden"
  if (isMobile) return "bottom-center"
  return stored
}

function orientationFor(position: DockPosition): Orientation {
  return position === "bottom-center" ? "horizontal" : "vertical"
}

function tooltipSideFor(position: DockPosition) {
  switch (position) {
    case "left-center":
      return "right"
    case "right-center":
      return "left"
    default:
      return "top"
  }
}

function containerPositionClasses(position: DockPosition): string {
  switch (position) {
    case "left-center":
      return "left-3 top-1/2 -translate-y-1/2"
    case "right-center":
      return "right-3 top-1/2 -translate-y-1/2"
    case "bottom-center":
    default:
      return "bottom-4 left-1/2 -translate-x-1/2"
  }
}

/**
 * Position the "open context" indicator dot at the inward edge of the
 * dock — below the icon when the dock sits along the bottom, and on the
 * screen-facing side when it's vertical. Mirrors the macOS Dock metaphor
 * of a dot under a running app.
 */
function indicatorClassesFor(position: DockPosition): string {
  switch (position) {
    case "left-center":
      return "right-0.5 top-1/2 -translate-y-1/2"
    case "right-center":
      return "left-0.5 top-1/2 -translate-y-1/2"
    case "bottom-center":
    default:
      return "bottom-0.5 left-1/2 -translate-x-1/2"
  }
}

/**
 * Position the notification badge so its bleed only extends along the
 * dock's main scroll axis. A cross-axis overhang (e.g. `-right-1` on a
 * vertical dock) inflates the ScrollArea's horizontal scroll extent and
 * lights up the edge-fade mask on the pill's inner edge.
 */
function badgeClassesFor(position: DockPosition): string {
  switch (position) {
    case "left-center":
    case "right-center":
      return "-top-1 right-0"
    case "bottom-center":
    default:
      return "-top-1 -right-1"
  }
}

/**
 * Build the "is this ref currently open?" key. Mirrors the dedupe logic
 * in `useContexts.open`: defaults are applied to bare refs, then the
 * type's singleton key (if any) identifies the canonical instance. Refs
 * for non-singleton types can never reliably correspond to a static
 * dock entry, so we return `null` and skip them.
 */
function openKeyFor(ref: ContextRef): string | null {
  const hasParams =
    ref.params !== undefined && Object.keys(ref.params).length > 0
  const params = hasParams ? ref.params : resolveDefaultParams(ref.type) ?? ref.params
  const key = singletonKeyFor(ref.type, params)
  if (key === undefined) return null
  return `${ref.type}:${key}`
}

function renderDockButton(
  item: PinnedItem,
  isOpen: boolean,
  position: DockPosition,
  onActivate: (rect: DOMRect) => void,
) {
  const Icon = item.icon
  return (
    <button
      type="button"
      data-launch-key={refKey(item.action)}
      onClick={(e) => onActivate(e.currentTarget.getBoundingClientRect())}
      aria-label={item.title}
      className="relative flex size-9 shrink-0 items-center justify-center rounded-lg outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
    >
      {Icon ? <Icon className="size-4" /> : null}
      {isOpen ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-1 rounded-full bg-foreground/70",
            indicatorClassesFor(position),
          )}
        />
      ) : null}
      {item.badge ? (
        <Badge
          variant="secondary"
          className={cn(
            "pointer-events-none absolute text-[11px]",
            badgeClassesFor(position),
          )}
        >
          {item.badge}
        </Badge>
      ) : null}
    </button>
  )
}

/**
 * Right-click menu shared by every dock item. Wraps `children` in a Base
 * UI ContextMenu so the trigger area is the dock button itself.
 */
function DockItemContextMenu({
  item,
  children,
}: {
  item: PinnedItem
  children: ReactNode
}) {
  const setPlacement = usePlacement((s) => s.setPlacement)
  return (
    <ContextMenu>
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>
      <ContextMenuPopup align="start" className="min-w-44">
        <MenuItem onClick={() => setPlacement(item.action, "dashboard")}>
          Move to dashboard
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          variant="destructive"
          onClick={() => setPlacement(item.action, "none")}
        >
          Remove
        </MenuItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

export function Dock() {
  const stored = useDock((s) => s.position)
  const isMobile = useIsMobile()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const open = useContexts((s) => s.open)
  const openContexts = useContexts((s) => s.openContexts)

  const position = effectivePosition(stored, isMobile)
  const orientation = orientationFor(position)
  const items = usePlacement((s) => s.dock)

  // Build a set of currently-open singleton keys so we can mark the
  // dock items that have a live context behind them.
  const openKeys = useMemo(() => {
    const set = new Set<string>()
    for (const c of openContexts) {
      const key = openKeyFor({ type: c.type, params: c.params })
      if (key) set.add(key)
    }
    return set
  }, [openContexts])

  const containerRef = useRef<HTMLDivElement>(null)

  // Publish dock outer dimensions as CSS variables on the document root so
  // surfaces (currently the Dashboard grid) can pad themselves and avoid
  // being obscured. Keeping this on the root means consumers don't need to
  // know about the dock; they just read the var.
  useLayoutEffect(() => {
    const root = document.documentElement
    const reset = () => {
      root.style.setProperty("--dock-inset-left", "0px")
      root.style.setProperty("--dock-inset-right", "0px")
      root.style.setProperty("--dock-inset-bottom", "0px")
    }

    if (position === "hidden") {
      reset()
      return reset
    }

    const el = containerRef.current
    if (!el) {
      reset()
      return reset
    }

    // Gap added on top of the dock's own size — enough to keep widgets
    // visually clear of the dock without crowding it.
    const GAP = 16

    const update = () => {
      const rect = el.getBoundingClientRect()
      reset()
      if (position === "left-center") {
        root.style.setProperty("--dock-inset-left", `${rect.width + GAP}px`)
      } else if (position === "right-center") {
        root.style.setProperty("--dock-inset-right", `${rect.width + GAP}px`)
      } else {
        root.style.setProperty("--dock-inset-bottom", `${rect.height + GAP}px`)
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      reset()
    }
  }, [position, items.length])

  // Reset on unmount as a safety net (e.g. dev hot-reload swaps).
  useEffect(
    () => () => {
      const root = document.documentElement
      root.style.setProperty("--dock-inset-left", "0px")
      root.style.setProperty("--dock-inset-right", "0px")
      root.style.setProperty("--dock-inset-bottom", "0px")
    },
    [],
  )

  if (position === "hidden") return null
  // Avoid rendering an empty pill if the user has moved every item to the
  // dashboard. The dock reappears as soon as anything is pinned to it.
  if (items.length === 0) return null

  const tooltipSide = tooltipSideFor(position)

  return (
    <div
      className={cn(
        "fixed z-30 motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-glide",
        switcherOpen
          ? "pointer-events-none opacity-40 blur-sm"
          : "opacity-100 blur-0",
        containerPositionClasses(position),
      )}
      aria-hidden={switcherOpen}
      inert={switcherOpen}
    >
      <div
        ref={containerRef}
        role="toolbar"
        aria-label="Dock"
        aria-orientation={orientation}
        className={cn(
          "flex rounded-2xl border bg-card/80 p-1.5 shadow-lg/10 backdrop-blur",
          // The pill shrink-wraps the inner ScrollArea up to a viewport-
          // bounded cap. Once the natural item track exceeds the cap the
          // pill stops growing and the ScrollArea takes over with
          // scrolling + edge fades.
          orientation === "horizontal"
            ? "max-w-[calc(100vw-1.5rem)]"
            : "max-h-[calc(100svh-6rem)]",
          // Honor iOS safe area at the bottom on mobile devices with a
          // chin/notch.
          orientation === "horizontal" &&
            "pb-[max(0.375rem,env(safe-area-inset-bottom))]",
        )}
      >
        <ScrollArea
          // Hide the scrollbar entirely — the edge fades are the only
          // affordance, matching the macOS Dock metaphor of an
          // uncluttered surface that just scrolls.
          className="**:data-[slot=scroll-area-scrollbar]:hidden"
          scrollFade
        >
          <TooltipProvider delay={0} closeDelay={0}>
            <div
              className={cn(
                "flex gap-1",
                // `w-max` / `h-max` lets the inner track grow to its
                // natural size beyond the constrained viewport so
                // overflow actually engages the scroll axis.
                orientation === "horizontal"
                  ? "w-max flex-row items-center"
                  : "h-max flex-col items-center",
              )}
            >
              {items.map((item) => {
                const key = openKeyFor(item.action)
                const isOpen = key ? openKeys.has(key) : false
                return (
                  <DockItemContextMenu key={item.id} item={item}>
                    <Tooltip>
                      <TooltipTrigger
                        render={renderDockButton(item, isOpen, position, (rect) =>
                          open(item.action, rect),
                        )}
                      />
                      <TooltipPopup side={tooltipSide} sideOffset={8}>
                        {item.title}
                      </TooltipPopup>
                    </Tooltip>
                  </DockItemContextMenu>
                )
              })}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </div>
    </div>
  )
}
