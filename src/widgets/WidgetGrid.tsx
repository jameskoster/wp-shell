import type { WidgetDef, WidgetSize } from "./types"
import { LaunchTile } from "./LaunchTile"
import { InfoWidget } from "./InfoWidget"
import { AnalyticsWidget } from "./AnalyticsWidget"
import { NavWidget } from "./NavWidget"

const SPAN: Record<WidgetSize, string> = {
  sm: "col-span-12 sm:col-span-6 lg:col-span-3",
  md: "col-span-12 sm:col-span-6 lg:col-span-4",
  lg: "col-span-12 lg:col-span-6",
}

function renderWidget(w: WidgetDef) {
  switch (w.kind) {
    case "launch":
      return <LaunchTile widget={w} />
    case "info":
      return <InfoWidget widget={w} />
    case "analytics":
      return <AnalyticsWidget widget={w} />
    case "nav":
      return <NavWidget widget={w} />
  }
}

export function WidgetGrid({ widgets }: { widgets: WidgetDef[] }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {widgets.map((w) => (
        <div key={w.id} className={SPAN[w.size ?? "md"]}>
          {renderWidget(w)}
        </div>
      ))}
    </div>
  )
}
