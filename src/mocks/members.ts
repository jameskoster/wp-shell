import type { BadgeVariant } from "@/widgets/types"

/**
 * Membership tier — drives the badge variant rendered next to a
 * member's name across community widgets. Three tiers keep the
 * vocabulary readable at a glance:
 *
 *  - `free`   — newsletter / read-only access. The bulk of signups.
 *  - `maker`  — paid monthly tier. Workshops + member forum access.
 *  - `pro`    — annual tier. Includes everything + small-group
 *               critique sessions.
 *
 * Adding a tier means adding it here AND extending `TIER_LABEL` /
 * `TIER_VARIANT` so widgets stay in sync.
 */
export type MemberTier = "free" | "maker" | "pro"

/**
 * Whether a signup has cleared the manager's review. `pending`
 * members surface in the Pending applications widget with a path to
 * approve / decline; `active` and `lapsed` show up in the roster
 * widgets but with different tone so churn stays visible.
 */
export type MemberStatus = "active" | "pending" | "lapsed"

export type Member = {
  id: string
  name: string
  /** Public handle / forum @-name. */
  handle: string
  tier: MemberTier
  status: MemberStatus
  /** When they joined (free → upgrade dates aren't tracked here). */
  joinedAt: string
  /** Relative time since last forum activity — drives the meta line. */
  lastActive: string
  /** Free-text bio fragment surfaced in some widgets. */
  craft: string
}

export const TIER_LABEL: Record<MemberTier, string> = {
  free: "Free",
  maker: "Maker",
  pro: "Pro",
}

/**
 * Badge tone for tier pills. `pro` gets `success` so paying members
 * read as the goal state; `maker` is `info` (neutral-positive) and
 * `free` is `outline` (visible but not loud — the manager is mostly
 * scanning for paid signups).
 */
export const TIER_VARIANT: Record<MemberTier, BadgeVariant> = {
  free: "outline",
  maker: "info",
  pro: "success",
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  pending: "Pending",
  lapsed: "Lapsed",
}

export const STATUS_VARIANT: Record<MemberStatus, BadgeVariant> = {
  active: "secondary",
  pending: "warning",
  lapsed: "destructive",
}

export const MEMBERS: Member[] = [
  // Newest signups (last week) — surfaced by the Recent signups widget.
  {
    id: "rosa-meri",
    name: "Rosa Meri",
    handle: "@rosa",
    tier: "pro",
    status: "active",
    joinedAt: "Apr 28, 2026",
    lastActive: "12m ago",
    craft: "Letterpress · Bristol",
  },
  {
    id: "kade-okafor",
    name: "Kade Okafor",
    handle: "@kade",
    tier: "maker",
    status: "active",
    joinedAt: "Apr 27, 2026",
    lastActive: "1h ago",
    craft: "Marquetry · Manchester",
  },
  {
    id: "emi-tanaka",
    name: "Emi Tanaka",
    handle: "@emi",
    tier: "maker",
    status: "active",
    joinedAt: "Apr 26, 2026",
    lastActive: "Yesterday",
    craft: "Indigo dyeing · Kyoto",
  },
  {
    id: "fern-wallace",
    name: "Fern Wallace",
    handle: "@fern",
    tier: "free",
    status: "active",
    joinedAt: "Apr 26, 2026",
    lastActive: "2d ago",
    craft: "Botanical illustration",
  },
  {
    id: "olu-adeyemi",
    name: "Olu Adeyemi",
    handle: "@olu",
    tier: "pro",
    status: "active",
    joinedAt: "Apr 25, 2026",
    lastActive: "3h ago",
    craft: "Stoneware · Lagos",
  },
  {
    id: "mira-lindqvist",
    name: "Mira Lindqvist",
    handle: "@mira",
    tier: "free",
    status: "active",
    joinedAt: "Apr 25, 2026",
    lastActive: "5h ago",
    craft: "Wool spinning · Gothenburg",
  },
  {
    id: "ahmed-rashid",
    name: "Ahmed Rashid",
    handle: "@ahmed",
    tier: "maker",
    status: "active",
    joinedAt: "Apr 24, 2026",
    lastActive: "Just now",
    craft: "Traditional bookbinding",
  },

  // Pending applications — awaiting moderator review. Surfaced by
  // the Pending applications widget; click-through goes to the
  // (mocked) members workspace.
  {
    id: "linnea-sand",
    name: "Linnea Sand",
    handle: "@linnea",
    tier: "pro",
    status: "pending",
    joinedAt: "Apr 28, 2026",
    lastActive: "Just now",
    craft: "Glassblowing · Stockholm",
  },
  {
    id: "tomas-fischer",
    name: "Tomas Fischer",
    handle: "@tomas",
    tier: "maker",
    status: "pending",
    joinedAt: "Apr 27, 2026",
    lastActive: "5h ago",
    craft: "Restoration carpentry",
  },
  {
    id: "yuki-park",
    name: "Yuki Park",
    handle: "@yuki",
    tier: "maker",
    status: "pending",
    joinedAt: "Apr 27, 2026",
    lastActive: "Yesterday",
    craft: "Lampwork glass beads",
  },
  {
    id: "claudia-vega",
    name: "Claudia Vega",
    handle: "@claudia",
    tier: "pro",
    status: "pending",
    joinedAt: "Apr 26, 2026",
    lastActive: "2d ago",
    craft: "Saddle-stitched leather",
  },

  // Established members — older signups surfaced as moderators / hosts
  // in the Active in forum widget.
  {
    id: "iben-mortensen",
    name: "Iben Mortensen",
    handle: "@iben",
    tier: "pro",
    status: "active",
    joinedAt: "Sep 14, 2024",
    lastActive: "Just now",
    craft: "Hand-forged knives · Copenhagen",
  },
  {
    id: "noor-khoury",
    name: "Noor Khoury",
    handle: "@noor",
    tier: "pro",
    status: "active",
    joinedAt: "Mar 02, 2025",
    lastActive: "2m ago",
    craft: "Mosaics · Beirut",
  },
  {
    id: "alex-park",
    name: "Alex Park",
    handle: "@alex",
    tier: "pro",
    status: "active",
    joinedAt: "Jan 11, 2024",
    lastActive: "Now",
    craft: "Community manager · You",
  },
]

/** Members listed in join-order, newest first. */
export const MEMBERS_BY_RECENT: Member[] = [...MEMBERS].sort((a, b) => {
  // Cheap recency sort using lastActive as a proxy when joinedAt
  // is older — keeps "Now" / "Just now" entries at the top without
  // requiring real timestamps in the mock.
  const score = (m: Member) => {
    if (/^now$|^just now/i.test(m.lastActive)) return 0
    if (/^\d+m ago/i.test(m.lastActive)) return 1
    if (/^\d+h ago/i.test(m.lastActive)) return 2
    if (/^yesterday/i.test(m.lastActive)) return 3
    return 4
  }
  return score(a) - score(b)
})

/** Most recent signups — what the Recent signups widget renders. */
export function recentSignups(limit = 6): Member[] {
  return MEMBERS.filter((m) => m.status === "active").slice(0, limit)
}

/** Pending applications awaiting the manager's review. */
export function pendingApplications(): Member[] {
  return MEMBERS.filter((m) => m.status === "pending")
}

/** Helper for analytics: paying members (maker + pro). */
export function paidMembers(): Member[] {
  return MEMBERS.filter((m) => m.status === "active" && m.tier !== "free")
}
