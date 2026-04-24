import { useMemo, useRef, useCallback } from "react"
import { GripVertical } from "lucide-react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { useCustomize } from "@/shell/customizeStore"
import { dashboardItemId, useActiveDrag } from "@/shell/CustomizeDnd"
import { slotId } from "@/stores/placementStore"
import { cn } from "@/lib/utils"
import type { DashboardSlot, GridRect, WidgetDef, WidgetSize } from "./types"
import { LaunchTile } from "./LaunchTile"
import { InfoWidget } from "./InfoWidget"
import { AnalyticsWidget } from "./AnalyticsWidget"
import { NavWidget } from "./NavWidget"
import { compact, rectToWidgetSize } from "./grid/canonicalGrid"
import { useGridGeometry } from "./grid/useGridGeometry"
import { ResizeHandles } from "./grid/ResizeHandles"
import { slotToWidget } from "./slotToWidget"

/**
 * Identifier the customize-mode DnD layer uses to address the entire
 * dashboard grid as a single droppable. Free-form moves resolve their
 * target cell from the pointer rather than per-slot droppables, so we
 * only need one droppable for the whole surface.
 */
export const DASHBOARD_DROPPABLE_ID = "dashboard-grid"

/**
 * Exported so the customize-mode `DragOverlay` can render an identical
 * preview without re-implementing the discriminated switch.
 *
 * Accepts an optional `sizeOverride` so the grid can pass the
 * cell-derived density token (sm/md/lg/xl) to the widget renderer
 * without mutating the underlying recipe widget. Internal renderers
 * still branch on `size` for content density (item count, header
 * layout, etc.); the rect controls the actual cell allocation.
 */
export function renderWidget(w: WidgetDef, sizeOverride?: WidgetSize) {
  const size: WidgetSize = sizeOverride ?? w.size ?? "md"
  switch (w.kind) {
    case "launch":
      return <LaunchTile widget={w} size={size} />
    case "info":
      return <InfoWidget widget={w} size={size} />
    case "analytics":
      return <AnalyticsWidget widget={w} size={size} />
    case "nav":
      return <NavWidget widget={w} size={size} />
  }
}

/**
 * Per-slot draggable wrapper. The wrapper's `style` carries the
 * resolved (post-reflow) `gridColumn` / `gridRow`, so the visual
 * position always matches the layout the user sees in the grid (not
 * the canonical 12-col store coordinates).
 *
 * The wrapper is the drag activator. The inner content is `inert` so
 * focus / clicks can't reach the real widget surface during customize
 * mode (suppresses launch-tile clicks AND the widget's own menus,
 * which would otherwise compete with the drag).
 *
 * IMPORTANT: dnd-kit's `transform` is applied to the OUTER element,
 * while the jiggle animation lives on an INNER child. CSS animations
 * override inline `transform` styles for the duration of the
 * animation — putting both on the same node would clobber dnd-kit's
 * translate (and the cursor-following overlay would never lift).
 */
function DraggableSlot({
  slot,
  widget,
  customizing,
  jiggleAlt,
}: {
  slot: DashboardSlot
  widget: WidgetDef
  customizing: boolean
  jiggleAlt: boolean
}) {
  const id = slotId(slot)
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: dashboardItemId(id),
    disabled: !customizing,
  })

  const drag = useActiveDrag()
  const isResizingMe =
    drag !== null && drag.gesture === "resize" && drag.active.rawId === id
  const isMovingMe = isDragging || (drag?.active.rawId === id && drag.gesture === "move")
  const isLaunch = slot.kind === "pinned"
  const handlesVisible = customizing && !isLaunch && drag === null

  const size = rectToWidgetSize(slot.rect)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group/slot relative",
        // Hide the source during a move so the floating overlay reads
        // as "the thing I'm carrying"; during resize keep it visible
        // (the ghost shows where the new bounds will land).
        isMovingMe && !isResizingMe && "opacity-0",
      )}
      style={{
        gridColumn: `${slot.rect.col + 1} / span ${slot.rect.w}`,
        gridRow: `${slot.rect.row + 1} / span ${slot.rect.h}`,
      }}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-xl",
          customizing &&
            "cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Suppress jiggle on the slot currently being resized — the
          // ghost is the active feedback, the source should hold still.
          customizing &&
            !isResizingMe &&
            (jiggleAlt
              ? "motion-safe:animate-jiggle-alt"
              : "motion-safe:animate-jiggle"),
        )}
      >
        <div className="h-full w-full" inert={customizing}>
          {renderWidget(widget, size)}
        </div>
        {customizing ? (
          <div
            aria-hidden
            className="pointer-events-none absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-md bg-popover/80 text-muted-foreground shadow-sm/5 backdrop-blur"
          >
            <GripVertical className="size-3.5" />
          </div>
        ) : null}
      </div>
      <ResizeHandles slotId={id} hidden={!handlesVisible} />
    </div>
  )
}

/**
 * Cell-aligned ghost rendered during a move or resize gesture. Sits
 * inside the grid so its `gridColumn` / `gridRow` resolve to the same
 * coordinate system as every other slot — no positioning math needed.
 *
 * Renders both states (valid landing target / overlapping) with
 * distinct styles so the user sees immediately whether dropping right
 * now would commit or snap back.
 */
function SnapGhost({ rect, valid }: { rect: GridRect; valid: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none rounded-xl border-2 border-dashed transition-colors",
        valid
          ? "border-ring bg-ring/5"
          : "border-destructive bg-destructive/10",
      )}
      style={{
        gridColumn: `${rect.col + 1} / span ${rect.w}`,
        gridRow: `${rect.row + 1} / span ${rect.h}`,
      }}
    />
  )
}

/**
 * Free-form widget grid. The container itself is the only droppable
 * for dashboard moves; per-slot positioning comes from the reflowed
 * `rect` (canonical store coords compacted to the current breakpoint).
 *
 * Resize handles, the snap ghost, and the floating drag overlay
 * together form the visual feedback during a drag — the source slot
 * is hidden for moves and held still for resizes, so the user always
 * has exactly one "live" element to track.
 */
export function WidgetGrid({ slots }: { slots: DashboardSlot[] }) {
  const customizing = useCustomize((s) => s.active)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const geometry = useGridGeometry(containerRef)
  const cols = geometry?.cols ?? 12

  const reflowed = useMemo(() => compact(slots, cols), [slots, cols])
  const drag = useActiveDrag()

  const { setNodeRef: setDropRef } = useDroppable({
    id: DASHBOARD_DROPPABLE_ID,
    disabled: !customizing,
  })

  // Combined ref: the container needs to be both the geometry observer
  // target and the dnd-kit droppable node. Callback ref keeps both
  // pointers in sync without forwarding refs through useGridGeometry.
  const setContainerRef = useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el
      setDropRef(el)
    },
    [setDropRef],
  )

  return (
    <div ref={setContainerRef} className="widget-grid">
      {reflowed.map((slot, i) => {
        const widget = slotToWidget(slot)
        if (!widget) return null
        return (
          <DraggableSlot
            key={slotId(slot)}
            slot={slot}
            widget={widget}
            customizing={customizing}
            // Alternating jiggle so neighbouring widgets don't
            // oscillate in lockstep, mirroring the iOS edit pattern.
            jiggleAlt={i % 2 === 1}
          />
        )
      })}
      {drag?.ghost ? (
        <SnapGhost rect={drag.ghost.rect} valid={drag.ghost.valid} />
      ) : null}
    </div>
  )
}
