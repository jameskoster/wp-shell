import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import { adminRecipe } from "@/recipes/admin"
import { useDashboard } from "@/stores/dashboardStore"
import type { LaunchTileWidget, WidgetDef } from "@/widgets/types"

export function Dashboard() {
  const recipe = adminRecipe
  const tiles = useDashboard((s) => s.tiles)
  const hiddenWidgetIds = useDashboard((s) => s.hiddenWidgetIds)
  const isHidden = (id: string) => hiddenWidgetIds.includes(id)
  const tileWidgets: LaunchTileWidget[] = useMemo(
    () =>
      tiles.map((t) => ({
        id: t.id,
        kind: "launch",
        title: t.title,
        description: t.description,
        icon: t.icon,
        size: "sm",
        action: t.action,
        badge: t.badge,
      })),
    [tiles]
  )
  // TODO: dock — nav widgets currently live alongside content widgets in
  // the iOS-style grid. Revisit promoting them into a dedicated Dock-like
  // surface once the broader shell direction is settled.
  const recipeWidgets = recipe.widgets.filter(
    (w) => w.kind !== "launch" && !isHidden(w.id)
  )
  const widgets: WidgetDef[] = [...tileWidgets, ...recipeWidgets]
  return (
    <ScrollArea className="flex-1">
      <div className="w-full px-6 py-8">
        <WidgetGrid widgets={widgets} />
      </div>
    </ScrollArea>
  )
}
