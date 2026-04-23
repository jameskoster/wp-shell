import type { LucideIcon } from "lucide-react"
import { create } from "zustand"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { adminRecipe } from "@/recipes/admin"
import type { NavItem, NavWidget } from "@/widgets/types"

/**
 * A pinned item lives on exactly one surface at a time. The dashboard and
 * the dock both render `PinnedItem`s; mutual exclusivity is enforced by
 * `setPlacement`, which always removes the item from whichever list
 * currently holds it before appending to its destination.
 */
export type PinnedItem = {
  id: string
  action: ContextRef
  title: string
  icon: LucideIcon
  description?: string
  badge?: string
}

export type Placement = "dashboard" | "dock" | "none"

type PlacementMeta = {
  title: string
  icon: LucideIcon
  badge?: string
  description?: string
}

type PlacementState = {
  dashboard: PinnedItem[]
  dock: PinnedItem[]
  /**
   * Non-launch widgets the user has dismissed from the grid (info,
   * analytics, etc.). Kept here for parity with the previous store.
   */
  hiddenWidgetIds: string[]
  placementOf: (action: ContextRef) => Placement
  /**
   * Move an item between surfaces. `meta` is required when the item isn't
   * already pinned anywhere so we have something to render; when the item
   * already exists in `dashboard` or `dock`, the existing record is moved
   * verbatim and `meta` is ignored.
   */
  setPlacement: (
    action: ContextRef,
    next: Placement,
    meta?: PlacementMeta,
  ) => void
  removeWidget: (id: string) => void
  isHidden: (id: string) => boolean
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
 * Lets manually-added pins inherit any badge defined on the matching nav
 * item, so they look the same as seeded defaults.
 */
function navItemFor(action: ContextRef): NavItem | undefined {
  const key = refKey(action)
  return allNavItems().find((i) => refKey(i.action) === key)
}

function seedFromRecipe(): { dashboard: PinnedItem[]; dock: PinnedItem[] } {
  const dashboard: PinnedItem[] = []
  const dock: PinnedItem[] = []
  for (const item of allNavItems()) {
    const pinned = pinnedFromNavItem(item)
    if (!pinned) continue
    if (item.defaultPlacement === "dashboard") dashboard.push(pinned)
    else dock.push(pinned)
  }
  return { dashboard, dock }
}

export const usePlacement = create<PlacementState>((set, get) => {
  const seed = seedFromRecipe()
  return {
    dashboard: seed.dashboard,
    dock: seed.dock,
    hiddenWidgetIds: [],
    placementOf: (action) => {
      const id = pinnedIdFor(action)
      const state = get()
      if (state.dashboard.some((p) => p.id === id)) return "dashboard"
      if (state.dock.some((p) => p.id === id)) return "dock"
      return "none"
    },
    setPlacement: (action, next, meta) => {
      const id = pinnedIdFor(action)
      const state = get()
      const existing =
        state.dashboard.find((p) => p.id === id) ??
        state.dock.find((p) => p.id === id)

      const nextDashboard = state.dashboard.filter((p) => p.id !== id)
      const nextDock = state.dock.filter((p) => p.id !== id)

      if (next === "none") {
        if (
          nextDashboard.length === state.dashboard.length &&
          nextDock.length === state.dock.length
        )
          return
        set({ dashboard: nextDashboard, dock: nextDock })
        return
      }

      let item: PinnedItem | null = existing ?? null
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
          dashboard: [...nextDashboard, item],
          dock: nextDock,
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      } else {
        set({
          dashboard: nextDashboard,
          dock: [...nextDock, item],
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      }
    },
    /**
     * Remove any widget from the dashboard by id. If the id matches a
     * pinned tile we drop it; otherwise (recipe-sourced widgets like info
     * / analytics) we add it to `hiddenWidgetIds` so the Dashboard can
     * filter it out.
     */
    removeWidget: (id) => {
      const state = get()
      const isPinned = state.dashboard.some((p) => p.id === id)
      if (isPinned) {
        set({ dashboard: state.dashboard.filter((p) => p.id !== id) })
        return
      }
      if (state.hiddenWidgetIds.includes(id)) return
      set({ hiddenWidgetIds: [...state.hiddenWidgetIds, id] })
    },
    isHidden: (id) => get().hiddenWidgetIds.includes(id),
  }
})
