import { refKey } from "@/contexts/url"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"

/**
 * Close `ctx` with the proper reverse-launch choreography. Looks up the
 * originating launch tile (or dock item) by its `data-launch-key` and
 * hands its bounding rect to `closeAnimated` so the surface contracts
 * back into that tile before the context is removed — instead of
 * disappearing abruptly when it was the last thing on screen.
 *
 * Mirrors `goHomeFromActive` so every entry point that wants to "close
 * the current context with a graceful exit" — the header overflow menu,
 * the switcher's `X` button, etc. — gets the same animation treatment
 * without duplicating the DOM-lookup dance.
 */
export function closeFromActive(ctx: Context): void {
  const { closeAnimated } = useContexts.getState()
  const key = refKey({ type: ctx.type, params: ctx.params })
  const el =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(`[data-launch-key="${key}"]`)
      : null
  // Pull the tile into view first so the rect we hand to
  // `closeAnimated` is the pose the user will actually see as the
  // surface contracts.
  el?.scrollIntoView({ block: "nearest", inline: "nearest" })
  const rect = el?.getBoundingClientRect()
  closeAnimated(ctx.id, rect && rect.width > 0 && rect.height > 0 ? rect : null)
}
