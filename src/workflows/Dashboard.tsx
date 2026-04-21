import { ScrollArea } from "@/components/ui/scroll-area"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import { NavWidget } from "@/widgets/NavWidget"
import { adminRecipe } from "@/recipes/admin"

export function Dashboard() {
  const recipe = adminRecipe
  const navWidgets = recipe.widgets.filter((w) => w.kind === "nav")
  const mainWidgets = recipe.widgets.filter((w) => w.kind !== "nav")
  return (
    <ScrollArea className="flex-1">
      <div className="w-full px-6 py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
          {navWidgets.length > 0 ? (
            <aside className="order-last shrink-0 xl:order-first xl:w-2/12">
              <div className="flex flex-col gap-4 xl:sticky xl:top-0 xl:h-full">
                {navWidgets.map((w) => (
                  <NavWidget key={w.id} widget={w} />
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
