import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import { adminRecipe } from "@/recipes/admin"
import { usePlacement } from "@/stores/placementStore"
import type { LaunchTileWidget, WidgetDef } from "@/widgets/types"

export function Dashboard() {
  const recipe = adminRecipe
  const tiles = usePlacement((s) => s.dashboard)
  const hiddenWidgetIds = usePlacement((s) => s.hiddenWidgetIds)
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
  // Nav widgets are now rendered by the shell-level <Dock />, so they're
  // filtered out here to avoid double-rendering inside the grid.
  const recipeWidgets = recipe.widgets.filter(
    (w) => w.kind !== "launch" && w.kind !== "nav" && !isHidden(w.id)
  )
  const widgets: WidgetDef[] = [...tileWidgets, ...recipeWidgets]
  return (
    <ScrollArea className="flex-1">
      <div
        className="w-full py-8"
        style={{
          paddingLeft: "max(1.5rem, var(--dock-inset-left, 0px))",
          paddingRight: "max(1.5rem, var(--dock-inset-right, 0px))",
          paddingBottom: "max(2rem, var(--dock-inset-bottom, 0px))",
        }}
      >
        <WidgetGrid widgets={widgets} />
      </div>
    </ScrollArea>
  )
}
