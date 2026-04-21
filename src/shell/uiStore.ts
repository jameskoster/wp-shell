import { create } from "zustand"

type Overlay = "palette" | "switcher" | "create" | "notifications" | null

type State = {
  overlay: Overlay
}

type Actions = {
  open: (o: Exclude<Overlay, null>) => void
  close: () => void
  toggle: (o: Exclude<Overlay, null>) => void
}

export const useUI = create<State & Actions>((set, get) => ({
  overlay: null,
  open: (o) => set({ overlay: o }),
  close: () => set({ overlay: null }),
  toggle: (o) => set({ overlay: get().overlay === o ? null : o }),
}))
