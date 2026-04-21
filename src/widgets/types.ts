import type { LucideIcon } from "lucide-react"
import type { ContextRef } from "@/contexts/types"
import type { ReactNode } from "react"

export type WidgetSize = "sm" | "md" | "lg"

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
}

export type NavWidget = WidgetBase & {
  kind: "nav"
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
