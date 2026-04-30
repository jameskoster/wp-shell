import {
  BookOpen,
  Eye,
  FileText,
  Image,
  LineChart,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  PenSquare,
  Plug,
  Settings,
  Wrench,
} from "lucide-react"
import { recentBlogPosts } from "@/mocks/blogPosts"
import type { InfoListItem, Recipe } from "@/widgets/types"

// Field Notes' "Recently" list, derived from the same mock the site
// preview's `BlogHomepage` reads. Both surfaces tell the same story
// so a viewer scanning the dashboard recognises the posts they just
// saw on the live site preview above.
const recentEssayItems: InfoListItem[] = recentBlogPosts(6).map((p) => ({
  id: p.id,
  title: p.title,
  meta: `${p.date} · ${p.readingMinutes} min read`,
  thumbnail: { kind: "image", seed: p.seed },
  action: {
    type: "editor",
    params: { kind: "post", id: p.id },
    // Carry the post's actual title so the opened editor's chrome
    // (tile, dock, recents) matches the row the user just clicked,
    // rather than the slug-derived fallback.
    title: p.title,
  },
}))

/**
 * Field Notes — the solo-blogger demo site. Built around the brief:
 *
 *   "Large site preview, traffic stats, and a few launch tiles —
 *    minimal."
 *
 * Density target: ~5–6 widgets on the dashboard at once (vs. the
 * admin recipe's ~22). Layout: a hero site preview (6×8) anchoring
 * the left half full-height, three traffic-stat widgets across the
 * top of the right column, three launch tiles in a row beneath them,
 * and a tall "Recently" list filling the rest of the right column.
 * Less-frequented destinations (Pages, Appearance, Plugins, Tools,
 * Settings) live in the dock.
 *
 * Declaration order matters: the placement seeder walks `widgets` in
 * order, expanding the nav widget's dashboard items inline at its
 * position — placing the launch tiles between the stats and the
 * Recently widget instead of at the bottom of the grid.
 */
export const bloggerRecipe: Recipe = {
  id: "blogger",
  role: "Solo blogger",
  widgets: [
    {
      // Hero — half-width, full-height. Spans 8 rows so its right
      // edge lines up with the bottom of the Recently widget for a
      // clean two-column composition.
      id: "site-preview",
      kind: "site-preview",
      title: "View site",
      icon: MonitorSmartphone,
      size: { w: 6, h: 8 },
      minSize: { w: 4, h: 3 },
      action: { type: "editor", title: "Appearance" },
      url: "fieldnotes.example/",
    },
    {
      id: "metric-views",
      kind: "analytics",
      title: "Site views",
      icon: Eye,
      size: "lg",
      metric: {
        value: "4,820",
        delta: { value: "+12.6%", trend: "up" },
        sparkline: [410, 460, 520, 580, 640, 720, 780],
        caption: "Last 7 days",
      },
    },
    {
      id: "metric-visitors",
      kind: "analytics",
      title: "Visitors",
      icon: LineChart,
      size: "lg",
      metric: {
        value: "1,640",
        delta: { value: "+8.2%", trend: "up" },
        sparkline: [180, 196, 214, 226, 238, 252, 268],
        caption: "Last 7 days",
      },
    },
    {
      id: "metric-subscribers",
      kind: "analytics",
      title: "Subscribers",
      icon: Mail,
      size: "lg",
      metric: {
        value: "612",
        delta: { value: "+14", trend: "up" },
        sparkline: [580, 586, 590, 595, 601, 607, 612],
        caption: "Last 7 days",
      },
    },
    {
      // Nav sits *between* the stats and the Recently widget so the
      // dashboard launch tiles seed onto the row below the stats
      // rather than at the bottom of the grid (per seedFromRecipe's
      // declaration-order walk). Dock items come first inside the
      // array purely for the dock's intended order; their
      // `defaultPlacement` is what actually decides surface.
      id: "nav-classic",
      kind: "nav",
      size: "tall",
      items: [
        // Dock — reachable in one click but not worth a permanent
        // dashboard tile for a solo blogger.
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

        // Dashboard launch tiles — the three destinations a writer
        // reaches for several times a session. Order is the visible
        // order in the row beneath the stats: Posts, Media, Comments.
        {
          id: "n-posts",
          title: "Posts",
          icon: PenSquare,
          action: {
            type: "edit-page",
            params: { id: "posts" },
            title: "Posts",
          },
          defaultPlacement: "dashboard",
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
          defaultPlacement: "dashboard",
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
          badge: "3",
          defaultPlacement: "dashboard",
        },
      ],
    },
    {
      // Tall list filling the rest of the right column. Sized so its
      // bottom edge meets the bottom of the site preview at row 8.
      id: "info-recent-posts",
      kind: "info",
      title: "Recently",
      icon: BookOpen,
      size: { w: 6, h: 5 },
      items: recentEssayItems,
    },
  ],
}
