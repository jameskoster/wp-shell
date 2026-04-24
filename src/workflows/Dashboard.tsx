import { ScrollArea } from "@/components/ui/scroll-area"
import { usePlacement } from "@/stores/placementStore"
import { WidgetGrid } from "@/widgets/WidgetGrid"

export function Dashboard() {
  const slots = usePlacement((s) => s.dashboardOrder)

  return (
    <ScrollArea className="flex-1 bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] dark:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)]">
      <div
        className="w-full py-8"
        style={{
          paddingLeft: "max(1.5rem, var(--dock-inset-left, 0px))",
          paddingRight: "max(1.5rem, var(--dock-inset-right, 0px))",
          paddingBottom: "max(2rem, var(--dock-inset-bottom, 0px))",
        }}
      >
        <WidgetGrid slots={slots} />
      </div>
    </ScrollArea>
  )
}
