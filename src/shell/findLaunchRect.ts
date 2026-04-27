import { launchKey } from "@/contexts/registry"
import { refKey } from "@/contexts/url"
import type { Context } from "@/contexts/types"

/**
 * Resolve a viewport rect for the launch element associated with `ctx` —
 * the dashboard launch tile or dock item the surface should contract
 * back into when going home / closing.
 *
 * The lookup is two-pass:
 *
 *   1. Exact match on the active context's `refKey`. Hits when the
 *      context was opened from a parameterised tile (e.g. the "Pages"
 *      tile, a destination launcher, the dock item that mirrors it).
 *   2. Fallback to the type's default `launchKey`. The Editor is the
 *      motivating case: it's reachable both from the canonical
 *      "Appearance" tile (default params → homepage) and from any
 *      page-row click in the Pages list (params override → that
 *      page's id). The row click doesn't have a stable launch tile of
 *      its own, but visually the Editor surface "lives" in the
 *      Appearance tile, so contracting back into it preserves the
 *      reverse-launch story.
 *
 * Returns `null` when no element is found, the document is unavailable,
 * or the element has zero size — callers should treat that as "no
 * choreography, fall back to instant".
 *
 * Side effect: scrolls the matched element into view first so the rect
 * we return is the pose the user will actually see.
 */
export function findLaunchRect(ctx: Context): DOMRect | null {
  if (typeof document === "undefined") return null

  const exactKey = refKey({ type: ctx.type, params: ctx.params })
  const fallbackKey = launchKey({ type: ctx.type })

  let el = document.querySelector<HTMLElement>(
    `[data-launch-key="${exactKey}"]`,
  )
  if (!el && fallbackKey !== exactKey) {
    el = document.querySelector<HTMLElement>(
      `[data-launch-key="${fallbackKey}"]`,
    )
  }
  if (!el) return null

  el.scrollIntoView({ block: "nearest", inline: "nearest" })
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  return rect
}
