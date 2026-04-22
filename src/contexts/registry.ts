import {
  BarChart3,
  FileEdit,
  FileText,
  Image,
  Megaphone,
  MessageSquare,
  Package,
  PackagePlus,
  Palette,
  PenSquare,
  Plug,
  Settings,
  ShoppingBag,
  Star,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type {
  ContextParams,
  ContextRef,
  ContextType,
  Destination,
  EditorKind,
} from "./types"
import { refKey } from "./url"

type Meta = {
  defaultTitle: (params?: ContextParams) => string
  icon: LucideIcon
  description?: string
  keywords?: string[]
  /**
   * Binary singleton flag — sugar for `singletonKey: () => 'default'`.
   * Prefer `singletonKey` when behaviour varies with params.
   */
  singleton?: boolean
  /**
   * Returns a stable key used to dedupe / focus an existing context of this
   * type. Returning `undefined` means "always create a new context"
   * (non-singleton). Returning a string means "find or create a context with
   * this key". Lets one context type be a default-singleton with optional
   * pinned instances (see `editor`).
   */
  singletonKey?: (params?: ContextParams) => string | undefined
  /**
   * Optional defaults applied when `open()` is called without params.
   * Useful for contexts that should always have *some* state (e.g. the
   * Editor always loads the homepage when reached without params).
   */
  resolveDefaultParams?: () => ContextParams | undefined
}

export const CONTEXT_META: Record<ContextType, Meta> = {
  "add-product": {
    defaultTitle: () => "Add product",
    icon: PackagePlus,
    description: "Create a new product",
    keywords: ["new", "product", "create", "store"],
  },
  "edit-page": {
    defaultTitle: (params) => {
      const id = params?.id
      if (id === undefined || id === null || id === "") return "Edit page"
      const s = String(id).replace(/-/g, " ")
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    icon: FileEdit,
    description: "Edit a page",
    keywords: ["page", "content", "edit"],
    /**
     * Dedupe by `id` so reopening Products / Users / Media / etc. focuses
     * the existing tile instead of stacking duplicates. Without an `id`
     * (e.g. a generic "Edit page" launch) we fall back to a single shared
     * default — there's no meaningful way to tell two id-less edit-page
     * contexts apart.
     */
    singletonKey: (params) =>
      params?.id ? String(params.id) : "default",
  },
  settings: {
    defaultTitle: () => "Settings",
    icon: Settings,
    description: "Site and account settings",
    keywords: ["preferences", "config", "admin"],
    singleton: true,
  },
  orders: {
    defaultTitle: () => "Orders",
    icon: ShoppingBag,
    description: "Manage and fulfill orders",
    keywords: ["orders", "fulfillment", "store", "commerce"],
    singleton: true,
  },
  "product-reviews": {
    defaultTitle: () => "Product reviews",
    icon: Star,
    description: "Customer reviews and ratings",
    keywords: ["reviews", "ratings", "feedback", "products"],
    singleton: true,
  },
  marketing: {
    defaultTitle: () => "Marketing",
    icon: Megaphone,
    description: "Campaigns, promotions, and email",
    keywords: ["marketing", "campaigns", "promotions", "email", "ads"],
    singleton: true,
  },
  analytics: {
    defaultTitle: () => "Analytics",
    icon: BarChart3,
    description: "Site and store performance",
    keywords: ["analytics", "stats", "performance", "insights", "reports"],
    singleton: true,
  },
  pages: {
    defaultTitle: () => "Pages",
    icon: FileText,
    description: "Manage your site's pages",
    keywords: ["pages", "content", "manage", "list"],
    singleton: true,
  },
  editor: {
    defaultTitle: (params) => {
      const id = params?.id
      if (!id) return "Editor"
      const s = String(id).replace(/-/g, " ")
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    icon: PenSquare,
    description: "Edit a page, post, template, or pattern",
    keywords: ["editor", "edit", "write", "block", "page", "post", "template"],
    /**
     * Hybrid singleton: a single shared default editor, plus opt-in pinned
     * instances keyed by `instanceId`. Clicking another page in the default
     * editor swaps the document; clicking with "Open in new context" creates
     * an independent instance for parallel editing.
     */
    singletonKey: (params) =>
      params?.instanceId ? String(params.instanceId) : "default",
    /**
     * When opened with no params (e.g. via the future site-preview dashboard
     * widget or a stale URL), default to editing the homepage.
     */
    resolveDefaultParams: () => ({ kind: "page", id: "home" }),
  },
}

export function metaFor(type: ContextType): Meta {
  return CONTEXT_META[type]
}

export function titleFor(ref: ContextRef): string {
  return ref.title ?? metaFor(ref.type).defaultTitle(ref.params)
}

/**
 * Resolve the canonical icon for a context ref. Some context types are
 * polymorphic across destinations — `edit-page` for example renders
 * Users, Plugins, Posts, etc. — so a single per-type icon isn't enough.
 * `DESTINATIONS` is the source of truth for those per-destination icons;
 * we fall back to the type-level meta icon for refs not represented
 * there (e.g. ad-hoc editor instances).
 */
export function iconFor(ref: ContextRef): LucideIcon {
  const target = refKey(ref)
  const dest = DESTINATIONS.find(
    (d) => refKey({ type: d.type, params: d.params }) === target
  )
  return dest?.icon ?? metaFor(ref.type).icon
}

export function isSingleton(type: ContextType): boolean {
  const meta = metaFor(type)
  return Boolean(meta.singleton || meta.singletonKey)
}

/**
 * Resolves the dedupe key for a context ref. Returns:
 *  - `undefined` for non-singleton types (always create a new context)
 *  - `'default'` for legacy `singleton: true` types
 *  - whatever the type's `singletonKey(params)` returns otherwise
 */
export function singletonKeyFor(
  type: ContextType,
  params?: ContextParams
): string | undefined {
  const meta = metaFor(type)
  if (meta.singletonKey) return meta.singletonKey(params)
  if (meta.singleton) return "default"
  return undefined
}

export function resolveDefaultParams(
  type: ContextType
): ContextParams | undefined {
  return metaFor(type).resolveDefaultParams?.()
}

/**
 * Maps an editor `kind` to the manage context it belongs to. The Editor
 * uses this to render a breadcrumb back to its parent dataview, regardless
 * of how the user actually arrived at the Editor (manage row click, deep
 * link, destinations list, future site-preview widget, …). Missing entries
 * degrade gracefully — the breadcrumb collapses to a single non-clickable
 * segment until the parent context ships.
 */
export const EDITOR_PARENT: Partial<Record<EditorKind, ContextRef>> = {
  page: { type: "pages" },
}

export function parentForEditor(
  kind: EditorKind | undefined
): ContextRef | undefined {
  if (!kind) return undefined
  return EDITOR_PARENT[kind]
}

/**
 * Top-level destinations exposed via the command palette. Mirrors the
 * "Classic admin" widget on the dashboard so users can reach the same set
 * of places from either surface.
 */
export const DESTINATIONS: Destination[] = [
  {
    id: "posts",
    type: "edit-page",
    title: "Posts",
    icon: FileText,
    keywords: ["posts", "articles", "blog", "content"],
    params: { id: "posts" },
    badge: "312",
  },
  {
    id: "pages",
    type: "pages",
    title: "Pages",
    icon: CONTEXT_META.pages.icon,
    keywords: CONTEXT_META.pages.keywords,
  },
  {
    id: "media",
    type: "edit-page",
    title: "Media",
    icon: Image,
    keywords: ["media", "library", "images", "uploads", "files"],
    params: { id: "media" },
  },
  {
    id: "comments",
    type: "edit-page",
    title: "Comments",
    icon: MessageSquare,
    keywords: ["comments", "moderation", "discussion"],
    params: { id: "comments" },
    badge: "3",
  },
  {
    id: "products",
    type: "edit-page",
    title: "Products",
    icon: Package,
    keywords: ["products", "catalog", "store", "inventory"],
    params: { id: "products" },
    badge: "186",
  },
  {
    id: "orders",
    type: "orders",
    title: "Orders",
    icon: CONTEXT_META.orders.icon,
    keywords: CONTEXT_META.orders.keywords,
    badge: "12",
  },
  {
    id: "product-reviews",
    type: "product-reviews",
    title: "Product reviews",
    icon: CONTEXT_META["product-reviews"].icon,
    keywords: CONTEXT_META["product-reviews"].keywords,
    badge: "8",
  },
  {
    id: "marketing",
    type: "marketing",
    title: "Marketing",
    icon: CONTEXT_META.marketing.icon,
    keywords: CONTEXT_META.marketing.keywords,
  },
  {
    id: "analytics",
    type: "analytics",
    title: "Analytics",
    icon: CONTEXT_META.analytics.icon,
    keywords: CONTEXT_META.analytics.keywords,
  },
  {
    id: "users",
    type: "edit-page",
    title: "Users",
    icon: Users,
    keywords: ["users", "accounts", "people", "members"],
    params: { id: "users" },
  },
  {
    id: "appearance",
    type: "edit-page",
    title: "Appearance",
    icon: Palette,
    keywords: ["appearance", "themes", "design", "customize"],
    params: { id: "appearance" },
  },
  {
    id: "plugins",
    type: "edit-page",
    title: "Plugins",
    icon: Plug,
    keywords: ["plugins", "extensions", "addons"],
    params: { id: "plugins" },
    badge: "2",
  },
  {
    id: "tools",
    type: "edit-page",
    title: "Tools",
    icon: Wrench,
    keywords: ["tools", "import", "export", "site health"],
    params: { id: "tools" },
  },
  {
    id: "settings",
    type: "settings",
    title: "Settings",
    icon: CONTEXT_META.settings.icon,
    keywords: CONTEXT_META.settings.keywords,
  },
]
