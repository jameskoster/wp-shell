import { ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useContextLayout } from "./ContextLayout"

type ContextSubnavProps = {
  children: ReactNode
  className?: string
  collapsible?: boolean
  header?: ReactNode
}

export function ContextSubnav({
  children,
  className,
  collapsible = true,
  header,
}: ContextSubnavProps) {
  const { collapsed, toggleCollapsed } = useContextLayout()
  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex shrink-0 flex-col border-r bg-background/40 transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-56",
        className
      )}
      aria-label="Section navigation"
    >
      {(header || collapsible) && (
        <div
          className={cn(
            "flex items-center gap-1 border-b px-2 py-2",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && header ? (
            <div className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
              {header}
            </div>
          ) : null}
          {collapsible ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:bg-accent/50"
            >
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-2 py-2">{children}</nav>
    </aside>
  )
}

function Group({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  const { collapsed } = useContextLayout()
  return (
    <div className={cn("mb-3 last:mb-0", className)}>
      {label && !collapsed ? (
        <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
          {label}
        </div>
      ) : null}
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  )
}

type ItemProps = {
  active?: boolean
  icon?: LucideIcon
  count?: number | string
  onClick?: () => void
  children?: ReactNode
  title?: string
  className?: string
}

function Item({
  active,
  icon: Icon,
  count,
  onClick,
  children,
  title,
  className,
}: ItemProps) {
  const { collapsed } = useContextLayout()
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={collapsed && typeof children === "string" ? children : title}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground focus-visible:bg-accent/40",
          className
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "size-4 shrink-0",
              active ? "text-accent-foreground" : "text-muted-foreground"
            )}
          />
        ) : null}
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {count !== undefined && count !== "" ? (
              <span
                className={cn(
                  "shrink-0 rounded-sm px-1.5 text-[11px] tabular-nums",
                  active
                    ? "bg-background/60 text-foreground"
                    : "text-muted-foreground/80 group-hover:text-muted-foreground"
                )}
              >
                {count}
              </span>
            ) : null}
          </>
        ) : null}
      </button>
    </li>
  )
}

ContextSubnav.Group = Group
ContextSubnav.Item = Item
