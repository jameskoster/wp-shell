import { create } from "zustand"
import { DEFAULT_RECIPE_ID, recipeFor, type RecipeId } from "@/recipes"
import type { Recipe } from "@/widgets/types"

type RecipeState = {
  /**
   * Identifier of the dashboard recipe currently driving the placement
   * store, the grid renderer, and the customize add-widgets menu.
   * Changes when the prototype visitor switches sites — see
   * `siteStore` (slice 2) for the wiring.
   */
  activeRecipeId: RecipeId
  setActiveRecipeId: (id: RecipeId) => void
}

export const useRecipe = create<RecipeState>((set) => ({
  activeRecipeId: DEFAULT_RECIPE_ID,
  setActiveRecipeId: (id) => set({ activeRecipeId: id }),
}))

/**
 * Non-reactive accessor for callbacks that aren't React renders
 * (zustand store actions, event handlers resolving an action's recipe
 * at call time). React components should subscribe via `useRecipe`
 * directly, or — more commonly — re-render when `placementStore`
 * reseeds in response to a recipe change.
 */
export function getActiveRecipe(): Recipe {
  return recipeFor(useRecipe.getState().activeRecipeId)
}
