import { create } from "zustand"

export type DockPosition =
  | "left-center"
  | "bottom-center"
  | "right-center"
  | "hidden"

export type DockSize = "sm" | "md" | "lg"

const POSITION_STORAGE_KEY = "wp-shell.dock-position"
const SIZE_STORAGE_KEY = "wp-shell.dock-size"
const DEFAULT_POSITION: DockPosition = "bottom-center"
const DEFAULT_SIZE: DockSize = "sm"

const VALID_POSITIONS: readonly DockPosition[] = [
  "left-center",
  "bottom-center",
  "right-center",
  "hidden",
] as const

const VALID_SIZES: readonly DockSize[] = ["sm", "md", "lg"] as const

function readStoredPosition(): DockPosition {
  if (typeof window === "undefined") return DEFAULT_POSITION
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY)
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
    window.localStorage.setItem(POSITION_STORAGE_KEY, position)
  } catch {
    // Best-effort persistence — ignore quota / availability errors.
  }
}

function readStoredSize(): DockSize {
  if (typeof window === "undefined") return DEFAULT_SIZE
  try {
    const raw = window.localStorage.getItem(SIZE_STORAGE_KEY)
    if (raw && (VALID_SIZES as readonly string[]).includes(raw)) {
      return raw as DockSize
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall through.
  }
  return DEFAULT_SIZE
}

function writeStoredSize(size: DockSize): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SIZE_STORAGE_KEY, size)
  } catch {
    // Best-effort persistence — ignore quota / availability errors.
  }
}

type State = { position: DockPosition; size: DockSize }
type Actions = {
  setPosition: (position: DockPosition) => void
  setSize: (size: DockSize) => void
}

export const useDock = create<State & Actions>((set) => ({
  position: readStoredPosition(),
  size: readStoredSize(),
  setPosition: (position) => {
    writeStoredPosition(position)
    set({ position })
  },
  setSize: (size) => {
    writeStoredSize(size)
    set({ size })
  },
}))
