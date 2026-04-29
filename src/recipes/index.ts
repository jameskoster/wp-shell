import type { Recipe } from "@/widgets/types"
import { adminRecipe } from "./admin"
import { bloggerRecipe } from "./blogger"
import { editorialRecipe } from "./editorial"
import { membershipRecipe } from "./membership"

/**
 * Identifier for one of the dashboard configurations the prototype
 * ships. Keeping this as a literal union (rather than `string`) lets
 * the site descriptor + recipe registry stay exhaustively
 * type-checked.
 */
export type RecipeId = "admin" | "blogger" | "editorial" | "membership"

/**
 * Single source of truth for which recipes the prototype knows about.
 * The placement store, the customize-mode add-widgets menu, and the
 * grid renderer all look up their active recipe through this map
 * instead of importing recipe modules directly — so adding a new
 * recipe means *only* adding an entry here and extending `RecipeId`.
 */
export const RECIPES: Record<RecipeId, Recipe> = {
  admin: adminRecipe,
  blogger: bloggerRecipe,
  editorial: editorialRecipe,
  membership: membershipRecipe,
}

/**
 * The recipe a fresh prototype visitor lands on. Initial state for
 * the recipe store and the seed used when the placement store
 * initialises before any site switch has occurred.
 */
export const DEFAULT_RECIPE_ID: RecipeId = "admin"

/** Convenience accessor used by stores and non-React callbacks. */
export function recipeFor(id: RecipeId): Recipe {
  return RECIPES[id]
}
