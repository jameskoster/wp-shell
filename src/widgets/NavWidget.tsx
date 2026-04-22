import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useContexts } from "@/contexts/store"
import { cn } from "@/lib/utils"
import type { NavWidget as NavWidgetDef } from "./types"
import { WidgetMenu } from "./WidgetMenu"

export function NavWidget({
  widget,
  onCollapsedChange,
}: {
  widget: NavWidgetDef
  onCollapsedChange?: (collapsed: boolean) => void
}) {
  const open = useContexts((s) => s.open)
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      onCollapsedChange?.(next)
      return next
    })
  }

  const showHeader = !collapsed && Boolean(widget.title || widget.source)

  return (
    <Card className={cn("group h-full", collapsed && "w-fit")}>
      {!collapsed ? (
        <WidgetMenu
          widgetId={widget.id}
          className="absolute top-3 right-3 z-10"
        />
      ) : null}
      {showHeader ? (
        <CardHeader>
          {widget.title ? (
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          ) : null}
          {widget.source ? (
            <CardDescription className="text-[11px]">
              {widget.source}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardPanel className={showHeader ? "pt-0" : undefined}>
        <ul className={collapsed ? "" : "-mx-2"}>
          {widget.items.map((item) => {
            const Icon = item.icon
            const button = (
              <button
                type="button"
                onClick={(e) =>
                  open(item.action, e.currentTarget.getBoundingClientRect())
                }
                className={cn(
                  "outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50",
                  collapsed
                    ? "relative flex size-9 items-center justify-center rounded-md"
                    : "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start",
                )}
                aria-label={collapsed ? item.title : undefined}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "size-4",
                      collapsed ? "" : "text-muted-foreground",
                    )}
                  />
                ) : null}
                {!collapsed ? (
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.title}
                  </span>
                ) : null}
                {item.badge ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[11px]",
                      collapsed &&
                        "pointer-events-none absolute -top-1 -right-1",
                    )}
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </button>
            )
            return (
              <li key={item.id}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={button} />
                    <TooltipPopup side="right" sideOffset={6}>
                      {item.title}
                    </TooltipPopup>
                  </Tooltip>
                ) : (
                  button
                )}
              </li>
            )
          })}
          <li className={collapsed ? "mt-1" : "mt-1 border-t pt-1"}>
            {(() => {
              const toggleLabel = collapsed ? "Expand menu" : "Collapse menu"
              const toggleButton = (
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className={cn(
                    "outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 text-muted-foreground",
                    collapsed
                      ? "flex size-9 items-center justify-center rounded-md"
                      : "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start",
                  )}
                  aria-label={toggleLabel}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronLeft className="size-4" />
                  )}
                  {!collapsed ? (
                    <span className="min-w-0 flex-1 truncate text-sm">
                      Collapse
                    </span>
                  ) : null}
                </button>
              )
              return collapsed ? (
                <Tooltip>
                  <TooltipTrigger render={toggleButton} />
                  <TooltipPopup side="right" sideOffset={6}>
                    {toggleLabel}
                  </TooltipPopup>
                </Tooltip>
              ) : (
                toggleButton
              )
            })()}
          </li>
        </ul>
      </CardPanel>
    </Card>
  )
}
