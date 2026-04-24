import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomize } from "@/shell/customizeStore"
import { usePlacement } from "@/stores/placementStore"
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
 * the explicit Done exit. Removal lives on the per-widget menus
 * (`WidgetMenu`, `LaunchTileMenu`, dock context menu) rather than as a
 * drop zone in the toolbar.
 */
export function CustomizeBar() {
  const setActive = useCustomize((s) => s.setActive)
  const resetToDefault = usePlacement((s) => s.resetToDefault)
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
