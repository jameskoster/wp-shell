import { cn } from "@/lib/utils"
import type { WidgetDef, WidgetSize } from "./types"
import { LaunchTile } from "./LaunchTile"
import { InfoWidget } from "./InfoWidget"
import { AnalyticsWidget } from "./AnalyticsWidget"
import { NavWidget } from "./NavWidget"

// Grid is 24 columns rather than the conventional 12 so launch tiles can
// step cleanly through 3 → 4 → 6 → 8 per row across breakpoints. Other
// widget sizes are remapped proportionally (×2) so they read the same as
// before relative to the row.
const SPAN: Record<WidgetSize, string> = {
  sm: "col-span-8 sm:col-span-6 lg:col-span-4 xl:col-span-3",
  md: "col-span-24 sm:col-span-12 lg:col-span-8 2xl:col-span-6",
  lg: "col-span-24 lg:col-span-12 2xl:col-span-8",
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
    <div className="grid grid-cols-24 gap-4">
      {widgets.map((w) => (
        <div
          key={w.id}
          className={cn(
            SPAN[w.size ?? "md"],
            w.kind === "launch" && "aspect-square self-start",
          )}
        >
          {renderWidget(w)}
        </div>
      ))}
    </div>
  )
}
