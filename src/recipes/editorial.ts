import {
  BarChart3,
  CalendarClock,
  Eye,
  FileCheck,
  FileText,
  FilePen,
  Image,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  PenSquare,
  Plug,
  Settings,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react"
import {
  ARTICLES,
  SECTION_VARIANT,
  STATUS_LABEL,
  STATUS_VARIANT,
  articlesInReview,
  scheduledArticles,
  topArticles,
} from "@/mocks/articles"
import {
  EDITORIAL_PRESENCE,
  activeArticles,
  locationAction,
  locationLabel,
} from "@/mocks/editorialPresence"
import { renderEditorialCalendar } from "@/widgets/EditorialCalendar"
import type { InfoListItem, Recipe } from "@/widgets/types"

// Reused by the dashboard's `editor` clicks: the Editor's mock
// fallback handles unknown ids gracefully, so opening an article from
// any of the editorial widgets lands on a generic editor surface
// rather than 404'ing.
const articleAction = (id: string): InfoListItem["action"] => ({
  type: "editor",
  params: { kind: "post", id },
})

const reviewItems: InfoListItem[] = articlesInReview().map((a) => ({
  id: a.id,
  title: a.title,
  meta: `By ${a.author} · ${a.date}`,
  thumbnail: { kind: "image", seed: a.seed },
  badge: { label: a.section, variant: SECTION_VARIANT[a.section] },
  action: articleAction(a.id),
}))

const calendarItems: InfoListItem[] = scheduledArticles().map((a) => ({
  id: a.id,
  title: a.title,
  meta: `${a.date} · ${a.author}`,
  thumbnail: { kind: "image", seed: a.seed },
  badge: { label: a.section, variant: SECTION_VARIANT[a.section] },
  action: articleAction(a.id),
}))

const topStoryItems: InfoListItem[] = topArticles(8).map((a) => ({
  id: a.id,
  title: a.title,
  meta: `${a.views?.toLocaleString() ?? "—"} views · ${a.author}`,
  thumbnail: { kind: "image", seed: a.seed },
  badge: { label: a.section, variant: SECTION_VARIANT[a.section] },
  action: articleAction(a.id),
}))

const activeArticleItems: InfoListItem[] = activeArticles().map(
  ({ article, editors }) => {
    const [primary, ...rest] = editors
    const others =
      rest.length === 0
        ? ""
        : rest.length === 1
          ? ` & ${rest[0].name.split(" ")[0]}`
          : ` & ${rest.length} others`
    return {
      id: article.id,
      title: article.title,
      meta: `${primary.name} editing${others} · ${primary.since}`,
      thumbnail: { kind: "avatar", name: primary.name },
      badge: { label: article.section, variant: SECTION_VARIANT[article.section] },
      action: articleAction(article.id),
    }
  },
)

const whosOnlineItems: InfoListItem[] = EDITORIAL_PRESENCE.map((p) => {
  const action = locationAction(p)
  return {
    id: p.id,
    title: p.name,
    meta: `${p.role} · ${locationLabel(p)} · ${p.since}`,
    thumbnail: { kind: "avatar", name: p.name },
    ...(action ? { action } : {}),
  }
})

const draftCommentItems: InfoListItem[] = [
  {
    id: "c1",
    title: "Anonymous on “Inside the city's longest-running housing fight”",
    meta:
      "“If you can verify the timeline against the council minutes from March, the case gets stronger.”",
    thumbnail: { kind: "avatar", name: "Anonymous" },
    action: {
      type: "edit-page",
      params: { id: "comments" },
      title: "Comments",
    },
  },
  {
    id: "c2",
    title: "Imogen R. on “Council passes £4m cuts in late-night session”",
    meta:
      "“The figure for after-school provision is closer to £900k once the contingency is restored — see ledger 2026-04.”",
    thumbnail: { kind: "avatar", name: "Imogen Reilly" },
    action: {
      type: "edit-page",
      params: { id: "comments" },
      title: "Comments",
    },
  },
  {
    id: "c3",
    title: "Daniel O. on “Stokes Croft after the venues”",
    meta:
      "“Worth mentioning that two of the three buildings are owned by the same landlord — public record.”",
    thumbnail: { kind: "avatar", name: "Daniel Okafor" },
    action: {
      type: "edit-page",
      params: { id: "comments" },
      title: "Comments",
    },
  },
]

const submissionItems: InfoListItem[] = [
  {
    id: "s1",
    title: "Pitch — A summer at the Easton allotments",
    meta: "Olive Khan · 1,800 words · 12m ago",
    thumbnail: { kind: "avatar", name: "Olive Khan" },
  },
  {
    id: "s2",
    title: "Cold submission — Reviewing the Tyntesfield restoration",
    meta: "Robin McClure · Full draft · 2h ago",
    thumbnail: { kind: "avatar", name: "Robin McClure" },
  },
  {
    id: "s3",
    title: "Pitch — Inside the new social housing co-op",
    meta: "Sana Iqbal · 600-word brief · Yesterday",
    thumbnail: { kind: "avatar", name: "Sana Iqbal" },
  },
  {
    id: "s4",
    title: "Pitch — A profile of the harbour pilot",
    meta: "Ezra Holloway · 400-word brief · 2d ago",
    thumbnail: { kind: "avatar", name: "Ezra Holloway" },
  },
]

const reviewCount = reviewItems.length
const calendarCount = calendarItems.length
const draftCount = ARTICLES.filter((a) => a.status === "draft").length

/**
 * The Bristol Review — multi-author publication. Where the admin
 * recipe is commerce-dense and the blogger recipe is minimal, the
 * editorial dashboard is presence-and-workflow-centric.
 *
 * Layout (12-col grid, achieved via row-major first-fit packing of
 * the declared order):
 *
 *   ┌──────────────────┬────────────────┬───┐
 *   │ stats × 3 (w:2)  │  site preview  │ A │  rows 0–1
 *   ├──────────────────┤   (w:5 h:6)    ├───┤
 *   │ editorial cal    │                │ P │  rows 2–5
 *   │ (w:6 h:4 — table)│                ├───┤
 *   ├──────┬─────┬─────┴────────────────┤ T │  rows 2–3
 *   │ pend │ edit│ drft│  who's / top   ├───┤
 *   │ rev  │     │ s   │  stories, etc. │ S │  rows 2–3
 *   └──────┴─────┴─────┴────────────────┴───┘
 *
 * The right-edge launch tiles fall there naturally because the
 * site preview (w:5) leaves col 11 empty in rows 0–5; launch tiles
 * seed last (nav widget is last in `widgets`) and fill the first
 * available 1×1 cells, which are exactly that column.
 *
 * Status badges (`STATUS_VARIANT`, `SECTION_VARIANT`) come from the
 * articles mock so vocabulary on the dashboard stays consistent with
 * any future editorial dataview.
 */
export const editorialRecipe: Recipe = {
  id: "editorial",
  role: "Editorial publication",
  widgets: [
    {
      id: "metric-pageviews",
      kind: "analytics",
      title: "Pageviews",
      icon: Eye,
      size: "lg",
      metric: {
        value: "184k",
        delta: { value: "+22.4%", trend: "up" },
        sparkline: [12, 18, 15, 21, 24, 28, 32],
        caption: "Last 7 days",
      },
    },
    {
      id: "metric-read-time",
      kind: "analytics",
      title: "Avg. read time",
      icon: Timer,
      size: "lg",
      metric: {
        value: "6:42",
        delta: { value: "+0:38", trend: "up" },
        sparkline: [5.4, 5.6, 5.9, 6.0, 6.2, 6.4, 6.7],
        caption: "vs. last week",
      },
    },
    {
      id: "metric-members",
      kind: "analytics",
      title: "Members",
      icon: Mail,
      size: "lg",
      metric: {
        value: "3,148",
        delta: { value: "+62", trend: "up" },
        sparkline: [3010, 3034, 3058, 3082, 3106, 3128, 3148],
        caption: "Last 7 days",
      },
    },
    {
      // Site preview is tall + narrow so the launch tiles land in the
      // single empty column at the right edge (col 11). Width 5 and
      // height 6 are tuned so col 11 stays free for the dashboard
      // launch tiles seeded by the nav widget.
      id: "site-preview",
      kind: "site-preview",
      title: "View site",
      icon: MonitorSmartphone,
      size: { w: 5, h: 6 },
      minSize: { w: 4, h: 4 },
      action: { type: "editor", title: "Appearance" },
      url: "bristolreview.example/",
    },
    {
      // The dashboard's visual anchor on the left. Renders a real
      // month-grid via the `render` escape hatch (see
      // EditorialCalendar.tsx) — `items` survive as the fallback
      // small-size summary if the user shrinks the widget below the
      // calendar's readable footprint.
      id: "info-editorial-calendar",
      kind: "info",
      title: "Editorial calendar",
      icon: CalendarClock,
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      headerBadge: calendarCount,
      items: calendarItems,
      render: renderEditorialCalendar,
    },
    {
      id: "info-pending-review",
      kind: "info",
      title: "Pending review",
      icon: FileCheck,
      size: "lg",
      headerBadge: reviewCount,
      items: reviewItems,
    },
    {
      id: "info-active-edits",
      kind: "info",
      title: "Active edits",
      icon: FilePen,
      size: "lg",
      headerBadge: activeArticleItems.length,
      items: activeArticleItems,
    },
    {
      id: "metric-drafts",
      kind: "analytics",
      title: "Drafts in flight",
      icon: BarChart3,
      size: "lg",
      metric: {
        value: String(draftCount + reviewCount),
        delta: { value: `${reviewCount} in review`, trend: "flat" },
        // Cosmetic series — section breakdown of where drafts are.
        sparkline: [3, 4, 4, 5, 5, 6, 6],
        caption: "Updated 2m ago",
      },
    },
    {
      id: "info-whos-online",
      kind: "info",
      title: "Who's online",
      icon: UserCheck,
      size: "wide",
      headerBadge: EDITORIAL_PRESENCE.length,
      items: whosOnlineItems,
    },
    {
      id: "info-top-stories",
      kind: "info",
      title: "Top stories this week",
      icon: Trophy,
      size: "wide",
      items: topStoryItems,
    },
    {
      id: "info-pending-comments",
      kind: "info",
      title: "Pending comments",
      icon: MessageSquare,
      size: "wide",
      headerBadge: draftCommentItems.length,
      items: draftCommentItems,
    },
    {
      id: "info-submissions",
      kind: "info",
      title: "Submissions",
      icon: PenSquare,
      size: "wide",
      headerBadge: submissionItems.length,
      items: submissionItems,
    },
    // The `STATUS_LABEL` import keeps the section vocabulary close to
    // an eventual editorial dataview, even though no widget renders
    // status badges directly today (sections are the more actionable
    // signal on the dashboard).
    {
      id: "info-status-legend",
      kind: "info",
      title: "Status legend",
      icon: FileText,
      size: "wide",
      items: (
        Object.entries(STATUS_LABEL) as Array<
          [keyof typeof STATUS_LABEL, string]
        >
      ).map(([status, label]) => ({
        id: `legend-${status}`,
        title: label,
        meta: `${ARTICLES.filter((a) => a.status === status).length} articles`,
        badge: { label, variant: STATUS_VARIANT[status] },
      })),
    },
    {
      id: "nav-classic",
      kind: "nav",
      size: "tall",
      items: [
        // Dock — the editorial team's most-used surfaces.
        {
          id: "n-posts",
          title: "Articles",
          icon: PenSquare,
          action: {
            type: "edit-page",
            params: { id: "posts" },
            title: "Articles",
          },
        },
        {
          id: "n-pages",
          title: "Pages",
          icon: FileText,
          action: { type: "pages" },
        },
        {
          id: "n-comments",
          title: "Comments",
          icon: MessageSquare,
          action: {
            type: "edit-page",
            params: { id: "comments" },
            title: "Comments",
          },
          badge: String(draftCommentItems.length),
        },
        {
          id: "n-users",
          title: "Team",
          icon: Users,
          action: {
            type: "edit-page",
            params: { id: "users" },
            title: "Team",
          },
        },
        {
          id: "n-media",
          title: "Media",
          icon: Image,
          action: {
            type: "edit-page",
            params: { id: "media" },
            title: "Media",
          },
        },

        // Dashboard launch tiles — fast access to a couple of
        // configuration surfaces a publication editor still touches
        // weekly.
        {
          id: "n-appearance",
          title: "Appearance",
          icon: Palette,
          action: { type: "editor", title: "Appearance" },
          defaultPlacement: "dashboard",
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
          defaultPlacement: "dashboard",
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
          defaultPlacement: "dashboard",
        },
        {
          id: "n-settings",
          title: "Settings",
          icon: Settings,
          action: { type: "settings" },
          defaultPlacement: "dashboard",
        },
      ],
    },
  ],
}
