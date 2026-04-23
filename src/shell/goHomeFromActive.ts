import { refKey } from "@/contexts/url"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"

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
  const key = refKey({ type: active.type, params: active.params })
  const el =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(`[data-launch-key="${key}"]`)
      : null
  // Pull the tile into view first so the rect we hand to `goHome` is
  // the pose the user will actually see as the surface contracts.
  el?.scrollIntoView({ block: "nearest", inline: "nearest" })
  const rect = el?.getBoundingClientRect()
  goHome(rect && rect.width > 0 && rect.height > 0 ? rect : null)
}
