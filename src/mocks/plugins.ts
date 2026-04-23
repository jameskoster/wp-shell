import {
  Activity,
  Calendar,
  ChartLine,
  Cloud,
  Compass,
  Layers,
  ListTodo,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from "lucide-react"

export type MockPlugin = {
  id: string
  name: string
  author: string
  description: string
  icon: LucideIcon
  category: "Analytics" | "Productivity" | "Communication" | "Security"
  installs: string
}

/**
 * Static catalog used by the mocked Plugin Repo dialog. Keeping this in
 * `src/mocks/` mirrors the pattern set by `src/mocks/notifications.ts`
 * — every demo dataset lives in one place.
 */
export const PLUGINS: MockPlugin[] = [
  {
    id: "pulse",
    name: "Pulse",
    author: "Automattic",
    description: "Live pulse of site engagement, with a single sparkline tile.",
    icon: Activity,
    category: "Analytics",
    installs: "2.1M",
  },
  {
    id: "audience-360",
    name: "Audience 360",
    author: "Hex Labs",
    description: "Visitor cohorts, paths, and funnels in a unified dashboard widget.",
    icon: ChartLine,
    category: "Analytics",
    installs: "428k",
  },
  {
    id: "trendline",
    name: "Trendline",
    author: "Sundial",
    description: "Long-range traffic trends with year-over-year comparisons.",
    icon: TrendingUp,
    category: "Analytics",
    installs: "186k",
  },
  {
    id: "editorial-board",
    name: "Editorial Board",
    author: "Newsroom Co.",
    description: "Pitches, drafts, and the production pipeline as a Kanban tile.",
    icon: Layers,
    category: "Productivity",
    installs: "92k",
  },
  {
    id: "task-deck",
    name: "Task Deck",
    author: "Anchor Studio",
    description: "Lightweight to-dos pinned to the dashboard with assignees.",
    icon: ListTodo,
    category: "Productivity",
    installs: "311k",
  },
  {
    id: "calendar-plus",
    name: "Calendar Plus",
    author: "Polaris",
    description: "Editorial calendar with publish slots and recurring schedules.",
    icon: Calendar,
    category: "Productivity",
    installs: "264k",
  },
  {
    id: "automate-this",
    name: "Automate This",
    author: "Loop",
    description: "Visual workflow rules — when X happens, do Y. Triggers as a tile.",
    icon: Workflow,
    category: "Productivity",
    installs: "73k",
  },
  {
    id: "inbox-zero",
    name: "Inbox Zero",
    author: "Field & Co.",
    description: "Unified inbox of comments, contact form replies, and DMs.",
    icon: Mail,
    category: "Communication",
    installs: "510k",
  },
  {
    id: "mod-queue",
    name: "Mod Queue",
    author: "Civic",
    description: "Comment moderation with per-user reputation, surfaced as a widget.",
    icon: MessageSquare,
    category: "Communication",
    installs: "118k",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    author: "Halo",
    description: "Live security signals — failed logins, file changes, threat score.",
    icon: ShieldCheck,
    category: "Security",
    installs: "640k",
  },
  {
    id: "stratus",
    name: "Stratus",
    author: "Northwind",
    description: "Cloud backup status and one-click restore from the dashboard.",
    icon: Cloud,
    category: "Security",
    installs: "289k",
  },
  {
    id: "discover-more",
    name: "Discover Pack",
    author: "Atlas",
    description: "Curated bundle of recommended widgets from the editorial team.",
    icon: Compass,
    category: "Productivity",
    installs: "44k",
  },
  {
    id: "spark",
    name: "Spark",
    author: "Brightline",
    description: "AI-suggested headlines and tags — accept inline from a widget.",
    icon: Sparkles,
    category: "Productivity",
    installs: "97k",
  },
]
