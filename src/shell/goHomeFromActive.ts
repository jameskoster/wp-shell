import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"
import { findLaunchRect } from "./findLaunchRect"

/**
 * Send the active context home with the proper reverse-launch
 * choreography. Looks up the originating launch tile (or dock item) by
 * its `data-launch-key` and hands its bounding rect to `goHome` so the
 * surface contracts back into the tile rather than disappearing
 * abruptly.
 *
 * Centralised here so every entry point that needs to "close the
 * current context and go home" — the AdminBar's home button, the
 * Customize Dashboard menu/palette items, etc. — gets the same
 * animation treatment without duplicating the DOM-lookup dance.
 *
 * No-ops when already on the dashboard.
 */
export function goHomeFromActive(active: Context | null): void {
  const { goHome } = useContexts.getState()
  if (!active) {
    goHome()
    return
  }
  goHome(findLaunchRect(active))
}
