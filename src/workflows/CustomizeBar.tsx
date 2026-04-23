import { useState } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { useCustomize } from "@/shell/customizeStore"
import { REMOVE_ZONE_ID, useActiveDrag } from "@/shell/CustomizeDnd"
import { usePlacement } from "@/stores/placementStore"
import { cn } from "@/lib/utils"
import { AddWidgetMenu } from "./AddWidgetMenu"
import { PluginRepoDialog } from "./PluginRepoDialog"

/**
 * Customize-mode system bar that overlays the AdminBar position while
 * Customize mode is active. Mirrors the AdminBar's geometry (h-12,
 * border-b, bg-card) so the chrome's vertical rhythm doesn't shift
 * when entering / exiting customize mode — the editing toolbar simply
 * takes over the slot the AdminBar was occupying.
 *
 * Hosts the structural commands (Add widgets, Reset to default) and
 * the explicit Done exit. The transient "Drop here to remove" target
 * swaps in for the toolbar middle while a drag is in flight.
 */
export function CustomizeBar() {
  const setActive = useCustomize((s) => s.setActive)
  const resetToDefault = usePlacement((s) => s.resetToDefault)
  const drag = useActiveDrag()
  const [pluginRepoOpen, setPluginRepoOpen] = useState(false)

  return (
    <>
      <div
        role="toolbar"
        aria-label="Customize Dashboard"
        className="flex h-12 w-full shrink-0 items-center gap-1 border-b bg-card px-2"
      >
        <AddWidgetMenu onDiscoverPlugins={() => setPluginRepoOpen(true)} />
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefault}
          title="Restore the recipe defaults for the dashboard, dock, and hidden widgets"
        >
          <RotateCcw className="size-4" />
          Reset to default
        </Button>
        <div className="flex-1" />
        {/*
          Remove target only materialises during a drag — keeps the
          toolbar's resting state quiet, and surfaces a clearly destructive
          affordance only at the moment it's actionable.
        */}
        {drag ? <RemoveDropTarget /> : null}
        <Button size="sm" onClick={() => setActive(false)}>
          Done
        </Button>
      </div>
      <PluginRepoDialog
        open={pluginRepoOpen}
        onOpenChange={setPluginRepoOpen}
      />
    </>
  )
}

function RemoveDropTarget() {
  const { setNodeRef, isOver } = useDroppable({ id: REMOVE_ZONE_ID })
  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label="Drop here to remove"
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border border-dashed px-3 text-xs transition-colors",
        isOver
          ? "border-destructive bg-destructive/10 text-destructive-foreground"
          : "border-border text-muted-foreground",
      )}
    >
      <Trash2 className="size-3.5" />
      Drop here to remove
    </div>
  )
}
