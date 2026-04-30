import {
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Inbox,
  MessageCircle,
  MonitorSmartphone,
  Palette,
  Plug,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"
import {
  COMMUNITY_PRESENCE,
  locationAction,
  locationLabel,
} from "@/mocks/communityPresence"
import {
  CATEGORY_VARIANT,
  topDiscussions,
  totalNewReplies,
} from "@/mocks/discussions"
import {
  pendingApplications,
  recentSignups,
  TIER_LABEL,
  TIER_VARIANT,
} from "@/mocks/members"
import type { InfoListItem, Recipe } from "@/widgets/types"

const recentSignupItems: InfoListItem[] = recentSignups(7).map((m) => ({
  id: m.id,
  title: m.name,
  meta: `${m.craft} · ${m.joinedAt}`,
  thumbnail: { kind: "avatar", name: m.name },
  badge: { label: TIER_LABEL[m.tier], variant: TIER_VARIANT[m.tier] },
  action: {
    type: "edit-page",
    params: { id: `member-${m.id}` },
    title: "Member",
  },
}))

const topDiscussionItems: InfoListItem[] = topDiscussions(7).map((d) => {
  const newReplies = d.newReplies
    ? ` · ${d.newReplies} new`
    : ""
  return {
    id: d.id,
    title: d.title,
    meta: `${d.replyCount} replies${newReplies} · last ${d.lastReplyAt} by ${d.lastReplierName}`,
    thumbnail: { kind: "avatar", name: d.authorName },
    badge: { label: d.category, variant: CATEGORY_VARIANT[d.category] },
    action: {
      type: "edit-page",
      params: { id: `discussion-${d.id}` },
      title: "Discussion",
    },
  }
})

const activeInForumItems: InfoListItem[] = COMMUNITY_PRESENCE.map((p) => {
  const action = locationAction(p)
  return {
    id: p.id,
    title: p.name,
    meta: `${p.role} · ${locationLabel(p)} · ${p.since}`,
    thumbnail: { kind: "avatar", name: p.name },
    ...(action ? { action } : {}),
  }
})

const pendingApplicationItems: InfoListItem[] = pendingApplications().map(
  (m) => ({
    id: m.id,
    title: m.name,
    meta: `Applied ${m.joinedAt} · ${m.craft}`,
    thumbnail: { kind: "avatar", name: m.name },
    badge: {
      label: `${TIER_LABEL[m.tier]} tier`,
      variant: TIER_VARIANT[m.tier],
    },
    action: {
      type: "edit-page",
      params: { id: "applications" },
      title: "Applications",
    },
  }),
)

const newReplyCount = totalNewReplies()
const pendingCount = pendingApplicationItems.length

/**
 * Maker Circle — community / membership site. The community manager's
 * dashboard: signups & MRR at a glance, the forum's hot threads in
 * one column, recent signups in another, and the inbox-y stuff
 * (pending applications, who's online) anchored at the bottom.
 *
 * Layout (12-col grid, declaration-order packing):
 *
 *   ┌───────────────────────┬───┬───┬───┐
 *   │ site preview          │ M │ R │ S │  rows 0–1   (3 stats 2×2)
 *   │ (w:6 h:8)             ├───┴───┴───┤
 *   │                       │ Recent    │  rows 2–4  (recent signups 6×3)
 *   │                       │ signups   │
 *   │                       ├───────────┤
 *   │                       │ Top       │  rows 5–7  (top discussions 6×3)
 *   │                       │ discussns │
 *   ├───────────────────────┼───────────┤
 *   │ Active in forum (6×2) │ Pending   │  rows 8–9  (2 widgets 6×2)
 *   │                       │ applic'ns │
 *   └───────────────────────┴───────────┘
 *
 * No dashboard launch tiles — the community manager's nav lives
 * fully in the dock so the dashboard reads as "the community right
 * now" rather than a launcher. Dock items: Members, Discussions,
 * Workshops, Plans, Pages, Appearance, Plugins, Tools, Settings.
 */
export const membershipRecipe: Recipe = {
  id: "membership",
  role: "Community manager",
  widgets: [
    // Anchor: half-width, full-height. Same `h:8` rhythm as the
    // blogger recipe so the right column has room for one analytics
    // row + two large info widgets without things feeling stacked.
    {
      id: "site-preview",
      kind: "site-preview",
      title: "View site",
      icon: MonitorSmartphone,
      size: { w: 6, h: 8 },
      minSize: { w: 4, h: 3 },
      action: { type: "editor", title: "Appearance" },
      url: "makercircle.example/",
    },

    // Stats row — three small analytics widgets across the top of
    // the right column. The community manager's first scan: are
    // members + revenue trending the right way?
    {
      id: "metric-members",
      kind: "analytics",
      title: "Members",
      icon: Users,
      size: "lg",
      metric: {
        value: "3,420",
        delta: { value: "+128", trend: "up" },
        sparkline: [3210, 3248, 3286, 3320, 3354, 3390, 3420],
        caption: "Last 30 days",
      },
    },
    {
      id: "metric-mrr",
      kind: "analytics",
      title: "MRR",
      icon: DollarSign,
      size: "lg",
      metric: {
        value: "£8,640",
        delta: { value: "+£420", trend: "up" },
        sparkline: [7820, 7960, 8080, 8210, 8360, 8500, 8640],
        caption: "vs. last month",
      },
    },
    {
      id: "metric-signups",
      kind: "analytics",
      title: "New signups",
      icon: UserPlus,
      size: "lg",
      metric: {
        value: "128",
        delta: { value: "+22%", trend: "up" },
        sparkline: [12, 18, 14, 22, 19, 26, 31],
        caption: "Last 30 days",
      },
    },

    // Two large info widgets stacked under the stats. Recent signups
    // (above) is the manager's daily roster check; Top discussions
    // (below) is what's getting traction in the forum right now —
    // both are click-through into their respective workspaces.
    {
      id: "info-recent-signups",
      kind: "info",
      title: "Recent signups",
      icon: UserPlus,
      size: { w: 6, h: 3 },
      items: recentSignupItems,
    },
    {
      id: "info-top-discussions",
      kind: "info",
      title: "Top discussions",
      icon: MessageCircle,
      size: { w: 6, h: 3 },
      items: topDiscussionItems,
    },

    // Bottom row — 6×2 each, the manager's "inbox" surface. Active
    // in forum doubles as live presence; Pending applications is
    // the queue to clear before signups land.
    {
      id: "info-active-in-forum",
      kind: "info",
      title: "Active in forum",
      icon: UserCheck,
      size: { w: 6, h: 2 },
      items: activeInForumItems,
    },
    {
      id: "info-pending-applications",
      kind: "info",
      title: "Pending applications",
      icon: Inbox,
      size: { w: 6, h: 2 },
      headerBadge: pendingCount,
      items: pendingApplicationItems,
    },

    // Nav — community-flavoured dock. No `defaultPlacement: dashboard`
    // entries: every nav item lives in the dock so the dashboard
    // reads as "the community right now" rather than a launcher.
    {
      id: "nav-classic",
      kind: "nav",
      size: "tall",
      items: [
        {
          id: "n-members",
          title: "Members",
          icon: Users,
          action: {
            type: "edit-page",
            params: { id: "members" },
            title: "Members",
          },
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
        },
        {
          id: "n-discussions",
          title: "Discussions",
          icon: MessageCircle,
          action: {
            type: "edit-page",
            params: { id: "discussions" },
            title: "Discussions",
          },
          badge: newReplyCount > 0 ? String(newReplyCount) : undefined,
        },
        {
          id: "n-workshops",
          title: "Workshops",
          icon: CalendarDays,
          action: {
            type: "edit-page",
            params: { id: "workshops" },
            title: "Workshops",
          },
        },
        {
          id: "n-plans",
          title: "Plans & billing",
          icon: CreditCard,
          action: {
            type: "edit-page",
            params: { id: "plans" },
            title: "Plans & billing",
          },
        },
        {
          id: "n-pages",
          title: "Pages",
          icon: FileText,
          action: { type: "pages" },
        },
        {
          id: "n-appearance",
          title: "Appearance",
          icon: Palette,
          action: { type: "editor", title: "Appearance" },
        },
        {
          id: "n-plugins",
          title: "Plugins",
          icon: Plug,
          action: {
            type: "edit-page",
            params: { id: "plugins" },
            title: "Plugins",
          },
        },
        {
          id: "n-tools",
          title: "Tools",
          icon: Wrench,
          action: {
            type: "edit-page",
            params: { id: "tools" },
            title: "Tools",
          },
        },
        {
          id: "n-settings",
          title: "Settings",
          icon: Settings,
          action: { type: "settings" },
        },
      ],
    },
  ],
}
