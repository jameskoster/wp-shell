import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useContexts } from "@/contexts/store"
import { refKey } from "@/contexts/url"
import type { LaunchTileWidget } from "./types"
import { WidgetMenu } from "./WidgetMenu"

export function LaunchTile({ widget }: { widget: LaunchTileWidget }) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon
  return (
    <div className="group relative h-full">
      <Card
        render={
          <button
            type="button"
            data-launch-key={refKey(widget.action)}
            onClick={(e) =>
              open(widget.action, e.currentTarget.getBoundingClientRect())
            }
            className="flex h-full w-full flex-col items-start justify-between gap-3 p-5 text-start outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
        }
      >
        {Icon ? (
          <span className="grid size-5 place-items-center text-foreground">
            <Icon className="size-5" />
          </span>
        ) : null}
        {widget.badge ? (
          <Badge
            variant="secondary"
            className="pointer-events-none absolute right-5 bottom-5 text-[11px]"
          >
            {widget.badge}
          </Badge>
        ) : null}
        <div className="flex w-full flex-col items-start self-stretch text-start">
          <div className="text-sm font-medium">{widget.title}</div>
          {widget.description ? (
            <div className="text-xs text-muted-foreground">{widget.description}</div>
          ) : null}
        </div>
      </Card>
      <WidgetMenu
        widgetId={widget.id}
        className="absolute top-3 right-3 z-10"
      />
    </div>
  )
}
