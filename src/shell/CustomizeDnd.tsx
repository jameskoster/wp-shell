import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { usePlacement, slotId, type PinnedItem } from "@/stores/placementStore"
import { slotToWidget } from "@/widgets/slotToWidget"
import {
  DASHBOARD_DROPPABLE_ID,
  renderWidget,
} from "@/widgets/WidgetGrid"
import { renderDockButton } from "./Dock"
import { useDock } from "./dockStore"
import type {
  DashboardSlot,
  GridRect,
  WidgetDef,
  WidgetSize,
} from "@/widgets/types"
import {
  clampToGrid,
  indexForAnchor,
  overlapsAny,
  pack,
  reorderArray,
  rectToWidgetSize,
} from "@/widgets/grid/canonicalGrid"
import {
  getActiveGridGeometry,
  type GridGeometry,
} from "@/widgets/grid/useGridGeometry"
import type { ResizeEdge } from "@/widgets/grid/resizeIds"

/**
 * Identifier used by the cross-surface drag system.
 *
 *  - `dashboard:<id>` — a draggable widget in the dashboard. The id is
 *    either a pinned tile id (`tile:…`) or a recipe widget id.
 *  - `dock:<id>`      — a draggable launch tile in the dock.
 *  - `resize:<slotId>:<edge>` — one of the 8 resize handles on a
 *    non-launch dashboard slot. Routed to `resizeWidget` rather than
 *    the move pipeline.
 *  - `dashboard-grid` — the entire dashboard grid as one droppable;
 *    the snap target for free-form moves and the landing zone for
 *    cross-surface dock → dashboard drops.
 *  - `dock-zone`      — the dock container as a drop target (used when
 *    dragging a launch tile from the dashboard).
 *
 * Removal isn't a drop target — each widget's per-tile menu handles
 * dismissal, so there's no `remove-zone` wired into this routing layer.
 */
export const DASHBOARD_PREFIX = "dashboard:"
export const DOCK_PREFIX = "dock:"
export const RESIZE_PREFIX = "resize:"
export const DOCK_ZONE_ID = "dock-zone"

export function dashboardItemId(id: string): string {
  return `${DASHBOARD_PREFIX}${id}`
}
export function dockItemId(id: string): string {
  return `${DOCK_PREFIX}${id}`
}

type ParsedActive =
  | { kind: "dashboard"; rawId: string }
  | { kind: "dock"; rawId: string }
  | { kind: "resize"; slotId: string; edge: ResizeEdge }
  | { kind: "zone"; rawId: string }

type ParsedOver =
  | { kind: "dashboard"; rawId: string }
  | { kind: "dock"; rawId: string }
  | { kind: "zone"; rawId: string }

function parseActive(id: string): ParsedActive {
  if (id.startsWith(RESIZE_PREFIX)) {
    const rest = id.slice(RESIZE_PREFIX.length)
    // slotId can itself contain colons (e.g. "tile:edit-page:posts"),
    // so the edge is whatever follows the LAST colon.
    const lastColon = rest.lastIndexOf(":")
    return {
      kind: "resize",
      slotId: rest.slice(0, lastColon),
      edge: rest.slice(lastColon + 1) as ResizeEdge,
    }
  }
  if (id.startsWith(DASHBOARD_PREFIX)) {
    return { kind: "dashboard", rawId: id.slice(DASHBOARD_PREFIX.length) }
  }
  if (id.startsWith(DOCK_PREFIX)) {
    return { kind: "dock", rawId: id.slice(DOCK_PREFIX.length) }
  }
  return { kind: "zone", rawId: id }
}

function parseOver(id: string): ParsedOver {
  if (id.startsWith(DASHBOARD_PREFIX)) {
    return { kind: "dashboard", rawId: id.slice(DASHBOARD_PREFIX.length) }
  }
  if (id.startsWith(DOCK_PREFIX)) {
    return { kind: "dock", rawId: id.slice(DOCK_PREFIX.length) }
  }
  return { kind: "zone", rawId: id }
}

/**
 * Read-only drag context published to descendants so they can adapt to
 * the in-flight drag (e.g. the customize bar swaps in the Remove zone,
 * the dock highlights when it's a valid drop target, the grid renders
 * the in-flight reorder by packing `previewOrder` instead of the
 * committed `dashboardOrder`).
 */
export type DragInfo = {
  active: { id: string; surface: "dashboard" | "dock"; rawId: string }
  /**
   * Differentiates a position-change drag (move between cells / surfaces)
   * from a size-change drag (resize handle on a non-launch dashboard
   * widget). The Remove zone and dock drop affordance only materialise
   * for "move" gestures — resizing has no cross-surface meaning.
   */
  gesture: "move" | "resize"
  /**
   * True when the dragged item is a launch tile (the only kind allowed
   * to land on the dock). Always false for resize gestures, since
   * launch tiles can't be resized.
   */
  isLaunchTile: boolean
  /**
   * Captured at drag start so the `DragOverlay` can render an
   * unambiguous, cursor-following preview of the item being moved.
   * For dashboard widgets, `size` is the cell-derived density token
   * captured at drag start (the dragged slot's footprint never changes
   * mid-drag — only its position in the order does).
   */
  preview:
    | { kind: "dashboard"; widget: WidgetDef; size: WidgetSize }
    | { kind: "dock"; item: PinnedItem }
  /**
   * Live insertion target for a dashboard move gesture. Computed from
   * the cursor's cell on every onDragMove and committed to the store
   * on drop via `reorderWidget`. Absent for resize, dock-only drags,
   * and before the first onDragMove fires.
   */
  insertionIndex?: number
  /**
   * `dashboardOrder` with the dragged slot spliced to `insertionIndex`.
   * Published so the grid can pack-and-render the previewed layout
   * during the drag — neighbours visibly slide out of the way as the
   * cursor moves. Same absence semantics as `insertionIndex`.
   */
  previewOrder?: DashboardSlot[]
  /**
   * Cell-aligned snap target for a resize gesture. The grid renders
   * this as a ghost outline; an invalid target (overlap) gets a
   * destructive style. Move gestures don't use this — neighbours
   * displacing in the previewed layout is the move affordance.
   */
  ghost?: { rect: GridRect; valid: boolean }
}

import { createContext, useContext } from "react"
const DragInfoContext = createContext<DragInfo | null>(null)
export function useActiveDrag(): DragInfo | null {
  return useContext(DragInfoContext)
}

/**
 * Per-drag scratch state that doesn't need to round-trip through React
 * — captured once at `onDragStart` and read by `onDragMove` /
 * `onDragEnd`. Lives in a ref so updates don't churn re-renders.
 */
type DragMeta =
  | {
      kind: "dashboard-move"
      slotId: string
      /**
       * The dragged slot's packed rect at drag start. Only its `col`
       * and `row` are read — they're the anchor cell from which cursor
       * deltas convert to a candidate cell. The `w`/`h` survive for
       * symmetry with the resize meta.
       */
      originalRect: GridRect
      /** Index of the dragged slot in `dashboardOrder` at drag start. */
      currentIndex: number
      /**
       * The last insertion index resolved during this drag. Seeded to
       * `currentIndex` and updated whenever `handleDragMove` switches
       * targets. Fed to `indexForAnchor` as the sticky index so it
       * biases its score toward staying put — the cursor must
       * overshoot the boundary by at least one cell before the
       * resolved index changes, which kills boundary-cell jitter
       * between adjacent same-shape neighbours.
       */
      lastIndex: number
    }
  | {
      kind: "resize"
      slotId: string
      originalRect: GridRect
      edge: ResizeEdge
    }
  | { kind: "dock-move"; rawId: string }

/**
 * Translate a pixel delta along one axis to a cell-count delta, using
 * the current grid stride (cell + gap). Rounds rather than truncates
 * so the snap "feels" centred on the cursor.
 */
function deltaToCells(deltaPx: number, geometry: GridGeometry): number {
  const stride = geometry.cellSize + geometry.gap
  if (stride <= 0) return 0
  return Math.round(deltaPx / stride)
}

/**
 * Apply a cell-delta to the appropriate edges of `rect` based on which
 * resize handle was grabbed. West / north edges shift the origin AND
 * adjust the size; east / south edges only adjust size. Min dimension
 * is 1×1; the caller is expected to clamp horizontally afterwards.
 *
 * The `Math.min(col + w - 1, …)` bookend on the west/north paths
 * prevents the moving edge from crossing the opposite edge — a fully
 * collapsed rect would otherwise flip its sign.
 */
function applyResizeDelta(
  rect: GridRect,
  edge: ResizeEdge,
  deltaCol: number,
  deltaRow: number,
  cols: number,
): GridRect {
  let { col, row, w, h } = rect
  if (edge.includes("e")) {
    w = Math.max(1, Math.min(cols - col, w + deltaCol))
  }
  if (edge.includes("w")) {
    const oldCol = col
    const newCol = Math.max(0, Math.min(col + w - 1, col + deltaCol))
    col = newCol
    w = Math.max(1, w - (newCol - oldCol))
  }
  if (edge.includes("s")) {
    h = Math.max(1, h + deltaRow)
  }
  if (edge.includes("n")) {
    const oldRow = row
    const newRow = Math.max(0, Math.min(row + h - 1, row + deltaRow))
    row = newRow
    h = Math.max(1, h - (newRow - oldRow))
  }
  return { col, row, w, h }
}

/**
 * Find the slot in `dashboardOrder` whose id matches `id`. Returns
 * undefined for ids that aren't on the dashboard (dock items, etc.).
 */
function findSlot(order: DashboardSlot[], id: string): DashboardSlot | undefined {
  return order.find((s) => slotId(s) === id)
}

/**
 * Hosts the single DndContext shared by the dashboard and the dock.
 * Always mounted (so the sensors are stable across customize toggles)
 * but every individual `useSortable`/`useDroppable` is `disabled` when
 * customize mode is off — so the listeners are inert in normal use.
 */
export function CustomizeDnd({ children }: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A tiny activation distance keeps clicks on chrome (e.g. focus
      // outlines) from being interpreted as drag intents.
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const setPlacement = usePlacement((s) => s.setPlacement)
  const reorderWidget = usePlacement((s) => s.reorderWidget)
  const resizeWidget = usePlacement((s) => s.resizeWidget)

  const [activeDrag, setActiveDrag] = useState<DragInfo | null>(null)
  const dragMetaRef = useRef<DragMeta | null>(null)

  function isPinnedTile(rawId: string): boolean {
    return rawId.startsWith("tile:")
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    const parsed = parseActive(id)
    if (parsed.kind === "zone") return

    const state = usePlacement.getState()
    const geometry = getActiveGridGeometry()
    const cols = geometry?.cols ?? 12

    // The handle's drag origin is the slot's CURRENT visible (packed)
    // rect — same coordinate system every move event will produce
    // candidates in. `pack()` returns slots with rects attached, so we
    // look up the dragged slot in the packed array directly.
    const packed = pack(state.dashboardOrder, cols)

    if (parsed.kind === "resize") {
      const packedSlot = packed.find((s) => slotId(s) === parsed.slotId)
      if (!packedSlot) return
      const widget = slotToWidget(packedSlot)
      if (!widget) return
      const originalRect = packedSlot.rect
      dragMetaRef.current = {
        kind: "resize",
        slotId: parsed.slotId,
        originalRect,
        edge: parsed.edge,
      }
      setActiveDrag({
        active: { id, surface: "dashboard", rawId: parsed.slotId },
        gesture: "resize",
        isLaunchTile: false,
        preview: {
          kind: "dashboard",
          widget,
          size: rectToWidgetSize(originalRect),
        },
        ghost: { rect: originalRect, valid: true },
      })
      return
    }

    if (parsed.kind === "dashboard") {
      const packedIndex = packed.findIndex((s) => slotId(s) === parsed.rawId)
      if (packedIndex < 0) return
      const packedSlot = packed[packedIndex]
      const widget = slotToWidget(packedSlot)
      if (!widget) return
      const originalRect = packedSlot.rect
      dragMetaRef.current = {
        kind: "dashboard-move",
        slotId: parsed.rawId,
        originalRect,
        currentIndex: packedIndex,
        lastIndex: packedIndex,
      }
      setActiveDrag({
        active: { id, surface: "dashboard", rawId: parsed.rawId },
        gesture: "move",
        isLaunchTile: isPinnedTile(parsed.rawId),
        preview: {
          kind: "dashboard",
          widget,
          size: rectToWidgetSize(originalRect),
        },
        // Initial preview = no movement yet; insertion stays at the
        // current index, previewOrder is the committed order. Updated
        // by handleDragMove as the cursor moves.
        insertionIndex: packedIndex,
        previewOrder: state.dashboardOrder,
      })
      return
    }

    // parsed.kind === "dock"
    const item = state.dock.find((p) => p.id === parsed.rawId)
    if (!item) return
    dragMetaRef.current = { kind: "dock-move", rawId: parsed.rawId }
    setActiveDrag({
      active: { id, surface: "dock", rawId: parsed.rawId },
      gesture: "move",
      isLaunchTile: true,
      preview: { kind: "dock", item },
    })
  }

  function handleDragMove(e: DragMoveEvent) {
    const meta = dragMetaRef.current
    if (!meta) return
    if (meta.kind === "dock-move") return

    const geometry = getActiveGridGeometry()
    if (!geometry) return

    const deltaCol = deltaToCells(e.delta.x, geometry)
    const deltaRow = deltaToCells(e.delta.y, geometry)

    if (meta.kind === "resize") {
      const candidate = applyResizeDelta(
        meta.originalRect,
        meta.edge,
        deltaCol,
        deltaRow,
        geometry.cols,
      )
      const order = usePlacement.getState().dashboardOrder
      const packed = pack(order, geometry.cols)
      const others = packed
        .filter((s) => slotId(s) !== meta.slotId)
        .map((s) => s.rect)
      const valid = !overlapsAny(candidate, others)

      setActiveDrag((prev) => {
        if (!prev) return prev
        const same =
          prev.ghost &&
          prev.ghost.rect.col === candidate.col &&
          prev.ghost.rect.row === candidate.row &&
          prev.ghost.rect.w === candidate.w &&
          prev.ghost.rect.h === candidate.h &&
          prev.ghost.valid === valid
        if (same) return prev
        return { ...prev, ghost: { rect: candidate, valid } }
      })
      return
    }

    // === Dashboard move ============================================
    // Resolve the cursor's anchor cell, look up the insertion index
    // that would land the dragged slot closest to that anchor after
    // re-packing, and publish a previewOrder so the grid renders the
    // displacement live.
    const anchor = clampToGrid(
      {
        col: meta.originalRect.col + deltaCol,
        row: meta.originalRect.row + deltaRow,
        w: 1,
        h: 1,
      },
      geometry.cols,
    )
    const order = usePlacement.getState().dashboardOrder
    const insertionIndex = indexForAnchor(
      order,
      meta.currentIndex,
      { col: anchor.col, row: anchor.row },
      geometry.cols,
      { stickyIndex: meta.lastIndex },
    )

    if (insertionIndex === meta.lastIndex) return
    meta.lastIndex = insertionIndex
    const previewOrder = reorderArray(
      order,
      meta.currentIndex,
      insertionIndex,
    )
    setActiveDrag((prev) =>
      prev ? { ...prev, insertionIndex, previewOrder } : prev,
    )
  }

  function handleDragCancel() {
    setActiveDrag(null)
    dragMetaRef.current = null
  }

  function handleDragEnd(e: DragEndEvent) {
    const meta = dragMetaRef.current
    const ghost = activeDrag?.ghost
    const insertionIndex = activeDrag?.insertionIndex
    setActiveDrag(null)
    dragMetaRef.current = null

    const active = e.active
    const over = e.over
    const a = parseActive(String(active.id))

    // === Resize gesture ============================================
    // Resize commits regardless of `over` — the snap target is in the
    // grid, not under the cursor. Drops without a valid candidate
    // simply revert (the source rect was never mutated during drag).
    if (a.kind === "resize") {
      if (meta?.kind === "resize" && ghost?.valid) {
        resizeWidget(meta.slotId, ghost.rect)
      }
      return
    }

    // === Dashboard move into empty space below the grid =============
    // The grid's droppable rect is only as tall as the rows it
    // currently contains, so dragging into a not-yet-existent row
    // leaves `over` null. The insertion index was computed live from
    // the cursor anchor and is always valid (no overlap is possible
    // in the sortable model), so we commit unconditionally.
    if (!over) {
      if (
        a.kind === "dashboard" &&
        meta?.kind === "dashboard-move" &&
        insertionIndex !== undefined
      ) {
        reorderWidget(meta.slotId, insertionIndex)
      }
      return
    }

    const o = parseOver(String(over.id))

    // === Drop on the Dock zone (cross-surface from the dashboard) ====
    if (o.kind === "zone" && o.rawId === DOCK_ZONE_ID) {
      if (a.kind !== "dashboard" || !isPinnedTile(a.rawId)) return
      const slot = findSlot(usePlacement.getState().dashboardOrder, a.rawId)
      if (slot && slot.kind === "pinned") {
        setPlacement(slot.pinned.action, "dock")
      }
      return
    }

    // === Drop on the Dashboard grid =================================
    if (o.kind === "zone" && o.rawId === DASHBOARD_DROPPABLE_ID) {
      if (a.kind === "dashboard") {
        if (meta?.kind === "dashboard-move" && insertionIndex !== undefined) {
          reorderWidget(meta.slotId, insertionIndex)
        }
        return
      }
      if (a.kind === "dock") {
        // Cross-surface dock → dashboard. v1 places at the first free
        // cell (via setPlacement); the user can re-position from there.
        // Step 5 will route this through the live insertion index.
        const item = usePlacement.getState().dock.find((p) => p.id === a.rawId)
        if (item) setPlacement(item.action, "dashboard")
        return
      }
      return
    }

    // === Within the dock ============================================
    if (a.kind === "dock" && o.kind === "dock") {
      const dock = usePlacement.getState().dock
      const fromIndex = dock.findIndex((p) => p.id === a.rawId)
      const toIndex = dock.findIndex((p) => p.id === o.rawId)
      if (fromIndex < 0 || toIndex < 0) return
      // Reorder by re-inserting into the dock array; mirrors the
      // legacy dashboard reorder flow before free-form positions
      // landed on the grid side.
      const next = dock.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      usePlacement.setState({ dock: next })
      return
    }

    // === Dashboard → Dock (only valid for launch tiles) =============
    if (a.kind === "dashboard" && o.kind === "dock") {
      if (!isPinnedTile(a.rawId)) return
      const slot = findSlot(usePlacement.getState().dashboardOrder, a.rawId)
      if (!slot || slot.kind !== "pinned") return
      setPlacement(slot.pinned.action, "dock")
      const dock = usePlacement.getState().dock
      const fromIndex = dock.findIndex((p) => p.id === a.rawId)
      const toIndex = dock.findIndex((p) => p.id === o.rawId)
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        const next = dock.slice()
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        usePlacement.setState({ dock: next })
      }
      return
    }

    // === Dock → Dashboard (over a specific dashboard widget) ========
    // Dashboard widgets are no longer droppables in the free-form
    // model, so this case only fires if a future change re-introduces
    // per-slot droppables. Routing via the grid container above is the
    // canonical path.
    if (a.kind === "dock" && o.kind === "dashboard") {
      const item = usePlacement.getState().dock.find((p) => p.id === a.rawId)
      if (item) setPlacement(item.action, "dashboard")
    }
  }

  // Keep the cursor reading "grabbing" for the duration of the drag,
  // even when the pointer drifts off the overlay onto a non-droppable
  // area. Without this the cursor flickers back to default whenever the
  // pointer leaves a draggable / droppable element, which makes the
  // drag feel uncertain.
  useEffect(() => {
    if (!activeDrag) return
    const previous = document.body.style.cursor
    document.body.style.cursor =
      activeDrag.gesture === "resize" ? "grabbing" : "grabbing"
    return () => {
      document.body.style.cursor = previous
    }
  }, [activeDrag])

  return (
    <DndContext
      sensors={sensors}
      // `pointerWithin` is required for the sortable grid: it only
      // surfaces a droppable when the pointer is genuinely inside it,
      // so dragging a launch tile *past* the dashboard's last row
      // toward an empty area no longer gets pulled into the dock by
      // distance (`closestCenter` would otherwise snap to the dock-zone
      // since its center sits closer to the cursor than any dashboard
      // cell). When the pointer lands on no droppable at all, `over`
      // is null and `handleDragEnd` falls back to committing the
      // live insertion index from the cursor anchor.
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <DragInfoContext.Provider value={activeDrag}>
        {children}
      </DragInfoContext.Provider>
      <DragOverlay
        dropAnimation={{
          duration: 180,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {activeDrag ? <DragPreview info={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

/**
 * Renders the cursor-following preview of the dragged item. The
 * `DragOverlay` container is auto-sized by dnd-kit to the active
 * node's measured rect, so we just fill it with `h-full w-full` and
 * add a subtle lift (shadow + ring + slight rotation) so the floating
 * element reads as "the thing I'm carrying" rather than a duplicate
 * of the placeholder left in the grid.
 *
 * Returns null for resize gestures — the floating handle would be a
 * tiny disembodied dot, which is just visual noise; the snap ghost
 * inside the grid is the active feedback for resize.
 */
function DragPreview({ info }: { info: DragInfo }) {
  if (info.gesture === "resize") return null
  if (info.preview.kind === "dashboard") {
    // Use the size token captured at drag start — the dragged slot's
    // footprint never changes mid-drag, only its position in the
    // order, so the floating preview reads at a stable density.
    return (
      <div className="h-full w-full overflow-hidden rounded-xl rotate-[1.5deg] cursor-grabbing shadow-2xl ring-1 ring-border">
        {renderWidget(info.preview.widget, info.preview.size)}
      </div>
    )
  }
  // Dock item — render at the user's current dock size. Use bottom-center
  // so the badge sits in its conventional top-right corner; the overlay
  // floats free of any specific dock edge.
  return <DockItemDragPreview item={info.preview.item} />
}

function DockItemDragPreview({
  item,
}: {
  item: Parameters<typeof renderDockButton>[0]
}) {
  const size = useDock((s) => s.size)
  return (
    <div className="rounded-lg cursor-grabbing shadow-2xl ring-1 ring-border bg-card">
      {renderDockButton(item, false, false, "bottom-center", size, () => {})}
    </div>
  )
}
