import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
  launchKey,
  resolveDefaultParams,
  singletonKeyFor,
} from "@/contexts/registry"
import { useContexts } from "@/contexts/store"
import type { ContextRef } from "@/contexts/types"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { usePlacement, type PinnedItem } from "@/stores/placementStore"
import {
  DOCK_ZONE_ID,
  dockItemId,
  useActiveDrag,
} from "./CustomizeDnd"
import { useCustomize } from "./customizeStore"
import { useDock, type DockPosition, type DockSize } from "./dockStore"
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

const BUTTON_SIZE_CLASSES: Record<DockSize, string> = {
  sm: "size-9",
  md: "size-11",
  lg: "size-14",
}

const ICON_SIZE_CLASSES: Record<DockSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
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

/**
 * Render a single dock button. Exported so the customize-mode
 * `DragOverlay` can use the exact same JSX for the drag preview.
 */
export function renderDockButton(
  item: PinnedItem,
  isOpen: boolean,
  isActive: boolean,
  position: DockPosition,
  size: DockSize,
  onActivate: (rect: DOMRect) => void,
) {
  const Icon = item.icon
  return (
    <button
      type="button"
      data-launch-key={launchKey(item.action)}
      // Re-clicking the already-active context is a no-op: the surface is
      // already on screen, so replaying the launch animation would just
      // be visual noise. `aria-pressed` advertises the toggle-like state
      // for assistive tech.
      onClick={(e) => {
        if (isActive) return
        onActivate(e.currentTarget.getBoundingClientRect())
      }}
      aria-label={item.title}
      aria-pressed={isActive}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        BUTTON_SIZE_CLASSES[size],
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/60 focus-visible:bg-accent/60",
      )}
    >
      {Icon ? <Icon className={ICON_SIZE_CLASSES[size]} /> : null}
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
          variant="destructive"
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

/**
 * Customize-mode wrapper around a single dock item. Mirrors the
 * dashboard's `SortableWidget`: the wrapper is the drag activator, the
 * inner button is `inert` so its click + focus are suppressed during
 * editing, and the wrapper jiggles to advertise the affordance.
 */
function SortableDockItem({
  item,
  isOpen,
  isActive,
  position,
  size,
  index,
}: {
  item: PinnedItem
  isOpen: boolean
  isActive: boolean
  position: DockPosition
  size: DockSize
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dockItemId(item.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  // Outer node owns the dnd-kit transform; inner node owns the jiggle
  // animation. Same reasoning as `SortableWidget` — CSS animations
  // override inline `transform` styles, so co-locating them on one
  // node would silently clobber the reorder translate.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-0")}
      aria-label={`Reposition ${item.title}`}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "rounded-lg outline-none cursor-grab focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          index % 2 === 0
            ? "motion-safe:animate-jiggle-sm"
            : "motion-safe:animate-jiggle-sm-alt",
        )}
      >
        <div inert>
          {renderDockButton(item, isOpen, isActive, position, size, () => {})}
        </div>
      </div>
    </div>
  )
}

export function Dock() {
  const stored = useDock((s) => s.position)
  const size = useDock((s) => s.size)
  const isMobile = useIsMobile()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const customizing = useCustomize((s) => s.active)
  const open = useContexts((s) => s.open)
  const openContexts = useContexts((s) => s.openContexts)
  const activeId = useContexts((s) => s.activeId)

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

  // Singleton key of the currently-active context, if any. Used to give
  // the matching dock item an "active" treatment and turn its click into
  // a no-op (re-launching the already-on-screen surface is just noise).
  const activeKey = useMemo(() => {
    if (!activeId) return null
    const ctx = openContexts.find((c) => c.id === activeId)
    if (!ctx) return null
    return openKeyFor({ type: ctx.type, params: ctx.params })
  }, [activeId, openContexts])

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
  }, [position, size, items.length])

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
  // dashboard. The dock reappears as soon as anything is pinned to it —
  // OR if customize mode is active, so the user has a drop target for
  // launch tiles being dragged off the dashboard.
  if (items.length === 0 && !customizing) return null

  const tooltipSide = tooltipSideFor(position)

  // Two distinct dim treatments:
  //   - Switcher open      → fully inert (we're not on the dashboard
  //                          surface; the dock has no role).
  //   - Customize active   → visually attenuated but kept interactive
  //                          so it can receive drops. Items are
  //                          rendered through SortableDockItem which
  //                          inerts the inner button.
  const inertDim = switcherOpen
  return (
    <div
      className={cn(
        "fixed z-30 motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-glide",
        inertDim
          ? "pointer-events-none opacity-40 blur-sm"
          : customizing
            ? "opacity-100"
            : "opacity-100 blur-0",
        containerPositionClasses(position),
      )}
      aria-hidden={inertDim}
      inert={inertDim}
    >
      <CustomizeAwareContainer
        containerRef={containerRef}
        orientation={orientation}
        position={position}
        size={size}
        tooltipSide={tooltipSide}
        items={items}
        openKeys={openKeys}
        activeKey={activeKey}
        customizing={customizing}
        onActivate={open}
      />
    </div>
  )
}

/**
 * Inner container is split out so the customize-mode SortableContext
 * + droppable wiring can live in one place without polluting the live
 * dock render path.
 */
function CustomizeAwareContainer({
  containerRef,
  orientation,
  position,
  size,
  tooltipSide,
  items,
  openKeys,
  activeKey,
  customizing,
  onActivate,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  orientation: Orientation
  position: DockPosition
  size: DockSize
  tooltipSide: ReturnType<typeof tooltipSideFor>
  items: PinnedItem[]
  openKeys: Set<string>
  activeKey: string | null
  customizing: boolean
  onActivate: (
    ref: ContextRef,
    rect: DOMRect,
  ) => string
}) {
  const drag = useActiveDrag()
  // The dock only accepts launch tiles. Disable the droppable for any
  // other drag source so the cursor reads "not allowed" and the drop
  // routes to a no-op rather than something nonsensical.
  const dropEnabled = customizing && (drag === null || drag.isLaunchTile)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: DOCK_ZONE_ID,
    disabled: !dropEnabled,
  })

  const dockHasNonLaunchOver =
    customizing && drag !== null && !drag.isLaunchTile && isOver

  const itemTrack = (
    <div
      className={cn(
        "flex gap-1 p-1.5",
        orientation === "horizontal"
          ? "w-max flex-row items-center pb-[max(0.375rem,env(safe-area-inset-bottom))]"
          : "h-max flex-col items-center",
      )}
    >
      {items.map((item, i) => {
        const key = openKeyFor(item.action)
        const isOpen = key ? openKeys.has(key) : false
        const isActive = key !== null && key === activeKey
        if (customizing) {
          return (
            <SortableDockItem
              key={item.id}
              item={item}
              isOpen={isOpen}
              isActive={isActive}
              position={position}
              size={size}
              index={i}
            />
          )
        }
        return (
          <DockItemContextMenu key={item.id} item={item}>
            <Tooltip>
              <TooltipTrigger
                render={renderDockButton(
                  item,
                  isOpen,
                  isActive,
                  position,
                  size,
                  (rect) => onActivate(item.action, rect),
                )}
              />
              <TooltipPopup side={tooltipSide} sideOffset={8}>
                {item.title}
              </TooltipPopup>
            </Tooltip>
          </DockItemContextMenu>
        )
      })}
      {/* Empty-state hint while customizing so the dock visibly
          remains a drop target after the user has moved everything off
          it. Non-launch drags get a "not allowed" treatment via the
          opacity / cursor styles on the outer container. */}
      {customizing && items.length === 0 ? (
        <div className="flex h-9 items-center justify-center px-3 text-xs text-muted-foreground whitespace-nowrap">
          Drop a launch tile here
        </div>
      ) : null}
    </div>
  )

  // Build the inner pill. Pinned containerRef is preserved so the
  // existing inset-publishing useLayoutEffect keeps working.
  const pill = (
    <div
      ref={(node) => {
        containerRef.current = node
        setDropRef(node)
      }}
      role="toolbar"
      aria-label="Dock"
      aria-orientation={orientation}
      className={cn(
        "flex rounded-2xl border bg-card/80 shadow-lg/10 backdrop-blur",
        orientation === "horizontal"
          ? "max-w-[calc(100vw-1.5rem)]"
          : "max-h-[calc(100svh-6rem)]",
        // Drop-target affordances during a drag.
        customizing &&
          drag &&
          drag.isLaunchTile &&
          isOver &&
          "ring-2 ring-ring ring-offset-2 ring-offset-background bg-card",
        dockHasNonLaunchOver &&
          "ring-2 ring-destructive/60 ring-offset-2 ring-offset-background cursor-not-allowed",
      )}
    >
      <ScrollArea
        className="**:data-[slot=scroll-area-scrollbar]:hidden"
        scrollFade
      >
        {customizing ? (
          itemTrack
        ) : (
          <TooltipProvider delay={0} closeDelay={0}>
            {itemTrack}
          </TooltipProvider>
        )}
      </ScrollArea>
    </div>
  )

  if (!customizing) return pill
  return (
    <SortableContext
      items={items.map((i) => dockItemId(i.id))}
      strategy={
        orientation === "horizontal"
          ? horizontalListSortingStrategy
          : verticalListSortingStrategy
      }
    >
      {pill}
    </SortableContext>
  )
}
