import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useContexts } from "@/contexts/store"
import { cn } from "@/lib/utils"
import type { NavWidget as NavWidgetDef, WidgetSize } from "./types"
import { WidgetMenu } from "./WidgetMenu"

// TODO: dock — explore promoting this surface out of the widget grid into
// an iOS/macOS-style Dock once the broader shell direction is settled.
export function NavWidget({
  widget,
  size = "lg",
}: {
  widget: NavWidgetDef
  size?: WidgetSize
}) {
  const open = useContexts((s) => s.open)

  // sm/tall cells are too narrow for full labels — show icon-only with
  // tooltips, mirroring how a future Dock surface might read.
  const iconOnly = size === "sm" || size === "tall"
  const showHeader = !iconOnly && Boolean(widget.title || widget.source)

  return (
    <Card className="group h-full overflow-hidden">
      <WidgetMenu
        widgetId={widget.id}
        className="absolute top-3 right-3 z-10"
      />
      {showHeader ? (
        <CardHeader>
          {widget.title ? (
            <CardTitle className="text-sm font-medium truncate">
              {widget.title}
            </CardTitle>
          ) : null}
          {widget.source ? (
            <CardDescription className="text-[11px] truncate">
              {widget.source}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardPanel
        className={cn(
          "min-h-0 overflow-hidden",
          showHeader && "pt-0",
          iconOnly && "p-3",
        )}
      >
        <ScrollArea className="h-full">
          <ul className={iconOnly ? "flex flex-col items-center gap-1" : ""}>
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
                    iconOnly
                      ? "relative flex size-9 items-center justify-center rounded-md"
                      : "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start",
                  )}
                  aria-label={iconOnly ? item.title : undefined}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "size-4",
                        iconOnly ? "" : "text-muted-foreground",
                      )}
                    />
                  ) : null}
                  {!iconOnly ? (
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {item.title}
                    </span>
                  ) : null}
                  {item.badge ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[11px]",
                        iconOnly &&
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
                  {iconOnly ? (
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
          </ul>
        </ScrollArea>
      </CardPanel>
    </Card>
  )
}
