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
  greeting: string
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
 * Ordered entry in the dashboard grid. A slot is either:
 *
 *  - `pinned`  — a launch tile pinned by the user (or seeded from a nav
 *    item with `defaultPlacement: "dashboard"`). The full PinnedItem is
 *    inlined so the slot is self-contained — no foreign-key drift if
 *    the pin's source data changes shape.
 *  - `recipe` — references a recipe widget by id (info, analytics, …).
 *    `sizeOverride` is reserved for a future per-widget resize gesture
 *    inside Customize mode and is not consumed yet.
 *
 * The `dashboardOrder` array on the placement store is the single source
 * of truth for both ordering AND inclusion: a recipe widget that's been
 * dismissed via the per-widget menu is absent from the array (and its id
 * is mirrored into `hiddenWidgetIds` so the Add widgets menu can offer
 * it back).
 */
export type DashboardSlot =
  | { kind: "pinned"; pinned: PinnedItem }
  | { kind: "recipe"; widgetId: string; sizeOverride?: WidgetSize }
