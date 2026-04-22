import { useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import { NavWidget } from "@/widgets/NavWidget"
import { adminRecipe } from "@/recipes/admin"
import { useDashboard } from "@/stores/dashboardStore"
import type { LaunchTileWidget, WidgetDef } from "@/widgets/types"
import { cn } from "@/lib/utils"

export function Dashboard() {
  const recipe = adminRecipe
  const tiles = useDashboard((s) => s.tiles)
  const navWidgets = recipe.widgets.filter((w) => w.kind === "nav")
  const otherWidgets = recipe.widgets.filter(
    (w) => w.kind !== "nav" && w.kind !== "launch"
  )
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
  const mainWidgets: WidgetDef[] = [...tileWidgets, ...otherWidgets]
  const [collapsedNavs, setCollapsedNavs] = useState<Record<string, boolean>>({})
  const allCollapsed =
    navWidgets.length > 0 && navWidgets.every((w) => collapsedNavs[w.id])
  return (
    <ScrollArea className="flex-1">
      <div className="w-full px-6 py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
          {navWidgets.length > 0 ? (
            <aside
              className={cn(
                "order-last shrink-0 xl:order-first",
                allCollapsed ? "xl:w-auto" : "xl:w-2/12",
              )}
            >
              <div className="flex flex-col gap-4 xl:sticky xl:top-0 xl:h-full">
                {navWidgets.map((w) => (
                  <NavWidget
                    key={w.id}
                    widget={w}
                    onCollapsedChange={(collapsed) =>
                      setCollapsedNavs((prev) => ({ ...prev, [w.id]: collapsed }))
                    }
                  />
                ))}
              </div>
            </aside>
          ) : null}
          <div className="min-w-0 flex-1">
            <WidgetGrid widgets={mainWidgets} />
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
