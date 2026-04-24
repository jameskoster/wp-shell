import { create } from "zustand"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { adminRecipe } from "@/recipes/admin"
import {
  CANONICAL_COLS,
  SIZE_TO_CELLS,
  firstFreeRect,
  overlapsAny,
} from "@/widgets/grid/canonicalGrid"
import type {
  DashboardSlot,
  GridRect,
  NavItem,
  NavWidget,
  PinnedItem,
  WidgetSize,
} from "@/widgets/types"

export type { PinnedItem, DashboardSlot } from "@/widgets/types"

export type Placement = "dashboard" | "dock" | "none"

type PlacementMeta = {
  title: string
  icon: PinnedItem["icon"]
  badge?: string
  description?: string
}

type PlacementState = {
  /**
   * Single list covering every dashboard slot — pinned launch tiles
   * AND recipe widgets (info, analytics). Each slot owns a canonical
   * `rect` (12-column coordinates); `WidgetGrid` reflows them per
   * breakpoint via `compact()`. Free-form moves and resizes mutate
   * `dashboardOrder` in place via `placeWidget` / `resizeWidget`.
   */
  dashboardOrder: DashboardSlot[]
  dock: PinnedItem[]
  /**
   * Recipe-sourced widgets the user has dismissed from the grid. The
   * Add widgets menu reads this list (alongside placement === "none"
   * pinned items) to decide what's offerable.
   */
  hiddenWidgetIds: string[]
  placementOf: (action: ContextRef) => Placement
  /**
   * Move an item between surfaces. `meta` is required when the item
   * isn't already pinned anywhere so we have something to render; when
   * the item already exists on either surface, the existing record is
   * moved verbatim and `meta` is ignored. New dashboard slots are
   * placed at the first free 1×1 cell on the canonical grid.
   */
  setPlacement: (
    action: ContextRef,
    next: Placement,
    meta?: PlacementMeta,
  ) => void
  /**
   * Remove any widget from the dashboard by id. Pinned launch tile ids
   * are dropped from `dashboardOrder`; recipe widget ids are added to
   * `hiddenWidgetIds` (and dropped from `dashboardOrder` if present),
   * so the Add widgets menu can surface them again.
   */
  removeWidget: (id: string) => void
  isHidden: (id: string) => boolean
  /**
   * Move an existing slot to a new canonical rect. No-op if the rect
   * overlaps any other slot's rect, or if `id` doesn't correspond to a
   * slot. Launch tile rects are forced to 1×1.
   */
  placeWidget: (id: string, rect: GridRect) => void
  /**
   * Resize an existing slot. Same overlap / launch-tile rules as
   * `placeWidget`. Useful as a separate action so the DnD layer can
   * route resize gestures distinctly from move gestures (and so we
   * keep the option to add resize-only validations later).
   */
  resizeWidget: (id: string, rect: GridRect) => void
  /**
   * Re-add a recipe widget that was previously dismissed via
   * `removeWidget`. Appends a fresh `recipe` slot at the first free
   * cell sized from the recipe's declarative size.
   */
  unhideWidget: (id: string) => void
  /**
   * Re-seed dashboard, dock, and hidden state from the recipe defaults.
   * Used by the Customize bar's "Reset to default" command.
   */
  resetToDefault: () => void
}

function pinnedIdFor(action: ContextRef): string {
  return `tile:${refKey(action)}`
}

function pinnedFromNavItem(item: NavItem): PinnedItem | null {
  if (!item.icon) return null
  return {
    id: pinnedIdFor(item.action),
    action: item.action,
    title: item.title,
    icon: item.icon,
    badge: item.badge,
  }
}

function allNavItems(): NavItem[] {
  return adminRecipe.widgets
    .filter((w): w is NavWidget => w.kind === "nav")
    .flatMap((w) => w.items)
}

/**
 * Look up a nav item whose action resolves to the same key as `action`.
 * Lets manually-added pins inherit any badge defined on the matching
 * nav item, so they look the same as seeded defaults.
 */
function navItemFor(action: ContextRef): NavItem | undefined {
  const key = refKey(action)
  return allNavItems().find((i) => refKey(i.action) === key)
}

function cellsForSize(size: WidgetSize | undefined): { w: number; h: number } {
  return SIZE_TO_CELLS[size ?? "md"]
}

/**
 * Identifier shared by both slot kinds — used by the DnD layer (which
 * sees only ids over the wire) to look up a slot in `dashboardOrder`.
 */
export function slotId(slot: DashboardSlot): string {
  return slot.kind === "pinned" ? slot.pinned.id : slot.widgetId
}

/** True when the slot's id is a pinned launch tile (always 1×1). */
function isLaunchSlot(slot: DashboardSlot): boolean {
  return slot.kind === "pinned"
}

function seedFromRecipe(): {
  dashboardOrder: DashboardSlot[]
  dock: PinnedItem[]
} {
  // Stage 1: build slot-without-rect entries in their seed order so
  // the canonical packer below can lay them out top-left first.
  // Analytics + info widgets are seeded BEFORE pinned launch tiles so
  // data-rich widgets occupy the top of the dashboard and the smaller
  // 1×1 launch tiles for less-prominent contexts flow underneath.
  type Pending =
    | { kind: "pinned"; pinned: PinnedItem; cells: { w: number; h: number } }
    | {
        kind: "recipe"
        widgetId: string
        cells: { w: number; h: number }
      }
  const pending: Pending[] = []
  const dock: PinnedItem[] = []

  for (const w of adminRecipe.widgets) {
    if (w.kind !== "info" && w.kind !== "analytics") continue
    pending.push({
      kind: "recipe",
      widgetId: w.id,
      cells: cellsForSize(w.size),
    })
  }

  for (const item of allNavItems()) {
    const pinned = pinnedFromNavItem(item)
    if (!pinned) continue
    if (item.defaultPlacement === "dashboard") {
      pending.push({ kind: "pinned", pinned, cells: { w: 1, h: 1 } })
    } else {
      dock.push(pinned)
    }
  }

  // Stage 2: pack into canonical 12-col coordinates with first-fit.
  const placedRects: GridRect[] = []
  const dashboardOrder: DashboardSlot[] = pending.map((p) => {
    const rect = firstFreeRect(placedRects, CANONICAL_COLS, p.cells.w, p.cells.h)
    placedRects.push(rect)
    return p.kind === "pinned"
      ? { kind: "pinned", pinned: p.pinned, rect }
      : { kind: "recipe", widgetId: p.widgetId, rect }
  })

  return { dashboardOrder, dock }
}

/** True when `slot` is a pinned launch tile with the given `pinnedId`. */
function isPinnedSlot(slot: DashboardSlot, pinnedId: string): boolean {
  return slot.kind === "pinned" && slot.pinned.id === pinnedId
}

/** True when `slot` is a recipe widget with the given `widgetId`. */
function isRecipeSlot(slot: DashboardSlot, widgetId: string): boolean {
  return slot.kind === "recipe" && slot.widgetId === widgetId
}

/**
 * Apply `transform` to the slot in `order` whose id is `id`, returning
 * the new array (or the original reference if `id` isn't found, so
 * Zustand can short-circuit). Centralised so move / resize share the
 * same lookup + immutable-update plumbing.
 */
function updateSlotById(
  order: DashboardSlot[],
  id: string,
  transform: (s: DashboardSlot) => DashboardSlot,
): DashboardSlot[] {
  const idx = order.findIndex((s) => slotId(s) === id)
  if (idx < 0) return order
  const next = order.slice()
  next[idx] = transform(order[idx])
  return next
}

/**
 * Validate a candidate rect against the rest of the dashboard. Launch
 * tiles are coerced to 1×1 (clamped at the col/row anchor). Returns
 * the normalised rect on success, or `null` if it would overlap.
 */
function validateRect(
  order: DashboardSlot[],
  id: string,
  rect: GridRect,
  isLaunch: boolean,
): GridRect | null {
  const normalised: GridRect = isLaunch
    ? { col: rect.col, row: rect.row, w: 1, h: 1 }
    : rect
  const others = order.filter((s) => slotId(s) !== id).map((s) => s.rect)
  if (overlapsAny(normalised, others)) return null
  return normalised
}

export const usePlacement = create<PlacementState>((set, get) => {
  const seed = seedFromRecipe()
  return {
    dashboardOrder: seed.dashboardOrder,
    dock: seed.dock,
    hiddenWidgetIds: [],

    placementOf: (action) => {
      const id = pinnedIdFor(action)
      const state = get()
      if (state.dashboardOrder.some((s) => isPinnedSlot(s, id))) {
        return "dashboard"
      }
      if (state.dock.some((p) => p.id === id)) return "dock"
      return "none"
    },

    setPlacement: (action, next, meta) => {
      const id = pinnedIdFor(action)
      const state = get()

      const existingDashboardSlot = state.dashboardOrder.find((s) =>
        isPinnedSlot(s, id),
      )
      const existingPinned: PinnedItem | undefined =
        existingDashboardSlot?.kind === "pinned"
          ? existingDashboardSlot.pinned
          : state.dock.find((p) => p.id === id)

      const nextOrder = state.dashboardOrder.filter(
        (s) => !isPinnedSlot(s, id),
      )
      const nextDock = state.dock.filter((p) => p.id !== id)

      if (next === "none") {
        const noChange =
          nextOrder.length === state.dashboardOrder.length &&
          nextDock.length === state.dock.length
        if (noChange) return
        set({ dashboardOrder: nextOrder, dock: nextDock })
        return
      }

      let item: PinnedItem | null = existingPinned ?? null
      if (!item) {
        if (!meta) return
        const navMatch = navItemFor(action)
        item = {
          id,
          action,
          title: meta.title,
          icon: meta.icon,
          badge: meta.badge ?? navMatch?.badge,
          description: meta.description,
        }
      }

      if (next === "dashboard") {
        // Allocate a fresh 1×1 cell for the new launch tile so it
        // never overlaps an existing slot.
        const rect = firstFreeRect(
          nextOrder.map((s) => s.rect),
          CANONICAL_COLS,
          1,
          1,
        )
        set({
          dashboardOrder: [
            ...nextOrder,
            { kind: "pinned", pinned: item, rect },
          ],
          dock: nextDock,
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      } else {
        set({
          dashboardOrder: nextOrder,
          dock: [...nextDock, item],
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      }
    },

    removeWidget: (id) => {
      const state = get()

      const pinnedSlot = state.dashboardOrder.find((s) => isPinnedSlot(s, id))
      if (pinnedSlot) {
        set({
          dashboardOrder: state.dashboardOrder.filter(
            (s) => !isPinnedSlot(s, id),
          ),
        })
        return
      }

      const recipeSlot = state.dashboardOrder.find((s) => isRecipeSlot(s, id))
      const alreadyHidden = state.hiddenWidgetIds.includes(id)
      if (!recipeSlot && alreadyHidden) return
      set({
        dashboardOrder: recipeSlot
          ? state.dashboardOrder.filter((s) => !isRecipeSlot(s, id))
          : state.dashboardOrder,
        hiddenWidgetIds: alreadyHidden
          ? state.hiddenWidgetIds
          : [...state.hiddenWidgetIds, id],
      })
    },

    isHidden: (id) => get().hiddenWidgetIds.includes(id),

    placeWidget: (id, rect) => {
      const state = get()
      const slot = state.dashboardOrder.find((s) => slotId(s) === id)
      if (!slot) return
      const valid = validateRect(state.dashboardOrder, id, rect, isLaunchSlot(slot))
      if (!valid) return
      const next = updateSlotById(state.dashboardOrder, id, (s) => ({
        ...s,
        rect: valid,
      }))
      if (next === state.dashboardOrder) return
      set({ dashboardOrder: next })
    },

    resizeWidget: (id, rect) => {
      const state = get()
      const slot = state.dashboardOrder.find((s) => slotId(s) === id)
      if (!slot) return
      // Launch tiles can't resize — silently ignore so the DnD layer
      // doesn't have to special-case the affordance.
      if (isLaunchSlot(slot)) return
      const valid = validateRect(state.dashboardOrder, id, rect, false)
      if (!valid) return
      const next = updateSlotById(state.dashboardOrder, id, (s) => ({
        ...s,
        rect: valid,
      }))
      if (next === state.dashboardOrder) return
      set({ dashboardOrder: next })
    },

    unhideWidget: (id) => {
      const state = get()
      if (!state.hiddenWidgetIds.includes(id)) return
      const recipeWidget = adminRecipe.widgets.find((w) => w.id === id)
      const isRecipeWidget =
        recipeWidget?.kind === "info" || recipeWidget?.kind === "analytics"
      if (!isRecipeWidget) {
        // Defensive — only recipe widgets land in hiddenWidgetIds, but
        // if something stale is in there, clear it without trying to
        // re-add a slot for an unknown id.
        set({
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
        return
      }
      const cells = cellsForSize(recipeWidget.size)
      const rect = firstFreeRect(
        state.dashboardOrder.map((s) => s.rect),
        CANONICAL_COLS,
        cells.w,
        cells.h,
      )
      set({
        hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        dashboardOrder: [
          ...state.dashboardOrder,
          { kind: "recipe", widgetId: id, rect },
        ],
      })
    },

    resetToDefault: () => {
      const fresh = seedFromRecipe()
      set({
        dashboardOrder: fresh.dashboardOrder,
        dock: fresh.dock,
        hiddenWidgetIds: [],
      })
    },
  }
})
