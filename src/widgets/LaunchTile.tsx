import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useContexts } from "@/contexts/store"
import type { LaunchTileWidget } from "./types"

export function LaunchTile({ widget }: { widget: LaunchTileWidget }) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon
  return (
    <Card
      render={
        <button
          type="button"
          onClick={(e) =>
            open(widget.action, e.currentTarget.getBoundingClientRect())
          }
          className="group flex h-full w-full flex-col items-start justify-between gap-3 p-5 text-start outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        />
      }
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="grid size-9 place-items-center rounded-md border bg-card text-foreground shadow-xs/5">
            <Icon className="size-4.5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-medium">{widget.title}</div>
          {widget.description ? (
            <div className="text-xs text-muted-foreground">{widget.description}</div>
          ) : null}
        </div>
      </div>
      <ArrowUpRight className="size-4 self-end text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  )
}
