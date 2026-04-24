import { useMemo, useRef, useCallback, useLayoutEffect } from "react"
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
import { pack, rectToWidgetSize } from "./grid/canonicalGrid"
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
  slot: DashboardSlot & { rect: GridRect }
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
      data-slot-id={id}
      className={cn(
        "group/slot relative",
        // Hide the source during a move so the floating overlay reads
        // as "the thing I'm carrying"; during resize keep it visible
        // — its rendered cell allocation already reflects the live
        // previewed size, so the widget IS the affordance.
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
 * Sortable widget grid. The container itself is the only droppable
 * for dashboard moves; per-slot positioning falls out of `pack()`,
 * which lays slots out row-major in array order at the current
 * breakpoint's column count.
 *
 * During a move drag the previewed order is packed instead of the
 * committed one (so neighbours visibly part). During a resize drag
 * the dragged slot's size is overridden in the rendered slots list
 * so the widget visibly grows / shrinks under the cursor and pack()
 * reflows everything else around it. The FLIP layer animates both
 * kinds of displacement.
 */
export function WidgetGrid({ slots }: { slots: DashboardSlot[] }) {
  const customizing = useCustomize((s) => s.active)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const geometry = useGridGeometry(containerRef)
  const cols = geometry?.cols ?? 12

  const drag = useActiveDrag()
  // During a move drag, render the previewed order so neighbours
  // visibly slide out of the way as the cursor moves; the dragged
  // slot is hidden in place (opacity-0) at its previewed cell, while
  // the floating overlay follows the cursor.
  //
  // During a resize drag, override the dragged slot's size with the
  // live previewed footprint so pack() places the widget at its new
  // cell allocation and reflows neighbours around it.
  const orderForRender = drag?.previewOrder ?? slots
  const slotsForRender = useMemo(() => {
    if (drag?.gesture !== "resize" || !drag.resize) return orderForRender
    const targetId = drag.active.rawId
    const nextSize = drag.resize.size
    return orderForRender.map((s) =>
      slotId(s) === targetId ? { ...s, size: nextSize } : s,
    )
  }, [orderForRender, drag])
  const packed = useMemo(
    () => pack(slotsForRender, cols),
    [slotsForRender, cols],
  )

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

  // FLIP-animate slot reflows. CSS Grid doesn't animate `grid-column`
  // or `grid-row`, so when `pack(previewOrder)` shifts a slot to a new
  // cell we measure its old vs new viewport rect, paint it inverted to
  // its old position with no transition, then on the next frame remove
  // the transform with a transition — the browser interpolates from
  // the apparent old position to the real new one.
  //
  // Keyed on a layout signature derived from `packed` so the effect
  // only runs when at least one slot's id, position, or footprint
  // changes. Re-measures every cycle (clears in-flight transforms
  // first) so a fast drag that interrupts a previous animation still
  // animates from the visually-current spot rather than snapping.
  const slotRectsRef = useRef(new Map<string, DOMRect>())
  const layoutSignature = packed
    .map((s) => `${slotId(s)}:${s.rect.col},${s.rect.row},${s.rect.w}x${s.rect.h}`)
    .join("|")

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot-id]"),
    )

    // Clear any in-flight FLIP transforms before measuring so the
    // recorded rects represent the true post-layout position, not a
    // partial mid-animation offset. Done in two passes (clear, then
    // measure) so the first getBoundingClientRect forces one reflow
    // that picks up every cleared transform at once.
    for (const el of elements) {
      el.style.transition = "none"
      el.style.transform = ""
    }

    const newRects = new Map<string, DOMRect>()
    for (const el of elements) {
      const id = el.dataset.slotId
      if (!id) continue
      newRects.set(id, el.getBoundingClientRect())
    }

    const prev = slotRectsRef.current
    slotRectsRef.current = newRects

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let anyAnimating = false
    for (const el of elements) {
      const id = el.dataset.slotId
      if (!id) continue
      const prevRect = prev.get(id)
      const newRect = newRects.get(id)
      if (!prevRect || !newRect) continue
      const dx = prevRect.left - newRect.left
      const dy = prevRect.top - newRect.top
      if (dx === 0 && dy === 0) continue
      el.style.transform = `translate(${dx}px, ${dy}px)`
      anyAnimating = true
    }

    if (!anyAnimating) return

    const raf = requestAnimationFrame(() => {
      for (const el of elements) {
        if (!el.style.transform) continue
        el.style.transition =
          "transform 220ms var(--ease-glide)"
        el.style.transform = ""
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [layoutSignature])

  return (
    <div ref={setContainerRef} className="widget-grid">
      {packed.map((slot, i) => {
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
    </div>
  )
}
