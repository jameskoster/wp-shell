import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  DatabaseBackup,
  DollarSign,
  Eye,
  FileText,
  Globe,
  HeartPulse,
  History,
  Image,
  LineChart,
  Mail,
  Megaphone,
  MessageSquare,
  MonitorSmartphone,
  Newspaper,
  Package,
  Palette,
  PenLine,
  PenSquare,
  Plug,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react"
import {
  ORDERS,
  ordersNeedingAction,
  STATUS_LABEL,
  STATUS_VARIANT,
} from "@/mocks/orders"
import { PAGES } from "@/mocks/pages"
import { renderBackups } from "@/widgets/BackupStatus"
import { renderQuickDraft } from "@/widgets/QuickDraftForm"
import { renderSiteHealth } from "@/widgets/SiteHealthMeter"
import type { InfoListItem, Recipe } from "@/widgets/types"

// Hand-picked from the PAGES mock to mix recent drafts and published
// edits — "Jump back in" prioritises pages the author is actively working
// on, with the most-recent first. Deriving the rendered items from PAGES
// keeps title / status / modified in sync with the rest of the prototype.
//
// Each entry optionally carries a `seed` for the featured image; pages
// without one fall back to the FileText icon thumbnail so the widget
// shows both the populated state and the no-image-yet state.
const RECENT_PAGES: Array<{ id: string; seed?: string }> = [
  { id: "spring-collection", seed: "spring-collection-lookbook" },
  { id: "home", seed: "homepage-hero" },
  { id: "studio-update" },
  { id: "about", seed: "studio-spring" },
  { id: "shop", seed: "shop-hero" },
  { id: "april-look", seed: "april-look-book" },
  { id: "ceramics-restock" },
  { id: "contact", seed: "contact-page" },
]

// Mirror the orders workspace: derive the Recent orders widget straight
// from the ORDERS mock so each row links to a real order in the
// workspace (rather than drifting from invented #1284-style numbers).
// Each row carries its status badge so triage from the dashboard
// matches the dataview's vocabulary (`STATUS_VARIANT` is the single
// source of truth for tone).
const recentOrderItems: InfoListItem[] = ORDERS.slice(0, 10).map((order) => ({
  id: order.id,
  title: `${order.number} — ${order.customer}`,
  meta: `${order.total} · ${order.date}`,
  thumbnail: { kind: "avatar", name: order.customer },
  badge: {
    label: STATUS_LABEL[order.status],
    variant: STATUS_VARIANT[order.status],
  },
  action: {
    type: "orders",
    params: { view: "all", id: order.id },
  },
}))

// Count of orders that need merchant attention (processing / on hold /
// failed). Surfaced as the widget's header notification badge so the
// dashboard reads the same urgency the orders workspace does.
const ordersActionCount = ordersNeedingAction().length

const jumpBackInItems: InfoListItem[] = RECENT_PAGES.flatMap(({ id, seed }) => {
  const page = PAGES.find((p) => p.id === id)
  if (!page) return []
  // Drafts surface their status so the user can tell at a glance which
  // entries are still in-progress; published edits just show the relative
  // time to keep the row scannable.
  const meta =
    page.status === "draft" ? `Draft · ${page.modified}` : page.modified
  return [
    {
      id: page.id,
      title: page.title,
      meta,
      thumbnail: seed
        ? { kind: "image", seed }
        : { kind: "icon", icon: FileText },
      action: {
        type: "editor",
        params: { kind: "page", id: page.id },
      },
    },
  ]
})

export const adminRecipe: Recipe = {
  id: "admin",
  role: "Solo store owner",
  widgets: [
    {
      // Live preview of the storefront homepage, anchoring the
      // dashboard. Renders the same `Canvas` the editor renders (with
      // `doc.isFrontPage` → eCommerce homepage layout), scaled to fit
      // the cell. Authored with an explicit footprint (`{ w: 6, h: 4 }`)
      // because none of the named WidgetSize presets are large enough
      // for a legible site preview, and a `minSize` floor so the
      // thumbnail never collapses below readable.
      id: "site-preview",
      kind: "site-preview",
      title: "View site",
      icon: MonitorSmartphone,
      size: { w: 6, h: 4 },
      minSize: { w: 3, h: 2 },
      action: { type: "editor", title: "Appearance" },
      url: "studiopark.example/",
    },
    {
      id: "metric-revenue",
      kind: "analytics",
      title: "Revenue this week",
      icon: DollarSign,
      size: "lg",
      metric: {
        value: "$8,420",
        delta: { value: "+12.4%", trend: "up" },
        sparkline: [620, 740, 690, 880, 940, 1120, 1260],
        caption: "vs. last week",
      },
    },
    {
      id: "metric-orders",
      kind: "analytics",
      title: "Orders this week",
      icon: ShoppingBag,
      size: "lg",
      metric: {
        value: "184",
        delta: { value: "+8", trend: "up" },
        sparkline: [22, 19, 24, 27, 31, 28, 33],
        caption: "vs. last week",
      },
    },
    {
      id: "metric-conversion",
      kind: "analytics",
      title: "Conversion rate",
      icon: TrendingUp,
      size: "lg",
      metric: {
        value: "2.4%",
        delta: { value: "-0.2%", trend: "down" },
        sparkline: [2.7, 2.8, 2.6, 2.5, 2.4, 2.5, 2.4],
        caption: "vs. last week",
      },
    },
    {
      id: "info-recent-orders",
      kind: "info",
      title: "Recent orders",
      icon: ShoppingBag,
      size: "hero",
      headerBadge: ordersActionCount,
      items: recentOrderItems,
    },
    {
      id: "info-low-stock",
      kind: "info",
      title: "Low stock",
      icon: AlertTriangle,
      size: "wide",
      items: [
        {
          id: "s1",
          title: "Linen tote — natural",
          meta: "3 left",
          thumbnail: { kind: "image", seed: "linen-tote-natural" },
        },
        {
          id: "s2",
          title: "Brass lamp — small",
          meta: "2 left",
          thumbnail: { kind: "image", seed: "brass-lamp-small" },
        },
        {
          id: "s3",
          title: "Ceramic mug — sage",
          meta: "5 left",
          thumbnail: { kind: "image", seed: "ceramic-mug-sage" },
        },
        {
          id: "s4",
          title: "Wool throw — charcoal",
          meta: "Out of stock",
          thumbnail: { kind: "image", seed: "wool-throw-charcoal" },
        },
        {
          id: "s5",
          title: "Cotton scarf — sand",
          meta: "4 left",
          thumbnail: { kind: "image", seed: "cotton-scarf-sand" },
        },
        {
          id: "s6",
          title: "Reed diffuser — fig",
          meta: "1 left",
          thumbnail: { kind: "image", seed: "reed-diffuser-fig" },
        },
        {
          id: "s7",
          title: "Beeswax candle — amber",
          meta: "6 left",
          thumbnail: { kind: "image", seed: "beeswax-candle-amber" },
        },
        {
          id: "s8",
          title: "Walnut tray — large",
          meta: "Out of stock",
          thumbnail: { kind: "image", seed: "walnut-tray-large" },
        },
      ],
    },
    {
      id: "info-abandoned-carts",
      kind: "info",
      title: "Abandoned carts",
      icon: ShoppingCart,
      size: "lg",
      items: [
        {
          id: "ac1",
          title: "Hannah Wexler",
          meta: "$148.50 · 12m ago",
          thumbnail: { kind: "avatar", name: "Hannah Wexler" },
          action: { type: "orders" },
        },
        {
          id: "ac2",
          title: "Theo Bennett",
          meta: "$76.00 · 38m ago",
          thumbnail: { kind: "avatar", name: "Theo Bennett" },
          action: { type: "orders" },
        },
        {
          id: "ac3",
          title: "Maya Lin",
          meta: "$210.00 · 1h ago",
          thumbnail: { kind: "avatar", name: "Maya Lin" },
          action: { type: "orders" },
        },
        {
          id: "ac4",
          title: "Ben Mosesowitz",
          meta: "$54.00 · 3h ago",
          thumbnail: { kind: "avatar", name: "Ben Mosesowitz" },
          action: { type: "orders" },
        },
        {
          id: "ac5",
          title: "Iris Caldwell",
          meta: "$92.00 · 5h ago",
          thumbnail: { kind: "avatar", name: "Iris Caldwell" },
          action: { type: "orders" },
        },
      ],
    },
    {
      id: "info-best-sellers",
      kind: "info",
      title: "Best sellers",
      icon: Trophy,
      size: "wide",
      items: [
        {
          id: "bs1",
          title: "Linen tote — natural",
          meta: "84 sold · $2,520 this week",
          thumbnail: { kind: "image", seed: "linen-tote-natural" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs2",
          title: "Ceramic mug — sage",
          meta: "62 sold · $1,240 this week",
          thumbnail: { kind: "image", seed: "ceramic-mug-sage" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs3",
          title: "Brass lamp — small",
          meta: "48 sold · $1,920 this week",
          thumbnail: { kind: "image", seed: "brass-lamp-small" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs4",
          title: "Beeswax candle — amber",
          meta: "44 sold · $660 this week",
          thumbnail: { kind: "image", seed: "beeswax-candle-amber" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs5",
          title: "Wool throw — charcoal",
          meta: "31 sold · $1,860 this week",
          thumbnail: { kind: "image", seed: "wool-throw-charcoal" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs6",
          title: "Cotton scarf — sand",
          meta: "27 sold · $810 this week",
          thumbnail: { kind: "image", seed: "cotton-scarf-sand" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs7",
          title: "Reed diffuser — fig",
          meta: "22 sold · $440 this week",
          thumbnail: { kind: "image", seed: "reed-diffuser-fig" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "bs8",
          title: "Walnut tray — large",
          meta: "18 sold · $1,080 this week",
          thumbnail: { kind: "image", seed: "walnut-tray-large" },
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
      ],
    },
    {
      id: "info-reviews",
      kind: "info",
      title: "New reviews",
      icon: Star,
      size: "wide",
      items: [
        {
          id: "r1",
          title: "★★★★★ Linen tote",
          meta: "“Beautiful quality.” — Sarah K.",
          thumbnail: { kind: "image", seed: "linen-tote-natural" },
        },
        {
          id: "r2",
          title: "★★★★☆ Brass lamp",
          meta: "“Sturdier than I expected.” — Marco D.",
          thumbnail: { kind: "image", seed: "brass-lamp-small" },
        },
        {
          id: "r3",
          title: "★★★★★ Ceramic mug",
          meta: "“Bought four.” — Anya P.",
          thumbnail: { kind: "image", seed: "ceramic-mug-sage" },
        },
        {
          id: "r4",
          title: "★★★★☆ Wool throw",
          meta: "“Cosy and well made.” — Lee H.",
          thumbnail: { kind: "image", seed: "wool-throw-charcoal" },
        },
        {
          id: "r5",
          title: "★★★★★ Cotton scarf",
          meta: "“Soft and warm.” — Jess M.",
          thumbnail: { kind: "image", seed: "cotton-scarf-sand" },
        },
        {
          id: "r6",
          title: "★★★☆☆ Reed diffuser",
          meta: "“Pleasant but faint.” — Tomás R.",
          thumbnail: { kind: "image", seed: "reed-diffuser-fig" },
        },
        {
          id: "r7",
          title: "★★★★★ Beeswax candle",
          meta: "“Burns clean for hours.” — Priya N.",
          thumbnail: { kind: "image", seed: "beeswax-candle-amber" },
        },
        {
          id: "r8",
          title: "★★★★★ Walnut tray",
          meta: "“The grain is gorgeous.” — Connor B.",
          thumbnail: { kind: "image", seed: "walnut-tray-large" },
        },
      ],
    },
    {
      id: "info-pending-comments",
      kind: "info",
      title: "Pending comments",
      icon: MessageSquare,
      size: "lg",
      items: [
        {
          id: "pc1",
          title: "Sarah K. on “Spring collection lookbook”",
          meta: "“Will the linen tote be back in cream?”",
          thumbnail: { kind: "avatar", name: "Sarah Kim" },
          action: {
            type: "edit-page",
            params: { id: "comments" },
            title: "Comments",
          },
        },
        {
          id: "pc2",
          title: "Marco D. on “How we source linen”",
          meta: "“Curious about your cotton suppliers — any blog post?”",
          thumbnail: { kind: "avatar", name: "Marco Davila" },
          action: {
            type: "edit-page",
            params: { id: "comments" },
            title: "Comments",
          },
        },
        {
          id: "pc3",
          title: "Anya P. on “Spring collection lookbook”",
          meta: "“Just ordered the brass lamp — can't wait!”",
          thumbnail: { kind: "avatar", name: "Anya Petrov" },
          action: {
            type: "edit-page",
            params: { id: "comments" },
            title: "Comments",
          },
        },
      ],
    },
    {
      id: "info-jump-back-in",
      kind: "info",
      title: "Jump back in",
      icon: History,
      size: "wide",
      items: jumpBackInItems,
    },
    {
      id: "info-quick-draft",
      kind: "info",
      title: "Quick draft",
      icon: PenLine,
      size: "lg",
      render: renderQuickDraft,
    },
    {
      id: "info-site-health",
      kind: "info",
      title: "Site Health",
      icon: HeartPulse,
      size: "lg",
      render: renderSiteHealth,
    },
    {
      id: "info-backups",
      kind: "info",
      title: "Backups",
      icon: DatabaseBackup,
      size: "lg",
      render: renderBackups,
    },
    {
      id: "info-yoast-seo",
      kind: "info",
      title: "Yoast SEO Posts Overview",
      icon: Search,
      size: "wide",
      items: [
        { id: "y1", title: "Posts with a good SEO score", meta: "24" },
        { id: "y2", title: "Posts that need improvement", meta: "9" },
        { id: "y3", title: "Posts with problems", meta: "3" },
        { id: "y4", title: "Posts without a focus keyphrase", meta: "5" },
      ],
    },
    {
      id: "metric-subscribers",
      kind: "analytics",
      title: "Subscribers",
      icon: Mail,
      size: "lg",
      metric: {
        value: "1,284",
        delta: { value: "+18", trend: "up" },
        sparkline: [1166, 1182, 1198, 1224, 1248, 1266, 1284],
        caption: "Last 7 days",
      },
    },
    {
      id: "metric-jetpack-views",
      kind: "analytics",
      title: "Site views",
      icon: Eye,
      size: "lg",
      metric: {
        value: "12,840",
        delta: { value: "+18.2%", trend: "up" },
        sparkline: [820, 1040, 980, 1320, 1420, 1610, 1820],
        caption: "Last 7 days",
      },
    },
    {
      id: "metric-jetpack-visitors",
      kind: "analytics",
      title: "Visitors",
      icon: LineChart,
      size: "lg",
      metric: {
        value: "4,210",
        delta: { value: "+6.4%", trend: "up" },
        sparkline: [340, 380, 360, 410, 430, 460, 510],
        caption: "Last 7 days",
      },
    },
    {
      id: "info-jetpack-top-content",
      kind: "info",
      title: "Top posts & pages",
      icon: BarChart3,
      size: "wide",
      items: [
        {
          id: "t1",
          title: "Spring collection lookbook",
          meta: "1,284 views",
          thumbnail: { kind: "image", seed: "spring-collection-lookbook" },
        },
        {
          id: "t2",
          title: "Brass lamp — small",
          meta: "962 views",
          thumbnail: { kind: "image", seed: "brass-lamp-small" },
        },
        {
          id: "t3",
          title: "How we source linen",
          meta: "748 views",
          thumbnail: { kind: "image", seed: "how-we-source-linen" },
        },
        {
          id: "t4",
          title: "Homepage",
          meta: "612 views",
          thumbnail: { kind: "image", seed: "homepage-hero" },
        },
        {
          id: "t5",
          title: "Linen tote — natural",
          meta: "508 views",
          thumbnail: { kind: "image", seed: "linen-tote-natural" },
        },
        {
          id: "t6",
          title: "Care guide: linen and wool",
          meta: "421 views",
          thumbnail: { kind: "image", seed: "linen-wool-care" },
        },
        {
          id: "t7",
          title: "Why we switched to organic dyes",
          meta: "362 views",
          thumbnail: { kind: "image", seed: "organic-dyes" },
        },
        {
          id: "t8",
          title: "About the studio",
          meta: "298 views",
          thumbnail: { kind: "image", seed: "studio-spring" },
        },
        {
          id: "t9",
          title: "Ceramic mug — sage",
          meta: "246 views",
          thumbnail: { kind: "image", seed: "ceramic-mug-sage" },
        },
        {
          id: "t10",
          title: "Beeswax candle — amber",
          meta: "204 views",
          thumbnail: { kind: "image", seed: "beeswax-candle-amber" },
        },
      ],
    },
    {
      id: "info-jetpack-referrers",
      kind: "info",
      title: "Top referrers",
      icon: Newspaper,
      size: "lg",
      items: [
        {
          id: "ref1",
          title: "Search engines",
          meta: "2,140",
          thumbnail: { kind: "icon", icon: Search },
        },
        {
          id: "ref2",
          title: "instagram.com",
          meta: "684",
          thumbnail: { kind: "site", domain: "instagram.com" },
        },
        {
          id: "ref3",
          title: "wordpress.com reader",
          meta: "412",
          thumbnail: { kind: "site", domain: "wordpress.com" },
        },
        {
          id: "ref4",
          title: "Direct",
          meta: "388",
          thumbnail: { kind: "icon", icon: Globe },
        },
        {
          id: "ref5",
          title: "pinterest.com",
          meta: "264",
          thumbnail: { kind: "site", domain: "pinterest.com" },
        },
        {
          id: "ref6",
          title: "news.ycombinator.com",
          meta: "182",
          thumbnail: { kind: "site", domain: "news.ycombinator.com" },
        },
        {
          id: "ref7",
          title: "reddit.com",
          meta: "146",
          thumbnail: { kind: "site", domain: "reddit.com" },
        },
        {
          id: "ref8",
          title: "Email newsletter",
          meta: "118",
          thumbnail: { kind: "icon", icon: MessageSquare },
        },
      ],
    },
    {
      id: "info-activity",
      kind: "info",
      title: "Recent activity",
      icon: Activity,
      size: "wide",
      items: [
        {
          id: "a1",
          title: "Published “Spring collection”",
          meta: "12m ago",
          thumbnail: { kind: "icon", icon: PenSquare },
        },
        {
          id: "a2",
          title: "Refunded order #1278",
          meta: "1h ago",
          thumbnail: { kind: "icon", icon: ShoppingBag },
        },
        {
          id: "a3",
          title: "Plugin update: Yoast SEO 22.4",
          meta: "2h ago",
          thumbnail: { kind: "icon", icon: Plug },
        },
        {
          id: "a4",
          title: "Updated homepage hero",
          meta: "Yesterday",
          thumbnail: { kind: "icon", icon: Image },
        },
        {
          id: "a5",
          title: "Approved 3 new reviews",
          meta: "Yesterday",
          thumbnail: { kind: "icon", icon: Star },
        },
        {
          id: "a6",
          title: "Replied to comment on “Sourcing linen”",
          meta: "2d ago",
          thumbnail: { kind: "icon", icon: MessageSquare },
        },
        {
          id: "a7",
          title: "Restocked Brass lamp — small",
          meta: "2d ago",
          thumbnail: { kind: "icon", icon: Package },
        },
        {
          id: "a8",
          title: "Added Marketing campaign “Mother's Day”",
          meta: "3d ago",
          thumbnail: { kind: "icon", icon: Megaphone },
        },
        {
          id: "a9",
          title: "Updated theme to Twenty Twenty-Six",
          meta: "4d ago",
          thumbnail: { kind: "icon", icon: Palette },
        },
        {
          id: "a10",
          title: "Invited new user: priya@store.example",
          meta: "5d ago",
          thumbnail: { kind: "icon", icon: Users },
        },
      ],
    },
    {
      id: "info-wp-events",
      kind: "info",
      title: "WordPress Events and News",
      icon: CalendarDays,
      size: "wide",
      items: [
        {
          id: "e1",
          title: "WordCamp Europe 2026 — Basel",
          meta: "Jun 4–6 · In person",
          thumbnail: { kind: "icon", icon: CalendarDays },
        },
        {
          id: "e2",
          title: "Bristol WordPress Meetup",
          meta: "Thu, May 7 · 18:30 BST",
          thumbnail: { kind: "icon", icon: CalendarDays },
        },
        {
          id: "e3",
          title: "WordPress Accessibility Day 2026",
          meta: "Oct 14–15 · Online",
          thumbnail: { kind: "icon", icon: CalendarDays },
        },
        {
          id: "e4",
          title: "WordPress 6.9 Release Candidate 1",
          meta: "WordPress.org News · 1d ago",
          thumbnail: { kind: "site", domain: "wordpress.org" },
        },
        {
          id: "e5",
          title: "People of WordPress: Maya Lin",
          meta: "WP Tavern · 3d ago",
          thumbnail: { kind: "site", domain: "wptavern.com" },
        },
        {
          id: "e6",
          title: "What's new in the Site Editor",
          meta: "Make WordPress Core · 4d ago",
          thumbnail: { kind: "site", domain: "make.wordpress.org" },
        },
        {
          id: "e7",
          title: "Block Themes hit 60% adoption",
          meta: "WP Tavern · 1w ago",
          thumbnail: { kind: "site", domain: "wptavern.com" },
        },
        {
          id: "e8",
          title: "Roadmap: Phase 3 Collaboration",
          meta: "WordPress.org News · 2w ago",
          thumbnail: { kind: "site", domain: "wordpress.org" },
        },
      ],
    },
    {
      id: "nav-classic",
      kind: "nav",
      size: "tall",
      items: [
        // Dock — prominent commerce contexts the solo owner switches
        // into multiple times a day.
        {
          id: "n-pages",
          title: "Pages",
          icon: FileText,
          action: { type: "pages" },
        },
        {
          id: "n-products",
          title: "Products",
          icon: Package,
          action: {
            type: "edit-page",
            params: { id: "products" },
            title: "Products",
          },
        },
        {
          id: "n-orders",
          title: "Orders",
          icon: ShoppingBag,
          action: { type: "orders" },
          // Same source of truth as the Recent orders widget header
          // badge — both surfaces report orders that need merchant
          // attention, so they should always agree.
          badge: ordersActionCount > 0 ? String(ordersActionCount) : undefined,
        },
        {
          id: "n-product-reviews",
          title: "Product reviews",
          icon: Star,
          action: { type: "product-reviews" },
          badge: "8",
        },
        {
          id: "n-marketing",
          title: "Marketing",
          icon: Megaphone,
          action: { type: "marketing" },
        },
        {
          id: "n-analytics",
          title: "Analytics",
          icon: BarChart3,
          action: { type: "analytics" },
        },
        {
          id: "n-settings",
          title: "Settings",
          icon: Settings,
          action: { type: "settings" },
        },

        // Dashboard launch tiles — less-prominent admin destinations.
        // Reachable in one click but not worth permanent dock real estate.
        {
          id: "n-posts",
          title: "Posts",
          icon: PenSquare,
          action: { type: "edit-page", params: { id: "posts" }, title: "Posts" },
          defaultPlacement: "dashboard",
        },
        {
          id: "n-media",
          title: "Media",
          icon: Image,
          action: { type: "edit-page", params: { id: "media" }, title: "Media" },
          defaultPlacement: "dashboard",
        },
        {
          id: "n-comments",
          title: "Comments",
          icon: MessageSquare,
          action: { type: "edit-page", params: { id: "comments" }, title: "Comments" },
          badge: "3",
          defaultPlacement: "dashboard",
        },
        {
          id: "n-users",
          title: "Users",
          icon: Users,
          action: { type: "edit-page", params: { id: "users" }, title: "Users" },
          defaultPlacement: "dashboard",
        },
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
          action: { type: "edit-page", params: { id: "plugins" }, title: "Plugins" },
          badge: "2",
          defaultPlacement: "dashboard",
        },
        {
          id: "n-tools",
          title: "Tools",
          icon: Wrench,
          action: { type: "edit-page", params: { id: "tools" }, title: "Tools" },
          defaultPlacement: "dashboard",
        },
      ],
    },
  ],
}
