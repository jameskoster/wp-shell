import { ScrollArea } from "@/components/ui/scroll-area"
import { useCustomize } from "@/shell/customizeStore"
import { usePlacement } from "@/stores/placementStore"
import { WidgetGrid } from "@/widgets/WidgetGrid"

export function Dashboard() {
  const slots = usePlacement((s) => s.dashboardOrder)
  const customizing = useCustomize((s) => s.active)
  const setCustomize = useCustomize((s) => s.setActive)

  // Double-click on the dashboard canvas exits customize mode. Slot
  // wrappers stop propagation on dblclick so this only fires on the
  // background canvas (gutters, padding, empty rows), not on widgets
  // themselves — matching the "click outside to commit" mental model
  // without competing with the drag activator on slot surfaces.
  const handleDoubleClick = customizing
    ? () => setCustomize(false)
    : undefined

  return (
    <ScrollArea className="flex-1 bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] dark:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)]">
      <div
        className="w-full py-8"
        style={{
          paddingLeft: "max(1.5rem, var(--dock-inset-left, 0px))",
          paddingRight: "max(1.5rem, var(--dock-inset-right, 0px))",
          paddingBottom: "max(2rem, var(--dock-inset-bottom, 0px))",
        }}
        onDoubleClick={handleDoubleClick}
      >
        <WidgetGrid slots={slots} />
      </div>
    </ScrollArea>
  )
}
