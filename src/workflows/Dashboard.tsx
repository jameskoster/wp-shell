import { ScrollArea } from "@/components/ui/scroll-area"
import { WidgetGrid } from "@/widgets/WidgetGrid"
import { storeManagerRecipe } from "@/recipes/storeManager"
import { USER } from "@/mocks/user"

export function Dashboard() {
  const recipe = storeManagerRecipe
  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {recipe.role}
          </p>
          <h1 className="font-heading text-2xl font-semibold">
            Hi, {USER.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipe.greeting}</p>
        </header>
        <WidgetGrid widgets={recipe.widgets} />
      </div>
    </ScrollArea>
  )
}
