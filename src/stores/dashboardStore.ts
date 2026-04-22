import type { LucideIcon } from "lucide-react"
import { create } from "zustand"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { adminRecipe } from "@/recipes/admin"
import type { NavItem, NavWidget } from "@/widgets/types"

export type DashboardLaunchTile = {
  id: string
  action: ContextRef
  title: string
  icon: LucideIcon
  description?: string
  badge?: string
}

type DashboardState = {
  tiles: DashboardLaunchTile[]
  hiddenWidgetIds: string[]
  hasTile: (action: ContextRef) => boolean
  addTile: (tile: Omit<DashboardLaunchTile, "id">) => void
  removeTile: (action: ContextRef) => void
  removeWidget: (id: string) => void
  isHidden: (id: string) => boolean
}

const DEFAULT_NAV_TILE_IDS = [
  "n-pages",
  "n-orders",
  "n-marketing",
  "n-analytics",
  "n-products",
] as const

function tileIdFor(action: ContextRef): string {
  return `tile:${refKey(action)}`
}

function tileFromNavItem(item: NavItem): DashboardLaunchTile | null {
  if (!item.icon) return null
  return {
    id: tileIdFor(item.action),
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
 * Lets tiles created from a context inherit any badge defined on the
 * matching nav item, so manually-added tiles look the same as seeded
 * defaults.
 */
function navItemFor(action: ContextRef): NavItem | undefined {
  const key = refKey(action)
  return allNavItems().find((i) => refKey(i.action) === key)
}

function seedTiles(): DashboardLaunchTile[] {
  const items = allNavItems()
  const tiles: DashboardLaunchTile[] = []
  for (const id of DEFAULT_NAV_TILE_IDS) {
    const item = items.find((i) => i.id === id)
    if (!item) continue
    const tile = tileFromNavItem(item)
    if (tile) tiles.push(tile)
  }
  return tiles
}

export const useDashboard = create<DashboardState>((set, get) => ({
  tiles: seedTiles(),
  hiddenWidgetIds: [],
  hasTile: (action) => {
    const id = tileIdFor(action)
    return get().tiles.some((t) => t.id === id)
  },
  addTile: (tile) => {
    const id = tileIdFor(tile.action)
    const state = get()
    if (state.tiles.some((t) => t.id === id)) return
    const navMatch = navItemFor(tile.action)
    set({
      tiles: [
        ...state.tiles,
        { ...tile, id, badge: tile.badge ?? navMatch?.badge },
      ],
      hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
    })
  },
  removeTile: (action) => {
    const id = tileIdFor(action)
    set({ tiles: get().tiles.filter((t) => t.id !== id) })
  },
  /**
   * Remove any widget from the dashboard by id. If the id matches a launch
   * tile we drop it from `tiles`; otherwise (recipe-sourced widgets like
   * info / analytics / nav) we add it to `hiddenWidgetIds` so the Dashboard
   * can filter it out.
   */
  removeWidget: (id) => {
    const state = get()
    const isTile = state.tiles.some((t) => t.id === id)
    if (isTile) {
      set({ tiles: state.tiles.filter((t) => t.id !== id) })
      return
    }
    if (state.hiddenWidgetIds.includes(id)) return
    set({ hiddenWidgetIds: [...state.hiddenWidgetIds, id] })
  },
  isHidden: (id) => get().hiddenWidgetIds.includes(id),
}))
