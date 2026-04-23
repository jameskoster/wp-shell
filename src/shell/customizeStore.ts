import { create } from "zustand"

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
