import { create } from "zustand"
import { useContexts } from "@/contexts/store"
import { DEFAULT_SITE_ID, SITES, siteFor } from "@/mocks/site"
import { useRecipe } from "@/stores/recipeStore"

/**
 * Read the `?site=` URL parameter, falling back to `null` when the
 * value is missing or doesn't match a known site. SSR-safe.
 */
function readSiteFromQuery(): string | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const id = params.get("site")
  if (!id) return null
  return SITES.some((s) => s.id === id) ? id : null
}

/**
 * Persist the active site id in the URL as `?site=…` so a viewer can
 * deep-link or share a specific demo configuration. The default site
 * is implied by an absent parameter — keeps the canonical URL clean.
 */
function writeSiteToQuery(id: string) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (id === DEFAULT_SITE_ID) {
    url.searchParams.delete("site")
  } else {
    url.searchParams.set("site", id)
  }
  const next = `${url.pathname}${url.search}${url.hash}`
  history.replaceState(null, "", next)
}

type SiteState = {
  activeSiteId: string
  /**
   * Switch the prototype to a different site. Updates the active
   * recipe (which reseeds the dashboard via the placement store's
   * subscription), closes every open context — so the user lands
   * cleanly on the new site's Dashboard rather than carrying over
   * workspaces from the previous site — and syncs `?site=` in the
   * URL.
   *
   * No-op when the target site is unknown, the same as the active
   * site, or doesn't yet have a recipe wired up (the menu prevents
   * picking those, but the action defends against it anyway).
   */
  setActiveSite: (id: string) => void
  /**
   * Read `?site=` from the URL on first load and apply it. Called
   * once from `Shell.tsx`'s init effect, alongside the contexts
   * `hydrateFromHash`. Idempotent.
   */
  hydrateFromQuery: () => void
}

export const useSite = create<SiteState>((set, get) => ({
  activeSiteId: DEFAULT_SITE_ID,

  setActiveSite: (id) => {
    if (id === get().activeSiteId) return
    const site = siteFor(id)
    if (site.id !== id) return
    if (!site.recipeId) return
    set({ activeSiteId: id })
    useRecipe.getState().setActiveRecipeId(site.recipeId)
    useContexts.getState().closeAll()
    writeSiteToQuery(id)
  },

  hydrateFromQuery: () => {
    const fromUrl = readSiteFromQuery()
    if (!fromUrl || fromUrl === get().activeSiteId) return
    get().setActiveSite(fromUrl)
  },
}))

/** Convenience accessor — the active site descriptor as a hook. */
export function useActiveSite() {
  const id = useSite((s) => s.activeSiteId)
  return siteFor(id)
}
