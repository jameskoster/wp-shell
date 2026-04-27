import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useContexts } from "@/contexts/store"
import type { InfoWidget as InfoWidgetDef, WidgetSize } from "./types"
import { Thumbnail } from "./Thumbnail"
import { WidgetMenu } from "./WidgetMenu"

export function InfoWidget({
  widget,
  size = "md",
}: {
  widget: InfoWidgetDef
  size?: WidgetSize
}) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon

  const items = widget.items ?? []
  const compact = size === "sm"
  // Smaller cells get a clipped item count to avoid overflow flicker before
  // the scroll area kicks in. lg/xl render the full list and scroll.
  const visibleItems =
    size === "sm"
      ? []
      : size === "md" || size === "tall"
        ? items.slice(0, 2)
        : items
  const useScroll = size === "lg" || size === "wide" || size === "xl"

  return (
    <Card className="group h-full overflow-hidden">
      <WidgetMenu
        widgetId={widget.id}
        className="absolute top-3 right-3 z-10"
      />
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          <span className="truncate">{widget.title}</span>
        </CardTitle>
        {!compact && widget.source ? (
          <CardDescription className="text-[11px] truncate">
            {widget.source}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardPanel className="pt-0 min-h-0 overflow-hidden">
        {compact ? (
          <p className="text-xs text-muted-foreground">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? "item" : "items"}`
              : "No items."}
          </p>
        ) : widget.render ? (
          // Custom renders own their own layout; we don't wrap them in
          // a ScrollArea even at lg/xl, because the data-shape escape
          // hatch is also where bespoke compositions (meters, gauges,
          // forms) live and they assume full height control.
          widget.render()
        ) : visibleItems.length > 0 ? (
          useScroll ? (
            <ScrollArea className="h-full">
              <ItemList
                items={items}
                onOpen={(action, rect) => open(action, rect)}
              />
            </ScrollArea>
          ) : (
            <ItemList
              items={visibleItems}
              onOpen={(action, rect) => open(action, rect)}
            />
          )
        ) : (
          <p className="text-sm text-muted-foreground">No items.</p>
        )}
      </CardPanel>
    </Card>
  )
}

function ItemList({
  items,
  onOpen,
}: {
  items: NonNullable<InfoWidgetDef["items"]>
  onOpen: (
    action: NonNullable<NonNullable<InfoWidgetDef["items"]>[number]["action"]>,
    rect: DOMRect,
  ) => void
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.action ? (
            <button
              type="button"
              onClick={(e) =>
                onOpen(item.action!, e.currentTarget.getBoundingClientRect())
              }
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
            >
              <ItemBody item={item} />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <ItemBody item={item} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function ItemBody({
  item,
}: {
  item: NonNullable<InfoWidgetDef["items"]>[number]
}) {
  // Two layouts share this component:
  //  - With a thumbnail, title sits over meta so the thumbnail anchors
  //    against a 2-line text block (the canonical mail/messaging row).
  //    A single-line title + side-meta next to a chunky 28px thumbnail
  //    reads as misaligned because the thumbnail dominates vertically.
  //  - Without a thumbnail, the row stays inline with meta floated to
  //    the right — the original compact info-list shape.
  if (item.thumbnail) {
    return (
      <>
        <Thumbnail thumbnail={item.thumbnail} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-tight">{item.title}</div>
          {item.meta ? (
            <div className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
              {item.meta}
            </div>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
      {item.meta ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.meta}
        </span>
      ) : null}
    </>
  )
}
