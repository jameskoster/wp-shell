import { create } from "zustand"

type Overlay = "palette" | "switcher" | "create" | "notifications" | null

// `aiOpen` lives next to `overlay` (rather than being another value in the
// union) because the AI drawer is non-modal and must coexist with the
// palette / switcher / customize modes — making it part of the
// mutually-exclusive overlay enum would force closing one to open the other.
type State = {
  overlay: Overlay
  aiOpen: boolean
}

type Actions = {
  open: (o: Exclude<Overlay, null>) => void
  close: () => void
  toggle: (o: Exclude<Overlay, null>) => void
  openAI: () => void
  closeAI: () => void
  toggleAI: () => void
}

export const useUI = create<State & Actions>((set, get) => ({
  overlay: null,
  aiOpen: false,
  open: (o) => set({ overlay: o }),
  close: () => set({ overlay: null }),
  toggle: (o) => set({ overlay: get().overlay === o ? null : o }),
  openAI: () => set({ aiOpen: true }),
  closeAI: () => set({ aiOpen: false }),
  toggleAI: () => set({ aiOpen: !get().aiOpen }),
}))
