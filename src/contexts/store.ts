import { useMemo } from "react"
import { create } from "zustand"
import type { Context, ContextRef } from "./types"
import {
  iconFor,
  resolveDefaultParams,
  singletonKeyFor,
  titleFor,
} from "./registry"
import { hashToRef, refKey, refToHash } from "./url"

type ClosedRecent = {
  type: Context["type"]
  title: string
  params?: Context["params"]
  closedAt: number
}

export type LaunchOrigin = {
  id: string
  rect: { left: number; top: number; width: number; height: number }
  // Monotonically increasing per launch call. Lets consumers distinguish a
  // brand-new launch event from incidental parent re-renders that re-pass
  // the same rect/transform.
  seq: number
}

/**
 * Choreographed swap between two existing contexts (manage <-> editor and
 * other "loop" relationships). Runs in two sequential phases so the
 * hand-off reads clearly rather than as a cross-fade:
 *
 *   phase 'exit'  — the outgoing tile scales identity → cell while the
 *                   incoming tile sits parked at its cell.
 *   phase 'enter' — the incoming tile scales cell → identity while the
 *                   outgoing tile stays parked at its cell.
 *
 * Distinct from the launch-rect animation, which is for spawning a
 * brand-new context from a click target.
 */
export type LoopSwap = {
  fromId: string
  toId: string
  phase: "exit" | "enter"
  seq: number
}

const LOOP_EXIT_MS = 240
const LOOP_ENTER_MS = 240

let launchSeqCounter = 0
let loopSwapSeqCounter = 0

type State = {
  openContexts: Context[]
  activeId: string | null
  closedRecents: ClosedRecent[]
  pendingLaunch: LaunchOrigin | null
  loopSwap: LoopSwap | null
}

const RECENTS_CAP = 5

type Actions = {
  open: (ref: ContextRef, originRect?: DOMRect | null) => string
  /**
   * Open `ref` with loop-swap semantics. If both source (current active)
   * and destination (existing context matching `ref`) exist and are
   * distinct, runs the choreographed two-tile swap. Otherwise falls back
   * to plain `open()` so the launch-rect animation still happens for
   * first-time opens. Returns the resulting context id.
   */
  swapTo: (ref: ContextRef, originRect?: DOMRect | null) => string
  close: (id: string) => void
  closeOthers: (id: string) => void
  closeAll: () => void
  focus: (id: string) => void
  goHome: () => void
  hydrateFromHash: () => void
  consumeLaunch: () => void
}

type Store = State & Actions

function makeId(ref: ContextRef): string {
  const key = singletonKeyFor(ref.type, ref.params)
  if (key !== undefined) return `${ref.type}:${key}`
  return `${ref.type}:${refKey(ref)}:${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function findExisting(
  contexts: Context[],
  ref: ContextRef
): Context | undefined {
  const key = singletonKeyFor(ref.type, ref.params)
  if (key === undefined) return undefined
  return contexts.find(
    (c) => c.type === ref.type && singletonKeyFor(c.type, c.params) === key
  )
}

function withDefaults(ref: ContextRef): ContextRef {
  const hasParams =
    ref.params !== undefined && Object.keys(ref.params).length > 0
  if (hasParams) return ref
  const defaults = resolveDefaultParams(ref.type)
  if (!defaults) return ref
  return { ...ref, params: defaults }
}

function syncHash(activeContext: Context | null) {
  if (typeof window === "undefined") return
  if (!activeContext) {
    if (window.location.hash) history.replaceState(null, "", window.location.pathname)
    return
  }
  const next = refToHash({
    type: activeContext.type,
    params: activeContext.params,
  })
  if (window.location.hash !== next) {
    history.pushState(null, "", next)
  }
}

export const useContexts = create<Store>((set, get) => ({
  openContexts: [],
  activeId: null,
  closedRecents: [],
  pendingLaunch: null,
  loopSwap: null,

  open: (incoming, originRect) => {
    const ref = withDefaults(incoming)
    const now = Date.now()
    const state = get()
    const existing = findExisting(state.openContexts, ref)
    const launchFor = (id: string): LaunchOrigin | null =>
      originRect
        ? {
            id,
            rect: {
              left: originRect.left,
              top: originRect.top,
              width: originRect.width,
              height: originRect.height,
            },
            seq: ++launchSeqCounter,
          }
        : null
    if (existing) {
      // Apply any new params + recompute the title so contexts like the
      // Editor can swap their loaded document when the same singleton key
      // is reopened with a different `id`. Icon is recomputed too so
      // polymorphic types (edit-page → Users / Plugins / etc.) stay in
      // sync with the active destination.
      const nextParams = ref.params ?? existing.params
      const nextRef = { ...ref, params: nextParams }
      const nextTitle = titleFor(nextRef)
      const nextIcon = iconFor(nextRef)
      const updated = state.openContexts.map((c) =>
        c.id === existing.id
          ? {
              ...c,
              params: nextParams,
              title: nextTitle,
              icon: nextIcon,
              lastFocusedAt: now,
            }
          : c
      )
      const updatedExisting = updated.find((c) => c.id === existing.id)!
      set({
        openContexts: updated,
        activeId: existing.id,
        pendingLaunch: launchFor(existing.id),
      })
      syncHash(updatedExisting)
      return existing.id
    }
    const newCtx: Context = {
      id: makeId(ref),
      type: ref.type,
      title: titleFor(ref),
      icon: iconFor(ref),
      params: ref.params,
      openedAt: now,
      lastFocusedAt: now,
    }
    set({
      openContexts: [...state.openContexts, newCtx],
      activeId: newCtx.id,
      pendingLaunch: launchFor(newCtx.id),
    })
    syncHash(newCtx)
    return newCtx.id
  },

  swapTo: (incoming, originRect) => {
    const ref = withDefaults(incoming)
    const state = get()
    const existing = findExisting(state.openContexts, ref)
    const fromCtx = state.activeId
      ? state.openContexts.find((c) => c.id === state.activeId) ?? null
      : null

    // Fallback: if either side of the loop is missing, or we'd swap a
    // context with itself, defer to the regular launch-rect open path.
    if (!existing || !fromCtx || existing.id === fromCtx.id) {
      return get().open(ref, originRect)
    }

    const now = Date.now()
    const nextParams = ref.params ?? existing.params
    const nextRef = { ...ref, params: nextParams }
    const nextTitle = titleFor(nextRef)
    const nextIcon = iconFor(nextRef)
    const updated = state.openContexts.map((c) =>
      c.id === existing.id
        ? {
            ...c,
            params: nextParams,
            title: nextTitle,
            icon: nextIcon,
            lastFocusedAt: now,
          }
        : c
    )
    const updatedExisting = updated.find((c) => c.id === existing.id)!

    // Coalesce: if a swap is already running, the new active flips
    // instantly with no fresh choreography. Keeps rapid clicks feeling
    // responsive instead of stacking animations.
    // Reduced motion: the swap relies on CSS transitions to fill both
    // phases. Without them the tiles would hop between poses with dead
    // air in between, which is worse than an instant cut. Skip straight
    // to the post-swap state.
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = state.loopSwap == null && !reducedMotion
    const seq = animate
      ? ++loopSwapSeqCounter
      : state.loopSwap?.seq ?? ++loopSwapSeqCounter
    const nextLoopSwap: LoopSwap | null = animate
      ? {
          fromId: fromCtx.id,
          toId: existing.id,
          phase: "exit",
          seq,
        }
      : state.loopSwap

    set({
      openContexts: updated,
      activeId: existing.id,
      // Suppress launch-rect animation while a swap is choreographed —
      // they're competing visual stories about the same transition.
      pendingLaunch: null,
      loopSwap: nextLoopSwap,
    })
    syncHash(updatedExisting)

    if (animate && typeof window !== "undefined") {
      window.setTimeout(() => {
        const s = get()
        if (s.loopSwap?.seq !== seq) return
        set({ loopSwap: { ...s.loopSwap!, phase: "enter" } })
      }, LOOP_EXIT_MS)
      window.setTimeout(() => {
        const s = get()
        if (s.loopSwap?.seq !== seq) return
        set({ loopSwap: null })
      }, LOOP_EXIT_MS + LOOP_ENTER_MS)
    }
    return existing.id
  },

  close: (id) => {
    const state = get()
    const closing = state.openContexts.find((c) => c.id === id)
    const remaining = state.openContexts.filter((c) => c.id !== id)
    let nextActive: string | null = state.activeId
    if (state.activeId === id) {
      nextActive =
        remaining.length > 0
          ? [...remaining].sort((a, b) => b.lastFocusedAt - a.lastFocusedAt)[0]!.id
          : null
    }
    const nextRecents = closing
      ? [
          {
            type: closing.type,
            title: closing.title,
            params: closing.params,
            closedAt: Date.now(),
          },
          ...state.closedRecents.filter(
            (r) => !(r.type === closing.type && refKey({ type: r.type, params: r.params }) === refKey({ type: closing.type, params: closing.params }))
          ),
        ].slice(0, RECENTS_CAP)
      : state.closedRecents
    set({ openContexts: remaining, activeId: nextActive, closedRecents: nextRecents })
    const active = remaining.find((c) => c.id === nextActive) ?? null
    syncHash(active)
  },

  closeOthers: (id) => {
    const state = get()
    const keep = state.openContexts.find((c) => c.id === id)
    if (!keep) return
    set({ openContexts: [keep], activeId: id })
    syncHash(keep)
  },

  closeAll: () => {
    set({ openContexts: [], activeId: null })
    syncHash(null)
  },

  focus: (id) => {
    const state = get()
    const ctx = state.openContexts.find((c) => c.id === id)
    if (!ctx) return
    const now = Date.now()
    const updated = state.openContexts.map((c) =>
      c.id === id ? { ...c, lastFocusedAt: now } : c
    )
    set({ openContexts: updated, activeId: id })
    syncHash({ ...ctx, lastFocusedAt: now })
  },

  goHome: () => {
    set({ activeId: null })
    syncHash(null)
  },

  hydrateFromHash: () => {
    if (typeof window === "undefined") return
    const ref = hashToRef(window.location.hash)
    if (!ref) {
      set({ activeId: null })
      return
    }
    get().open(ref)
  },

  consumeLaunch: () => set({ pendingLaunch: null }),
}))

export function useActiveContext(): Context | null {
  const openContexts = useContexts((s) => s.openContexts)
  const activeId = useContexts((s) => s.activeId)
  return useMemo(
    () => openContexts.find((c) => c.id === activeId) ?? null,
    [openContexts, activeId]
  )
}

export function useOpenContexts(): Context[] {
  return useContexts((s) => s.openContexts)
}

export function useFocusOrder(): Context[] {
  const openContexts = useContexts((s) => s.openContexts)
  return useMemo(
    () => [...openContexts].sort((a, b) => b.lastFocusedAt - a.lastFocusedAt),
    [openContexts]
  )
}

export function useClosedRecents(): ClosedRecent[] {
  return useContexts((s) => s.closedRecents)
}

export function bindHashListener() {
  if (typeof window === "undefined") return () => {}
  const onHashChange = () => {
    const ref = hashToRef(window.location.hash)
    if (!ref) {
      useContexts.getState().goHome()
      return
    }
    const state = useContexts.getState()
    const existing = findExisting(state.openContexts, ref)
    if (existing) {
      if (state.activeId !== existing.id) state.focus(existing.id)
    } else {
      state.open(ref)
    }
  }
  window.addEventListener("hashchange", onHashChange)
  return () => window.removeEventListener("hashchange", onHashChange)
}
