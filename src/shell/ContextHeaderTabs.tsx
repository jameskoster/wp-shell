import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ContextHeaderTabsProps = {
  children: ReactNode
  className?: string
  /** Accessible label for the navigation landmark. */
  label?: string
}

/**
 * Horizontal navigation row that lives as the second row inside
 * `<ContextHeader>`. Used for secondary navigation within a workspace
 * (e.g. Shipping → Zones / Classes / Methods) or as the *primary*
 * navigation in workspaces that don't use a sidebar (e.g. Marketing).
 *
 * Semantically a `<nav>` with buttons that carry `aria-current="page"`
 * for the active item — *not* an ARIA tablist. Activating an item
 * changes URL params and the workspace state, not just a panel within
 * the same view.
 */
export function ContextHeaderTabs({
  children,
  className,
  label = "Section",
}: ContextHeaderTabsProps) {
  return (
    <nav aria-label={label} className={cn("flex items-center gap-4", className)}>
      {children}
    </nav>
  )
}

type TabProps = {
  active?: boolean
  icon?: LucideIcon
  count?: number | string
  onClick?: () => void
  children: ReactNode
  className?: string
}

function Tab({ active, icon: Icon, count, onClick, children, className }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-none border-b-2 py-1.5 text-sm outline-none transition-colors",
        "focus-visible:bg-accent/40",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-foreground" : "text-muted-foreground"
          )}
        />
      ) : null}
      <span>{children}</span>
      {count !== undefined && count !== "" ? (
        <span
          className={cn(
            "shrink-0 rounded-sm px-1.5 text-[11px] tabular-nums",
            active
              ? "bg-accent/60 text-foreground"
              : "text-muted-foreground/80"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

ContextHeaderTabs.Tab = Tab
