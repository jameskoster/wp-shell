import { create } from "zustand"

export type DockPosition =
  | "left-center"
  | "bottom-center"
  | "right-center"
  | "hidden"

const STORAGE_KEY = "wp-shell.dock-position"
const DEFAULT_POSITION: DockPosition = "bottom-center"

const VALID_POSITIONS: readonly DockPosition[] = [
  "left-center",
  "bottom-center",
  "right-center",
  "hidden",
] as const

function readStoredPosition(): DockPosition {
  if (typeof window === "undefined") return DEFAULT_POSITION
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw && (VALID_POSITIONS as readonly string[]).includes(raw)) {
      return raw as DockPosition
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall through.
  }
  return DEFAULT_POSITION
}

function writeStoredPosition(position: DockPosition): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, position)
  } catch {
    // Best-effort persistence — ignore quota / availability errors.
  }
}

type State = { position: DockPosition }
type Actions = { setPosition: (position: DockPosition) => void }

export const useDock = create<State & Actions>((set) => ({
  position: readStoredPosition(),
  setPosition: (position) => {
    writeStoredPosition(position)
    set({ position })
  },
}))
