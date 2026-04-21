import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { useContexts } from "@/contexts/store"
import type { InfoWidget as InfoWidgetDef } from "./types"

export function InfoWidget({ widget }: { widget: InfoWidgetDef }) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          {widget.title}
        </CardTitle>
        {widget.source ? (
          <CardDescription className="text-[11px]">
            {widget.source}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardPanel className="pt-0">
        {widget.render ? (
          widget.render()
        ) : widget.items && widget.items.length > 0 ? (
          <ul className="-mx-2">
            {widget.items.map((item) => (
              <li key={item.id}>
                {item.action ? (
                  <button
                    type="button"
                    onClick={(e) =>
                      open(item.action!, e.currentTarget.getBoundingClientRect())
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-start outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
                  >
                    <span className="min-w-0 truncate text-sm">{item.title}</span>
                    {item.meta ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 px-2 py-2">
                    <span className="min-w-0 truncate text-sm">{item.title}</span>
                    {item.meta ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No items.</p>
        )}
      </CardPanel>
    </Card>
  )
}
