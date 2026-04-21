import {
  BarChart3,
  FileEdit,
  FileText,
  Megaphone,
  PackagePlus,
  PenSquare,
  Settings,
  ShoppingBag,
  Star,
  type LucideIcon,
} from "lucide-react"
import type {
  ContextParams,
  ContextRef,
  ContextType,
  Destination,
  EditorKind,
} from "./types"

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

export const DESTINATIONS: Destination[] = [
  {
    id: "add-product",
    type: "add-product",
    title: "Add product",
    description: "Create a new product",
    icon: CONTEXT_META["add-product"].icon,
    keywords: CONTEXT_META["add-product"].keywords,
  },
  {
    id: "edit-page-home",
    type: "edit-page",
    title: "Edit Home page",
    description: "Open the Home page in the editor",
    icon: CONTEXT_META["edit-page"].icon,
    keywords: ["home", "page"],
    params: { id: "home" },
  },
  {
    id: "edit-page-about",
    type: "edit-page",
    title: "Edit About page",
    icon: CONTEXT_META["edit-page"].icon,
    keywords: ["about", "page"],
    params: { id: "about" },
  },
  {
    id: "settings",
    type: "settings",
    title: "Settings",
    description: "Site and account settings",
    icon: CONTEXT_META.settings.icon,
    keywords: CONTEXT_META.settings.keywords,
  },
  {
    id: "orders",
    type: "orders",
    title: "Orders",
    description: CONTEXT_META.orders.description,
    icon: CONTEXT_META.orders.icon,
    keywords: CONTEXT_META.orders.keywords,
  },
  {
    id: "product-reviews",
    type: "product-reviews",
    title: "Product reviews",
    description: CONTEXT_META["product-reviews"].description,
    icon: CONTEXT_META["product-reviews"].icon,
    keywords: CONTEXT_META["product-reviews"].keywords,
  },
  {
    id: "marketing",
    type: "marketing",
    title: "Marketing",
    description: CONTEXT_META.marketing.description,
    icon: CONTEXT_META.marketing.icon,
    keywords: CONTEXT_META.marketing.keywords,
  },
  {
    id: "analytics",
    type: "analytics",
    title: "Analytics",
    description: CONTEXT_META.analytics.description,
    icon: CONTEXT_META.analytics.icon,
    keywords: CONTEXT_META.analytics.keywords,
  },
  {
    id: "pages",
    type: "pages",
    title: "Pages",
    description: CONTEXT_META.pages.description,
    icon: CONTEXT_META.pages.icon,
    keywords: CONTEXT_META.pages.keywords,
  },
  {
    id: "editor",
    type: "editor",
    title: "Editor",
    description: "Open the editor on the homepage",
    icon: CONTEXT_META.editor.icon,
    keywords: CONTEXT_META.editor.keywords,
  },
]
