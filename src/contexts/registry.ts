import {
  PackagePlus,
  FileEdit,
  Settings,
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
    defaultTitle: (params) => (params?.id ? `Edit page #${params.id}` : "Edit page"),
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
]
