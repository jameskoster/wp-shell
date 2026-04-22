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

export function WidgetGrid({ widgets }: { widgets: WidgetDef[] }) {
  return (
    <div className="widget-grid">
      {widgets.map((w) => (
        <div key={w.id} className={`${SPAN[w.size ?? "md"]} h-full w-full overflow-hidden`}>
          {renderWidget(w)}
        </div>
      ))}
    </div>
  )
}
