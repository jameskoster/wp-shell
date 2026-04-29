import type { ContextRef } from "@/contexts/types"
import type { Discussion } from "./discussions"
import { DISCUSSIONS } from "./discussions"

/**
 * Where a community member is right now in the (mocked) Maker Circle
 * forum. Mirrors `presence.ts` and `editorialPresence.ts` so the
 * dashboard's collaborative widgets render with the same shape — but
 * the "editing" variant points at a forum thread rather than a page
 * or article, and the "screen" labels use community vocabulary
 * (Workshops, Members, Settings).
 */
export type CommunityPresenceLocation =
  | { kind: "dashboard" }
  | { kind: "screen"; label: string; action?: ContextRef }
  | { kind: "thread"; discussionId: string; activity: "reading" | "replying" }

export type CommunityPresence = {
  id: string
  name: string
  /** Visible role chip — "Member", "Pro", "Moderator", "You". */
  role: string
  location: CommunityPresenceLocation
  since: string
}

export const COMMUNITY_PRESENCE: CommunityPresence[] = [
  {
    id: "iben",
    name: "Iben Mortensen",
    role: "Moderator",
    location: {
      kind: "thread",
      discussionId: "indigo-vat-troubleshoot",
      activity: "replying",
    },
    since: "Just now",
  },
  {
    id: "noor",
    name: "Noor Khoury",
    role: "Moderator",
    location: {
      kind: "thread",
      discussionId: "stoneware-glazes-temp",
      activity: "replying",
    },
    since: "1m ago",
  },
  {
    id: "kade",
    name: "Kade Okafor",
    role: "Maker",
    location: {
      kind: "thread",
      discussionId: "may-workshop-thread",
      activity: "reading",
    },
    since: "2m ago",
  },
  {
    id: "rosa",
    name: "Rosa Meri",
    role: "Pro",
    location: {
      kind: "thread",
      discussionId: "letterpress-restoration",
      activity: "replying",
    },
    since: "5m ago",
  },
  {
    id: "olu",
    name: "Olu Adeyemi",
    role: "Pro",
    location: {
      kind: "screen",
      label: "Workshops",
      action: {
        type: "edit-page",
        params: { id: "workshops" },
        title: "Workshops",
      },
    },
    since: "8m ago",
  },
  {
    id: "fern",
    name: "Fern Wallace",
    role: "Member",
    location: {
      kind: "thread",
      discussionId: "scrap-leather-uses",
      activity: "reading",
    },
    since: "11m ago",
  },
  {
    id: "alex",
    name: "Alex Park",
    role: "You",
    location: { kind: "dashboard" },
    since: "Now",
  },
]

function getDiscussion(id: string): Discussion | undefined {
  return DISCUSSIONS.find((d) => d.id === id)
}

/** Locator string for the "Active in forum" widget meta line. */
export function locationLabel(p: CommunityPresence): string {
  if (p.location.kind === "dashboard") return "Dashboard"
  if (p.location.kind === "screen") return p.location.label
  const verb = p.location.activity === "replying" ? "Replying to" : "Reading"
  const thread = getDiscussion(p.location.discussionId)
  return thread ? `${verb} “${thread.title}”` : `${verb} a thread`
}

/**
 * Click target for a presence row. Threads route to the (mocked)
 * forum workspace via `edit-page` with a synthetic id — the editor's
 * mock fallback handles the unknown id gracefully.
 */
export function locationAction(
  p: CommunityPresence,
): ContextRef | undefined {
  if (p.location.kind === "dashboard") return undefined
  if (p.location.kind === "screen") return p.location.action
  return {
    type: "edit-page",
    params: { id: `discussion-${p.location.discussionId}` },
    title: "Discussion",
  }
}
