import type { LucideIcon } from "lucide-react"
import type { ContextRef } from "@/contexts/types"
import type { ReactNode } from "react"

export type WidgetSize = "sm" | "tall" | "md" | "lg" | "xl"

export type WidgetBase = {
  id: string
  title: string
  icon?: LucideIcon
  size?: WidgetSize
  source?: string
}

export type LaunchTileWidget = WidgetBase & {
  kind: "launch"
  action: ContextRef
  description?: string
  badge?: string
}

export type InfoListItem = {
  id: string
  title: string
  meta?: string
  action?: ContextRef
}

export type InfoWidget = WidgetBase & {
  kind: "info"
  items?: InfoListItem[]
  render?: () => ReactNode
}

export type MetricDef = {
  value: string
  delta?: { value: string; trend: "up" | "down" | "flat" }
  sparkline?: number[]
  caption?: string
}

export type AnalyticsWidget = WidgetBase & {
  kind: "analytics"
  metric: MetricDef
}

export type NavItem = {
  id: string
  title: string
  icon?: LucideIcon
  action: ContextRef
  badge?: string
  // When seeding the placement store, items default to the dock unless
  // tagged otherwise. Items the recipe wants front-and-center on first
  // load should set `"dashboard"`.
  defaultPlacement?: "dock" | "dashboard"
}

export type NavWidget = Omit<WidgetBase, "title"> & {
  kind: "nav"
  title?: string
  items: NavItem[]
}

export type WidgetDef =
  | LaunchTileWidget
  | InfoWidget
  | AnalyticsWidget
  | NavWidget

export type Recipe = {
  id: string
  role: string
  widgets: WidgetDef[]
}

/**
 * A pinned item lives on exactly one surface at a time. Both the
 * dashboard's launch tiles and the dock render `PinnedItem`s; mutual
 * exclusivity is enforced by `setPlacement`, which always removes the
 * item from whichever list currently holds it before appending to its
 * destination.
 */
export type PinnedItem = {
  id: string
  action: ContextRef
  title: string
  icon: LucideIcon
  description?: string
  badge?: string
}

/**
 * Position + size on the canonical 12-column dashboard grid. Origin is
 * top-left, all values are integer cell counts. The canonical width is
 * always 12; smaller breakpoints reflow via `pack()` rather than
 * storing per-breakpoint coordinates.
 *
 * Authored slots no longer carry a rect — position is derived from
 * array order via the row-major packer. `GridRect` survives as the
 * shape `pack()` *returns* (and the DnD layer reasons about), but it
 * never appears in the persisted store.
 *
 * Launch tiles are forced to `w: 1, h: 1`; non-launch widgets accept
 * any `w: 1..12, h: 1..N`.
 */
export type GridRect = { col: number; row: number; w: number; h: number }

/** Cell footprint authored on a slot. Position falls out of `pack()`. */
export type CellSize = { w: number; h: number }

/**
 * Entry in the dashboard grid. A slot is either:
 *
 *  - `pinned`  — a launch tile pinned by the user (or seeded from a nav
 *    item with `defaultPlacement: "dashboard"`). The full PinnedItem is
 *    inlined so the slot is self-contained — no foreign-key drift if
 *    the pin's source data changes shape.
 *  - `recipe` — references a recipe widget by id (info, analytics, …).
 *
 * Each slot owns a canonical `size` (cell footprint) and its position
 * in the `dashboardOrder` array is its position in row-major reading
 * order. `WidgetGrid` derives the actual `rect` per breakpoint via
 * `pack()`. A widget is on the dashboard iff it appears in
 * `dashboardOrder`; recipe widgets dismissed via the per-widget menu
 * are absent from the array AND mirrored in `hiddenWidgetIds` so the
 * Add widgets menu can offer them back.
 */
export type DashboardSlot =
  | { kind: "pinned"; pinned: PinnedItem; size: CellSize }
  | { kind: "recipe"; widgetId: string; size: CellSize }
