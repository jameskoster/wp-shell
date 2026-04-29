import type { ContextRef } from "@/contexts/types"
import { getPage, type PageRow } from "./pages"

/**
 * Where a user is right now in the admin. Each variant maps to the
 * widget's row meta and (when possible) to a `ContextRef` so clicking
 * the row jumps to the same surface the user is on.
 *
 *  - `dashboard`   — Home. No deep link.
 *  - `screen`      — A named admin destination (Comments, Orders, etc.).
 *  - `editing`     — Inside the Editor on a specific page. Action opens
 *                    that page; powers the Active posts widget.
 */
export type PresenceLocation =
  | { kind: "dashboard" }
  | { kind: "screen"; label: string; action?: ContextRef }
  | { kind: "editing"; pageId: string }

export type Presence = {
  /** Stable identifier — also seeds the deterministic avatar fallback. */
  id: string
  /** Display name, used as the row title and the avatar's `name` seed. */
  name: string
  location: PresenceLocation
  /** Relative time since last heartbeat (purely cosmetic in the mock). */
  since: string
}

/**
 * Single source of truth for the prototype's presence state. Names mirror
 * the authors already in the PAGES mock (Anya, Marco, Sarah) so the
 * dashboard's presence widgets read consistently with the Pages dataview.
 *
 * Includes the current user (Alex Park) so the widgets visibly include
 * "you" — matches the WP feature plugin's behaviour.
 */
export const PRESENCE: Presence[] = [
  {
    id: "marco",
    name: "Marco Davila",
    location: { kind: "editing", pageId: "spring-collection" },
    since: "Just now",
  },
  {
    id: "anya",
    name: "Anya Petrov",
    location: { kind: "editing", pageId: "studio-update" },
    since: "1m ago",
  },
  {
    id: "sarah",
    name: "Sarah Kim",
    location: {
      kind: "screen",
      label: "Comments",
      action: { type: "edit-page", params: { id: "comments" }, title: "Comments" },
    },
    since: "2m ago",
  },
  {
    id: "priya",
    name: "Priya Nair",
    location: {
      kind: "screen",
      label: "Orders",
      action: { type: "orders" },
    },
    since: "3m ago",
  },
  {
    id: "alex",
    name: "Alex Park",
    location: { kind: "dashboard" },
    since: "Now",
  },
  {
    id: "lee",
    name: "Lee Hartwell",
    location: { kind: "editing", pageId: "april-look" },
    since: "5m ago",
  },
  {
    id: "tomas",
    name: "Tomás Rivera",
    location: {
      kind: "screen",
      label: "Plugins",
      action: { type: "edit-page", params: { id: "plugins" }, title: "Plugins" },
    },
    since: "8m ago",
  },
  {
    id: "jess",
    name: "Jess Mendel",
    location: { kind: "editing", pageId: "ceramics-restock" },
    since: "12m ago",
  },
]

/**
 * Active editor presences grouped by page. A page can have multiple
 * concurrent editors; we preserve insertion order so the row's primary
 * editor (the first to start) anchors the avatar and the meta line
 * mentions the rest.
 */
export type ActivePost = {
  page: PageRow
  editors: Presence[]
}

export function activePosts(): ActivePost[] {
  const byPage = new Map<string, Presence[]>()
  for (const p of PRESENCE) {
    if (p.location.kind !== "editing") continue
    const list = byPage.get(p.location.pageId) ?? []
    list.push(p)
    byPage.set(p.location.pageId, list)
  }
  const out: ActivePost[] = []
  for (const [pageId, editors] of byPage) {
    const page = getPage(pageId)
    if (!page) continue
    out.push({ page, editors })
  }
  return out
}

/** Locator string for the "Who's online" row meta. */
export function locationLabel(p: Presence): string {
  if (p.location.kind === "dashboard") return "Dashboard"
  if (p.location.kind === "screen") return p.location.label
  const page = getPage(p.location.pageId)
  return page ? `Editing “${page.title}”` : "Editing a post"
}

/** Resolve the row's click target — `undefined` rows render as text-only. */
export function locationAction(p: Presence): ContextRef | undefined {
  if (p.location.kind === "dashboard") return undefined
  if (p.location.kind === "screen") return p.location.action
  return {
    type: "editor",
    params: { kind: "page", id: p.location.pageId },
  }
}
