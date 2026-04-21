import { useMemo } from "react"
import { create } from "zustand"
import type { Context, ContextRef } from "./types"
import { isSingleton, metaFor, titleFor } from "./registry"
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

let launchSeqCounter = 0

type State = {
  openContexts: Context[]
  activeId: string | null
  closedRecents: ClosedRecent[]
  pendingLaunch: LaunchOrigin | null
}

const RECENTS_CAP = 5

type Actions = {
  open: (ref: ContextRef, originRect?: DOMRect | null) => string
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
  if (isSingleton(ref.type)) return ref.type
  return `${ref.type}:${refKey(ref)}:${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function findExisting(
  contexts: Context[],
  ref: ContextRef
): Context | undefined {
  if (isSingleton(ref.type)) {
    return contexts.find((c) => c.type === ref.type)
  }
  const key = refKey(ref)
  return contexts.find((c) => `${c.type}:${refKey({ type: c.type, params: c.params })}` === `${ref.type}:${key}`)
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

  open: (ref, originRect) => {
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
      const updated = state.openContexts.map((c) =>
        c.id === existing.id ? { ...c, lastFocusedAt: now } : c
      )
      set({
        openContexts: updated,
        activeId: existing.id,
        pendingLaunch: launchFor(existing.id),
      })
      syncHash(existing)
      return existing.id
    }
    const meta = metaFor(ref.type)
    const newCtx: Context = {
      id: makeId(ref),
      type: ref.type,
      title: titleFor(ref),
      icon: meta.icon,
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
