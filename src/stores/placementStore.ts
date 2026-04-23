import { create } from "zustand"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { adminRecipe } from "@/recipes/admin"
import type {
  AnalyticsWidget,
  DashboardSlot,
  InfoWidget,
  NavItem,
  NavWidget,
  PinnedItem,
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
   * Single ordered list covering every dashboard slot — pinned launch
   * tiles AND recipe widgets (info, analytics). The Customize-mode DnD
   * mutates `dashboardOrder` directly via `reorderDashboard`.
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
   * moved verbatim and `meta` is ignored.
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
   * Reorder the dashboard grid. Indexes are positions in the rendered
   * order (i.e. positions in `dashboardOrder`). Out-of-range or no-op
   * moves are ignored.
   */
  reorderDashboard: (fromIndex: number, toIndex: number) => void
  /**
   * Re-add a recipe widget that was previously dismissed via
   * `removeWidget`. Appends a fresh `recipe` slot at the end of the
   * dashboard.
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

function seedFromRecipe(): {
  dashboardOrder: DashboardSlot[]
  dock: PinnedItem[]
} {
  const pinnedSlots: DashboardSlot[] = []
  const dock: PinnedItem[] = []
  for (const item of allNavItems()) {
    const pinned = pinnedFromNavItem(item)
    if (!pinned) continue
    if (item.defaultPlacement === "dashboard") {
      pinnedSlots.push({ kind: "pinned", pinned })
    } else {
      dock.push(pinned)
    }
  }

  // Mirror today's render order: pinned launch tiles first, then the
  // recipe's non-launch / non-nav widgets in their declared order.
  const recipeSlots: DashboardSlot[] = adminRecipe.widgets
    .filter(
      (w): w is InfoWidget | AnalyticsWidget =>
        w.kind === "info" || w.kind === "analytics",
    )
    .map((w) => ({ kind: "recipe", widgetId: w.id }))

  return { dashboardOrder: [...pinnedSlots, ...recipeSlots], dock }
}

/** True when `slot` is a pinned launch tile with the given `pinnedId`. */
function isPinnedSlot(slot: DashboardSlot, pinnedId: string): boolean {
  return slot.kind === "pinned" && slot.pinned.id === pinnedId
}

/** True when `slot` is a recipe widget with the given `widgetId`. */
function isRecipeSlot(slot: DashboardSlot, widgetId: string): boolean {
  return slot.kind === "recipe" && slot.widgetId === widgetId
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
        set({
          dashboardOrder: [...nextOrder, { kind: "pinned", pinned: item }],
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

      // Pinned launch tile? Drop it from the dashboard order.
      const pinnedSlot = state.dashboardOrder.find((s) => isPinnedSlot(s, id))
      if (pinnedSlot) {
        set({
          dashboardOrder: state.dashboardOrder.filter(
            (s) => !isPinnedSlot(s, id),
          ),
        })
        return
      }

      // Recipe widget? Drop the slot AND remember the dismissal so the
      // Add widgets menu can offer it back.
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

    reorderDashboard: (fromIndex, toIndex) => {
      const state = get()
      const order = state.dashboardOrder
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= order.length ||
        toIndex >= order.length
      ) {
        return
      }
      const next = order.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      set({ dashboardOrder: next })
    },

    unhideWidget: (id) => {
      const state = get()
      if (!state.hiddenWidgetIds.includes(id)) return
      const isRecipeWidget = adminRecipe.widgets.some((w) => w.id === id)
      if (!isRecipeWidget) {
        // Defensive — only recipe widgets land in hiddenWidgetIds, but
        // if something stale is in there, clear it without trying to
        // re-add a slot for an unknown id.
        set({
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
        return
      }
      set({
        hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        dashboardOrder: [
          ...state.dashboardOrder,
          { kind: "recipe", widgetId: id },
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
