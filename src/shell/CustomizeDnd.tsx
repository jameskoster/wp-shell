import { useState, type ReactNode } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { usePlacement } from "@/stores/placementStore"

/**
 * Identifier used by the cross-surface drag system.
 *
 *  - `dashboard:<id>` — a draggable widget in the dashboard. The id is
 *    either a pinned tile id (`tile:…`) or a recipe widget id.
 *  - `dock:<id>`      — a draggable launch tile in the dock.
 *  - `dock-zone`      — the dock container as a drop target (used when
 *    dragging a launch tile from the dashboard).
 *  - `remove-zone`    — the customize bar's "Drop here to remove" target.
 *
 * Every sortable item registers under one of the prefixed forms so the
 * drag-end handler can route the move by inspecting the prefix instead
 * of cross-referencing both stores on every drag.
 */
export const DASHBOARD_PREFIX = "dashboard:"
export const DOCK_PREFIX = "dock:"
export const DOCK_ZONE_ID = "dock-zone"
export const REMOVE_ZONE_ID = "remove-zone"

export function dashboardItemId(id: string): string {
  return `${DASHBOARD_PREFIX}${id}`
}
export function dockItemId(id: string): string {
  return `${DOCK_PREFIX}${id}`
}

function stripPrefix(id: string): {
  surface: "dashboard" | "dock" | "zone"
  rawId: string
} {
  if (id.startsWith(DASHBOARD_PREFIX)) {
    return { surface: "dashboard", rawId: id.slice(DASHBOARD_PREFIX.length) }
  }
  if (id.startsWith(DOCK_PREFIX)) {
    return { surface: "dock", rawId: id.slice(DOCK_PREFIX.length) }
  }
  return { surface: "zone", rawId: id }
}

/**
 * Read-only drag context published to descendants so they can adapt to
 * the in-flight drag (e.g. the customize bar swaps in the Remove zone,
 * the dock highlights when it's a valid drop target).
 */
export type DragInfo = {
  active: { id: string; surface: "dashboard" | "dock" | "zone"; rawId: string }
  /**
   * True when the dragged item is a launch tile (the only kind allowed
   * to land on the dock).
   */
  isLaunchTile: boolean
}

import { createContext, useContext } from "react"
const DragInfoContext = createContext<DragInfo | null>(null)
export function useActiveDrag(): DragInfo | null {
  return useContext(DragInfoContext)
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

  const reorderDashboard = usePlacement((s) => s.reorderDashboard)
  const setPlacement = usePlacement((s) => s.setPlacement)
  const removeWidget = usePlacement((s) => s.removeWidget)

  const [activeDrag, setActiveDrag] = useState<DragInfo | null>(null)

  function isPinnedTile(rawId: string): boolean {
    return rawId.startsWith("tile:")
  }

  function handleDragStart(e: DragStartEvent) {
    const { surface, rawId } = stripPrefix(String(e.active.id))
    if (surface === "zone") return
    setActiveDrag({
      active: { id: String(e.active.id), surface, rawId },
      isLaunchTile: surface === "dock" || isPinnedTile(rawId),
    })
  }

  function handleDragCancel() {
    setActiveDrag(null)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null)
    const active = e.active
    const over = e.over
    if (!over || active.id === over.id) return

    const a = stripPrefix(String(active.id))
    const o = stripPrefix(String(over.id))

    // === Drop on the Remove zone ====================================
    if (o.surface === "zone" && o.rawId === REMOVE_ZONE_ID) {
      const state = usePlacement.getState()
      if (a.surface === "dashboard") {
        const slot = state.dashboardOrder.find((s) =>
          s.kind === "pinned"
            ? s.pinned.id === a.rawId
            : s.widgetId === a.rawId,
        )
        if (!slot) return
        if (slot.kind === "pinned") {
          setPlacement(slot.pinned.action, "none")
        } else {
          removeWidget(slot.widgetId)
        }
        return
      }
      if (a.surface === "dock") {
        const item = state.dock.find((p) => p.id === a.rawId)
        if (item) setPlacement(item.action, "none")
      }
      return
    }

    // === Drop on the Dock zone (cross-surface from the dashboard) ====
    if (o.surface === "zone" && o.rawId === DOCK_ZONE_ID) {
      if (a.surface !== "dashboard" || !isPinnedTile(a.rawId)) return
      const slot = usePlacement
        .getState()
        .dashboardOrder.find(
          (s) => s.kind === "pinned" && s.pinned.id === a.rawId,
        )
      if (slot && slot.kind === "pinned") {
        setPlacement(slot.pinned.action, "dock")
      }
      return
    }

    // === Within the dashboard =======================================
    if (a.surface === "dashboard" && o.surface === "dashboard") {
      const order = usePlacement.getState().dashboardOrder
      const fromIndex = order.findIndex((s) =>
        s.kind === "pinned" ? s.pinned.id === a.rawId : s.widgetId === a.rawId,
      )
      const toIndex = order.findIndex((s) =>
        s.kind === "pinned" ? s.pinned.id === o.rawId : s.widgetId === o.rawId,
      )
      if (fromIndex < 0 || toIndex < 0) return
      reorderDashboard(fromIndex, toIndex)
      return
    }

    // === Within the dock ============================================
    if (a.surface === "dock" && o.surface === "dock") {
      const dock = usePlacement.getState().dock
      const fromIndex = dock.findIndex((p) => p.id === a.rawId)
      const toIndex = dock.findIndex((p) => p.id === o.rawId)
      if (fromIndex < 0 || toIndex < 0) return
      // Reorder by re-inserting into the dock array (mirrors the
      // dashboard reorder flow). We do this by setPlacement-ing the
      // moved item to dock again, then patching the order via a small
      // dedicated helper. To keep the placement store API tight we just
      // rebuild the dock array inline using the existing setter.
      const next = dock.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      usePlacement.setState({ dock: next })
      return
    }

    // === Dock → Dashboard ===========================================
    if (a.surface === "dock" && o.surface === "dashboard") {
      const item = usePlacement.getState().dock.find((p) => p.id === a.rawId)
      if (!item) return
      setPlacement(item.action, "dashboard")
      // If the user dropped on a specific dashboard slot, slot the new
      // tile in at that position rather than the end.
      const order = usePlacement.getState().dashboardOrder
      const targetIndex = order.findIndex((s) =>
        s.kind === "pinned" ? s.pinned.id === o.rawId : s.widgetId === o.rawId,
      )
      const newIndex = order.findIndex(
        (s) => s.kind === "pinned" && s.pinned.id === a.rawId,
      )
      if (targetIndex >= 0 && newIndex >= 0 && newIndex !== targetIndex) {
        reorderDashboard(newIndex, targetIndex)
      }
      return
    }

    // === Dashboard → Dock (only valid for launch tiles) =============
    if (a.surface === "dashboard" && o.surface === "dock") {
      if (!isPinnedTile(a.rawId)) return
      const slot = usePlacement
        .getState()
        .dashboardOrder.find(
          (s) => s.kind === "pinned" && s.pinned.id === a.rawId,
        )
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
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <DragInfoContext.Provider value={activeDrag}>
        {children}
      </DragInfoContext.Provider>
    </DndContext>
  )
}
