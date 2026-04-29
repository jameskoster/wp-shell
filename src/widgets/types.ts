import type { LucideIcon } from "lucide-react"
import type { ContextRef } from "@/contexts/types"
import type { ReactNode } from "react"

export type WidgetSize =
  | "sm"
  | "tall"
  | "md"
  | "lg"
  | "wide"
  | "xl"
  | "hero"

/**
 * Variants supported by `BadgeDescriptor` — kept as a literal union so
 * recipe data stays a value (not a reference into UI types). Mirrors
 * the variants exposed by `@/components/ui/badge` minus the cosmetic
 * `default` (which has no semantic meaning at the recipe layer).
 */
export type BadgeVariant =
  | "destructive"
  | "error"
  | "info"
  | "outline"
  | "secondary"
  | "success"
  | "warning"

/**
 * Compact, structured badge descriptor used by recipes. Recipes don't
 * import the UI Badge component directly; widget renderers translate
 * this shape into the actual visual.
 */
export type BadgeDescriptor = {
  label: string
  variant?: BadgeVariant
}

export type WidgetBase = {
  id: string
  title: string
  icon?: LucideIcon
  /**
   * Authored cell footprint. Either a named preset (`WidgetSize`) for
   * the common cases, or an explicit `{ w, h }` for widgets that need
   * a footprint the preset table doesn't cover (e.g. Site Preview's
   * 6×4 default). Resolved to cells via `resolveWidgetSize` at seed
   * time; after that the slot's `size` is the only source of truth.
   */
  size?: WidgetSize | CellSize
  /**
   * Lower bound on the slot's footprint, enforced by the resize
   * gesture and `resizeWidget`. Lets a widget declare "I'm illegible
   * below this size" — Site Preview, for example, sets `{ w: 3, h: 2 }`
   * so the homepage thumbnail never collapses to an unreadable strip.
   * Defaults to `{ w: 1, h: 1 }` when omitted.
   */
  minSize?: CellSize
  source?: string
  /**
   * Notification-style count rendered next to the widget's title. Used
   * to surface "this widget contains N items needing your attention"
   * (e.g. orders awaiting fulfilment). Renderers hide the badge when
   * the count is 0 or omitted. Distinct from `LaunchTileWidget.badge`,
   * which is a free-form string anchored to the tile body.
   */
  headerBadge?: number
}

export type LaunchTileWidget = WidgetBase & {
  kind: "launch"
  action: ContextRef
  description?: string
  badge?: string
}

/**
 * Visual hint rendered before an info list item's title. Variants
 * cover the four shapes the dashboard's lists actually need:
 *
 *  - `avatar` — round, for people (orders, comments, authors).
 *  - `image`  — rounded square, for products / featured images.
 *  - `site`   — rounded square, for referrer favicons.
 *  - `icon`   — rounded square, glyph fallback for entries with no
 *               natural image (e.g. "Search engines", "Direct").
 *
 * Each variant has a deterministic offline fallback (hashed pastel
 * background + initials/letter) so the prototype reads even without
 * network. When online, the `src` defaults derive from the seed
 * (pravatar / picsum / google favicon) and are overridable per item.
 */
export type ItemThumbnail =
  | { kind: "avatar"; name: string; src?: string }
  | { kind: "image"; seed: string; src?: string; alt?: string }
  | { kind: "site"; domain: string; src?: string; label?: string }
  | { kind: "icon"; icon: LucideIcon }

export type InfoListItem = {
  id: string
  title: string
  meta?: string
  action?: ContextRef
  thumbnail?: ItemThumbnail
  /**
   * Optional status pill rendered at the row's trailing edge. Carries
   * its own variant so callers can mirror the source-of-truth tone
   * (e.g. order status colours from `STATUS_VARIANT`) without the
   * widget having to know about each domain.
   */
  badge?: BadgeDescriptor
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

/**
 * A live preview of the site's homepage. Renders the same editor
 * `Canvas` the workspace renders (so the preview can't drift from the
 * "real" thing), scaled to fit the cell. Clicking anywhere opens
 * `action` — typically the Appearance / Editor workspace landed on the
 * homepage. Bespoke: ignores the `WidgetSize` density tokens, defaults
 * to a large `{ w: 6, h: 4 }` footprint, and declares a `minSize` so
 * the preview never collapses below readable.
 */
export type SitePreviewWidget = WidgetBase & {
  kind: "site-preview"
  action: ContextRef
  /**
   * URL displayed in the widget's address bar. Defaults to a
   * placeholder when omitted. Eventually this'll become the editable
   * field the user changes to swap the page being previewed.
   */
  url?: string
  /**
   * Optional override for the embedded canvas's homepage layout.
   * Recipes don't usually set this — the active site's
   * `frontPageVariant` is the single source of truth, so the editor
   * and the dashboard preview always agree. Reserved for future use
   * cases like previewing an alternate layout from a recipe.
   */
  homepageVariant?: "commerce" | "blog" | "publication" | "community"
}

export type WidgetDef =
  | LaunchTileWidget
  | InfoWidget
  | AnalyticsWidget
  | NavWidget
  | SitePreviewWidget

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
