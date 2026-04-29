import type { RecipeId } from "@/recipes"
import type { FrontPageVariant } from "@/workflows/editor/Canvas"

/**
 * One of the sites the prototype demo can switch between. Each
 * descriptor carries the visual identity rendered in the admin bar
 * site menu plus the dashboard `recipeId` that drives placement,
 * customize, and the grid renderer when this site is active.
 *
 * `recipeId: null` is a deliberate "coming soon" marker — the site
 * appears in the Switch site menu (so demo viewers can see the
 * intended lineup) but is unselectable until its recipe + mocks land
 * in a later slice.
 */
export type SiteDescriptor = {
  id: string
  name: string
  url: string
  initial: string
  iconClass: string
  /**
   * Persona label shown beneath the site name in the switcher — e.g.
   * "Solo store owner". Communicates the *kind* of dashboard each
   * site embodies, which is the whole point of having multiple sites
   * in the prototype.
   */
  persona: string
  /** Dashboard recipe this site uses. `null` until the recipe ships. */
  recipeId: RecipeId | null
  /**
   * Which homepage layout the site renders. Single source of truth:
   * both the dashboard's Site Preview widget and the editor's Canvas
   * read this when the active document is the front page, so the two
   * surfaces always agree. A site without a real homepage layout yet
   * still picks a value for type safety; pick the closest fit and
   * iterate when the recipe lands.
   */
  frontPageVariant: FrontPageVariant
}

/**
 * The full lineup of demo sites, in the order they appear in the
 * Switch site menu. Studio Park is currently the only site with a
 * built recipe; the others are surfaced as disabled entries so the
 * prototype's intent reads even before slices 3–5 land.
 */
export const SITES: SiteDescriptor[] = [
  {
    id: "studio-park",
    name: "Studio Park",
    url: "https://studiopark.example",
    initial: "S",
    iconClass: "bg-gradient-to-br from-sky-500 to-violet-700 text-white",
    persona: "Solo store owner",
    recipeId: "admin",
    frontPageVariant: "commerce",
  },
  {
    id: "field-notes",
    name: "Field Notes",
    url: "https://fieldnotes.example",
    initial: "F",
    iconClass: "bg-gradient-to-br from-amber-400 to-rose-600 text-white",
    persona: "Solo blogger",
    recipeId: "blogger",
    frontPageVariant: "blog",
  },
  {
    id: "bristol-review",
    name: "The Bristol Review",
    url: "https://bristolreview.example",
    initial: "B",
    iconClass: "bg-gradient-to-br from-emerald-500 to-emerald-800 text-white",
    persona: "Editorial publication",
    recipeId: "editorial",
    frontPageVariant: "publication",
  },
  {
    id: "maker-circle",
    name: "Maker Circle",
    url: "https://makercircle.example",
    initial: "M",
    iconClass: "bg-gradient-to-br from-amber-500 to-rose-700 text-white",
    persona: "Community & membership",
    recipeId: "membership",
    frontPageVariant: "community",
  },
]

export const DEFAULT_SITE_ID = "studio-park"

export function siteFor(id: string): SiteDescriptor {
  return SITES.find((s) => s.id === id) ?? SITES[0]!
}
