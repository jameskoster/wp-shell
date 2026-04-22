import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useContexts } from "@/contexts/store"
import { useIsMobile } from "@/hooks/use-media-query"
import { adminRecipe } from "@/recipes/admin"
import { cn } from "@/lib/utils"
import type { NavItem, NavWidget } from "@/widgets/types"
import { useDock, type DockPosition } from "./dockStore"
import { useUI } from "./uiStore"

type Orientation = "horizontal" | "vertical"

// Static caps. Anything past these collapses into the trailing "More"
// popover. Mobile uses a tighter cap so the dock comfortably fits on the
// narrowest common viewports (~375px) without horizontal overflow.
const MAX_VISIBLE: Record<Orientation, number> = {
  horizontal: 8,
  vertical: 8,
}
const MAX_VISIBLE_MOBILE = 6

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

function popoverSideFor(position: DockPosition) {
  return tooltipSideFor(position)
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

function getNavItems(): NavItem[] {
  return adminRecipe.widgets
    .filter((w): w is NavWidget => w.kind === "nav")
    .flatMap((w) => w.items)
}

function renderDockButton(
  item: NavItem,
  onActivate: (rect: DOMRect) => void,
  iconOnly = true,
) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={(e) => onActivate(e.currentTarget.getBoundingClientRect())}
      aria-label={iconOnly ? item.title : undefined}
      className={cn(
        "outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        iconOnly
          ? "relative flex size-9 items-center justify-center rounded-lg"
          : "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start",
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "size-4",
            iconOnly ? "" : "text-muted-foreground",
          )}
        />
      ) : null}
      {!iconOnly ? (
        <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
      ) : null}
      {item.badge ? (
        <Badge
          variant="secondary"
          className={cn(
            "text-[11px]",
            iconOnly && "pointer-events-none absolute -top-1 -right-1",
          )}
        >
          {item.badge}
        </Badge>
      ) : null}
    </button>
  )
}

export function Dock() {
  const stored = useDock((s) => s.position)
  const isMobile = useIsMobile()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const open = useContexts((s) => s.open)

  const position = effectivePosition(stored, isMobile)
  const orientation = orientationFor(position)
  const items = useMemo(() => getNavItems(), [])
  const cap = isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE[orientation]
  const visible = items.slice(0, cap)
  const overflow = items.slice(cap)

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

  const tooltipSide = tooltipSideFor(position)
  const popoverSide = popoverSideFor(position)
  const stackClass =
    orientation === "horizontal"
      ? "flex-row items-center"
      : "flex-col items-center"

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
          "flex gap-1 rounded-2xl border bg-card/80 p-1.5 shadow-lg/10 backdrop-blur",
          stackClass,
          // Honor iOS safe area at the bottom on mobile devices with a
          // chin/notch.
          orientation === "horizontal" &&
            "pb-[max(0.375rem,env(safe-area-inset-bottom))]",
        )}
      >
        <TooltipProvider delay={0} closeDelay={0}>
          {visible.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger
                render={renderDockButton(item, (rect) =>
                  open(item.action, rect),
                )}
              />
              <TooltipPopup side={tooltipSide} sideOffset={8}>
                {item.title}
              </TooltipPopup>
            </Tooltip>
          ))}
        </TooltipProvider>

        {overflow.length > 0 ? (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label={`More — ${overflow.length} ${
                    overflow.length === 1 ? "item" : "items"
                  }`}
                  className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-[popup-open]:bg-accent/60 data-[popup-open]:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              }
            />
            <PopoverPopup
              side={popoverSide}
              align="center"
              sideOffset={8}
              className="w-56"
            >
              <ul className="flex flex-col">
                {overflow.map((item) => (
                  <li key={item.id}>
                    {renderDockButton(
                      item,
                      (rect) => open(item.action, rect),
                      false,
                    )}
                  </li>
                ))}
              </ul>
            </PopoverPopup>
          </Popover>
        ) : null}
      </div>
    </div>
  )
}
