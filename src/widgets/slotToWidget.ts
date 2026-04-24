import { adminRecipe } from "@/recipes/admin"
import type {
  DashboardSlot,
  LaunchTileWidget,
  WidgetDef,
} from "./types"

/**
 * Resolve a `dashboardOrder` slot to a concrete `WidgetDef` for the
 * grid renderer. Pinned slots inline their PinnedItem; recipe slots
 * look up the matching widget definition.
 *
 * Sizing now lives on the slot's `size` (cell footprint) and is
 * consumed by `WidgetGrid` via the packer's derived `rect` — the
 * returned `WidgetDef`'s legacy `size` field is purely informational
 * here.
 *
 * Lives in the widgets module (not Dashboard) so both `WidgetGrid` and
 * the customize-mode drag overlay can resolve slots without pulling in
 * the workflow surface.
 */
export function slotToWidget(slot: DashboardSlot): WidgetDef | null {
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
  return recipe
}
