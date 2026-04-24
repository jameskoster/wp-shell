import { create } from "zustand"
import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * Customize Dashboard mode is a transient editing posture for the
 * dashboard surface. While active:
 *  - dashboard widgets become draggable (re-ordering + cross-surface)
 *  - launch tile clicks are suppressed (the click target is taken over
 *    by the drag affordance)
 *  - the AdminBar and Dock dim themselves and stay inert except as
 *    drop targets
 *
 * Kept separate from `uiStore` so it doesn't compete with the overlay
 * mutex (palette / switcher / sheets) — both can exist simultaneously
 * without one closing the other.
 */
type State = { active: boolean }
type Actions = {
  setActive: (active: boolean) => void
  toggle: () => void
}

export const useCustomize = create<State & Actions>((set, get) => ({
  active: false,
  setActive: (active) => set({ active }),
  toggle: () => set({ active: !get().active }),
}))

/**
 * Customize mode requires at least the 6-column dashboard breakpoint
 * (≥ 640px viewport). Below that, free-form positioning collapses into
 * a near-single-column stream where moves and resizes don't have
 * meaningful targets — so we hide the entry points and auto-exit if
 * the viewport shrinks while a session is open.
 *
 * Mirrors the `--cols` step in `index.css` so the gate stays in sync
 * with the layout's actual breakpoints.
 */
export function useCanCustomize(): boolean {
  return useMediaQuery({ min: 640 })
}
