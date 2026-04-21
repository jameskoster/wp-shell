import {
  BarChart3,
  FileEdit,
  Megaphone,
  PackagePlus,
  Settings,
  ShoppingBag,
  Star,
  type LucideIcon,
} from "lucide-react"
import type { ContextRef, ContextType, Destination } from "./types"

type Meta = {
  defaultTitle: (params?: Record<string, string | number | undefined>) => string
  icon: LucideIcon
  description?: string
  keywords?: string[]
  singleton?: boolean
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
}

export function metaFor(type: ContextType): Meta {
  return CONTEXT_META[type]
}

export function titleFor(ref: ContextRef): string {
  return ref.title ?? metaFor(ref.type).defaultTitle(ref.params)
}

export function isSingleton(type: ContextType): boolean {
  return Boolean(metaFor(type).singleton)
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
]
