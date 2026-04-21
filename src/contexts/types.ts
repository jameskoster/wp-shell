import type { LucideIcon } from "lucide-react"

export type ContextType =
  | "add-product"
  | "edit-page"
  | "settings"

export type ContextParams = Record<string, string | number | undefined>

export type Context = {
  id: string
  type: ContextType
  title: string
  icon?: LucideIcon
  params?: ContextParams
  openedAt: number
  lastFocusedAt: number
}

export type ContextRef = {
  type: ContextType
  params?: ContextParams
  title?: string
}

export type Destination = {
  id: string
  type: ContextType
  title: string
  description?: string
  icon?: LucideIcon
  keywords?: string[]
  params?: ContextParams
}
