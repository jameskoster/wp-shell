import { GripVertical } from "lucide-react"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useCustomize } from "@/shell/customizeStore"
import { dashboardItemId } from "@/shell/CustomizeDnd"
import { cn } from "@/lib/utils"
import type { WidgetDef, WidgetSize } from "./types"
import { LaunchTile } from "./LaunchTile"
import { InfoWidget } from "./InfoWidget"
import { AnalyticsWidget } from "./AnalyticsWidget"
import { NavWidget } from "./NavWidget"

const SPAN: Record<WidgetSize, string> = {
  sm: "col-span-1 row-span-1",
  tall: "col-span-1 row-span-2",
  md: "col-span-2 row-span-1",
  lg: "col-span-2 row-span-2",
  xl: "col-span-4 row-span-2",
}

function renderWidget(w: WidgetDef) {
  const size: WidgetSize = w.size ?? "md"
  switch (w.kind) {
    case "launch":
      return <LaunchTile widget={w} size={size} />
    case "info":
      return <InfoWidget widget={w} size={size} />
    case "analytics":
      return <AnalyticsWidget widget={w} size={size} />
    case "nav":
      return <NavWidget widget={w} size={size} />
  }
}

/**
 * Per-widget sortable wrapper. Outside customize mode the wrapper is a
 * plain div with the grid-span class — `useSortable({ disabled: true })`
 * returns no listeners and the inner widget behaves exactly as today.
 *
 * In customize mode:
 *  - The wrapper is the drag activator (pointer + keyboard sensor),
 *    role="button", tabIndex=0 — provided automatically by dnd-kit's
 *    `attributes` spread.
 *  - The inner content is `inert` so focus and clicks can't reach the
 *    real widget surface (suppresses launch-tile clicks AND the
 *    widget's own menus, which would otherwise compete with the drag).
 *  - A faint grip icon advertises the new affordance.
 *  - The whole wrapper jiggles via the `motion-safe:animate-jiggle`
 *    utility (keyframes live in `index.css`).
 */
function SortableWidget({
  widget,
  customizing,
  index,
}: {
  widget: WidgetDef
  customizing: boolean
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dashboardItemId(widget.id), disabled: !customizing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const size = widget.size ?? "md"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        SPAN[size],
        "relative h-full w-full overflow-hidden rounded-xl",
        customizing &&
          "cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        customizing &&
          (index % 2 === 0
            ? "motion-safe:animate-jiggle"
            : "motion-safe:animate-jiggle-alt"),
        isDragging && "z-10 cursor-grabbing opacity-50",
      )}
      {...attributes}
      {...listeners}
    >
      {/*
        Inert prevents any focus or click reaching the widget while
        customizing — including the widget's own per-tile menu — so the
        wrapper is the unambiguous drag surface.
      */}
      <div className="h-full w-full" inert={customizing}>
        {renderWidget(widget)}
      </div>
      {customizing ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-md bg-popover/80 text-muted-foreground shadow-sm/5 backdrop-blur"
        >
          <GripVertical className="size-3.5" />
        </div>
      ) : null}
    </div>
  )
}

export function WidgetGrid({ widgets }: { widgets: WidgetDef[] }) {
  const customizing = useCustomize((s) => s.active)
  return (
    <SortableContext
      items={widgets.map((w) => dashboardItemId(w.id))}
      strategy={rectSortingStrategy}
    >
      <div className="widget-grid">
        {widgets.map((w, i) => (
          <SortableWidget
            key={w.id}
            widget={w}
            customizing={customizing}
            index={i}
          />
        ))}
      </div>
    </SortableContext>
  )
}
