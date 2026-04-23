import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { adminRecipe } from "@/recipes/admin"
import { usePlacement } from "@/stores/placementStore"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import type {
  DashboardSlot,
  LaunchTileWidget,
  WidgetDef,
} from "@/widgets/types"

/**
 * Resolve a `dashboardOrder` slot to a concrete `WidgetDef` for the
 * grid renderer. Pinned slots inline their PinnedItem; recipe slots
 * look up the matching widget definition (and apply any
 * `sizeOverride`, reserved for the future per-widget resize gesture).
 */
function slotToWidget(slot: DashboardSlot): WidgetDef | null {
  if (slot.kind === "pinned") {
    const tile: LaunchTileWidget = {
      id: slot.pinned.id,
      kind: "launch",
      title: slot.pinned.title,
      description: slot.pinned.description,
      icon: slot.pinned.icon,
      size: "sm",
      action: slot.pinned.action,
      badge: slot.pinned.badge,
    }
    return tile
  }
  const recipe = adminRecipe.widgets.find((w) => w.id === slot.widgetId)
  if (!recipe) return null
  if (recipe.kind === "nav" || recipe.kind === "launch") return null
  if (slot.sizeOverride) {
    return { ...recipe, size: slot.sizeOverride }
  }
  return recipe
}

export function Dashboard() {
  const order = usePlacement((s) => s.dashboardOrder)
  const widgets = useMemo<WidgetDef[]>(
    () =>
      order
        .map(slotToWidget)
        .filter((w): w is WidgetDef => w !== null),
    [order],
  )

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
