import type { BadgeVariant } from "@/widgets/types"

/**
 * Forum sections in Maker Circle. Each discussion lives in exactly
 * one. Names are deliberately generic-craft so they read for any
 * member regardless of medium.
 */
export type DiscussionCategory =
  | "Showcase"
  | "Help & critique"
  | "Workshops"
  | "Tools & materials"
  | "Off-topic"

export type Discussion = {
  id: string
  title: string
  category: DiscussionCategory
  /** Member id of the original poster — joins back to MEMBERS. */
  authorId: string
  /** Member name (denormalised so widgets don't have to join). */
  authorName: string
  replyCount: number
  /** Member id of the most recent replier. */
  lastReplierId: string
  lastReplierName: string
  lastReplyAt: string
  /** Pinned threads sort to the top of the Top discussions widget. */
  pinned?: boolean
  /** Unread count for the manager — drives the row's pill. */
  newReplies?: number
}

/**
 * Badge tone per category. Picked so the most-actionable categories
 * (Help & critique, Workshops) read as distinct from Showcase /
 * Off-topic in the Top discussions widget.
 */
export const CATEGORY_VARIANT: Record<DiscussionCategory, BadgeVariant> = {
  Showcase: "secondary",
  "Help & critique": "warning",
  Workshops: "info",
  "Tools & materials": "outline",
  "Off-topic": "outline",
}

export const DISCUSSIONS: Discussion[] = [
  {
    id: "indigo-vat-troubleshoot",
    title: "Indigo vat went green-grey overnight — recoverable?",
    category: "Help & critique",
    authorId: "emi-tanaka",
    authorName: "Emi Tanaka",
    replyCount: 24,
    lastReplierId: "noor-khoury",
    lastReplierName: "Noor Khoury",
    lastReplyAt: "12m ago",
    newReplies: 6,
    pinned: true,
  },
  {
    id: "may-workshop-thread",
    title: "May workshop signup — Joinery for jewellers (Iben)",
    category: "Workshops",
    authorId: "alex-park",
    authorName: "Alex Park",
    replyCount: 38,
    lastReplierId: "kade-okafor",
    lastReplierName: "Kade Okafor",
    lastReplyAt: "32m ago",
    newReplies: 12,
    pinned: true,
  },
  {
    id: "marquetry-progress-shots",
    title: "Marquetry — three months in. Honest crit welcome.",
    category: "Showcase",
    authorId: "kade-okafor",
    authorName: "Kade Okafor",
    replyCount: 18,
    lastReplierId: "iben-mortensen",
    lastReplierName: "Iben Mortensen",
    lastReplyAt: "1h ago",
    newReplies: 4,
  },
  {
    id: "where-to-buy-walnut-uk",
    title: "Where are people sourcing walnut in the UK?",
    category: "Tools & materials",
    authorId: "rosa-meri",
    authorName: "Rosa Meri",
    replyCount: 14,
    lastReplierId: "ahmed-rashid",
    lastReplierName: "Ahmed Rashid",
    lastReplyAt: "2h ago",
    newReplies: 2,
  },
  {
    id: "pro-tier-critique-may",
    title: "Pro critique session — submissions thread (May)",
    category: "Workshops",
    authorId: "noor-khoury",
    authorName: "Noor Khoury",
    replyCount: 9,
    lastReplierId: "olu-adeyemi",
    lastReplierName: "Olu Adeyemi",
    lastReplyAt: "3h ago",
    newReplies: 1,
  },
  {
    id: "stoneware-glazes-temp",
    title: "Cone 6 vs cone 10 — temp creep at small kilns?",
    category: "Help & critique",
    authorId: "olu-adeyemi",
    authorName: "Olu Adeyemi",
    replyCount: 21,
    lastReplierId: "iben-mortensen",
    lastReplierName: "Iben Mortensen",
    lastReplyAt: "4h ago",
    newReplies: 3,
  },
  {
    id: "letterpress-restoration",
    title: "Restoring a 1920s Adana — anyone done it sympathetically?",
    category: "Showcase",
    authorId: "rosa-meri",
    authorName: "Rosa Meri",
    replyCount: 11,
    lastReplierId: "noor-khoury",
    lastReplierName: "Noor Khoury",
    lastReplyAt: "Yesterday",
  },
  {
    id: "monthly-zoom-call",
    title: "Monthly hangout — May agenda + suggestions",
    category: "Off-topic",
    authorId: "alex-park",
    authorName: "Alex Park",
    replyCount: 16,
    lastReplierId: "fern-wallace",
    lastReplierName: "Fern Wallace",
    lastReplyAt: "Yesterday",
    pinned: true,
  },
  {
    id: "scrap-leather-uses",
    title: "What do you do with offcuts of vegetable-tan leather?",
    category: "Tools & materials",
    authorId: "ahmed-rashid",
    authorName: "Ahmed Rashid",
    replyCount: 27,
    lastReplierId: "iben-mortensen",
    lastReplierName: "Iben Mortensen",
    lastReplyAt: "Yesterday",
    newReplies: 5,
  },
  {
    id: "newsletter-format",
    title: "Should the weekly newsletter include member work?",
    category: "Off-topic",
    authorId: "alex-park",
    authorName: "Alex Park",
    replyCount: 8,
    lastReplierId: "mira-lindqvist",
    lastReplierName: "Mira Lindqvist",
    lastReplyAt: "2d ago",
  },
  {
    id: "feedback-on-bookbinding",
    title: "First coptic-stitch journal — gluing the spine is fighting me",
    category: "Help & critique",
    authorId: "ahmed-rashid",
    authorName: "Ahmed Rashid",
    replyCount: 13,
    lastReplierId: "noor-khoury",
    lastReplierName: "Noor Khoury",
    lastReplyAt: "2d ago",
    newReplies: 1,
  },
]

/**
 * Top discussions for the dashboard widget — pinned first, then
 * sorted by reply count. Mirrors how the (mocked) forum landing
 * page would surface "what's hot" and gives the manager a single
 * scanable column of the most active threads.
 */
export function topDiscussions(limit = 8): Discussion[] {
  return [...DISCUSSIONS]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.replyCount - a.replyCount
    })
    .slice(0, limit)
}

/** Total unread replies across the whole forum — header badge. */
export function totalNewReplies(): number {
  return DISCUSSIONS.reduce((sum, d) => sum + (d.newReplies ?? 0), 0)
}
