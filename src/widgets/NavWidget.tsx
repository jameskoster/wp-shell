import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useContexts } from "@/contexts/store"
import type { NavWidget as NavWidgetDef } from "./types"

export function NavWidget({ widget }: { widget: NavWidgetDef }) {
  const open = useContexts((s) => s.open)
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        {widget.source ? (
          <CardDescription className="text-[11px]">
            {widget.source}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardPanel className="pt-0">
        <ul className="-mx-2">
          {widget.items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={(e) =>
                    open(item.action, e.currentTarget.getBoundingClientRect())
                  }
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-start outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
                >
                  {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                  <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                  {item.badge ? (
                    <Badge variant="secondary" className="text-[11px]">
                      {item.badge}
                    </Badge>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </CardPanel>
    </Card>
  )
}
