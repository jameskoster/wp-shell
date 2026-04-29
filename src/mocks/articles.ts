/**
 * Mock articles for The Bristol Review — a quarterly cultural
 * publication with a small editorial team. Reused by the publication
 * homepage preview, the dashboard's editorial-calendar / pending-
 * review / top-stories widgets, and the editorial presence mock so
 * every surface tells the same story.
 */

export type ArticleStatus =
  | "published"
  | "scheduled"
  | "in-review"
  | "draft"

export type ArticleSection =
  | "News"
  | "Culture"
  | "Reviews"
  | "Long reads"
  | "Interviews"

export type Article = {
  id: string
  title: string
  slug: string
  /** Single-sentence deck shown beneath the title in lists / hero. */
  deck: string
  author: string
  section: ArticleSection
  status: ArticleStatus
  /**
   * Display string for date. Meaning depends on `status`:
   *  - published → "Published Apr 24"
   *  - scheduled → "Scheduled Apr 30"
   *  - in-review / draft → relative modified time
   */
  date: string
  /** Picsum seed for the hero / list thumbnail. */
  seed: string
  readingMinutes: number
  /** Marks the lead story for the publication homepage. */
  isLead?: boolean
  /** Optional view count for "Top stories" — only on published rows. */
  views?: number
}

export const ARTICLES: Article[] = [
  {
    id: "harbourside-revival",
    title: "The harbourside is being remade — again",
    slug: "/harbourside-revival",
    deck:
      "Three new builds break ground this summer. Locals are asking who, exactly, the redevelopment is for.",
    author: "Iris Caldwell",
    section: "Long reads",
    status: "published",
    date: "Published Apr 24",
    seed: "br-harbourside",
    readingMinutes: 18,
    isLead: true,
    views: 4820,
  },
  {
    id: "wessex-water-interview",
    title: "“We knew, and we didn't act.”",
    slug: "/wessex-water-interview",
    deck:
      "A retired hydrologist on twenty years of internal warnings about the Avon — and the meetings where they were dismissed.",
    author: "Theo Bennett",
    section: "Interviews",
    status: "published",
    date: "Published Apr 21",
    seed: "br-interview-water",
    readingMinutes: 22,
    views: 3140,
  },
  {
    id: "spike-island-show",
    title: "At Spike Island, sculpture finds its weight",
    slug: "/spike-island-show",
    deck:
      "The spring exhibition is the gallery's most physical in years — and quietly its most political.",
    author: "Hannah Wexler",
    section: "Reviews",
    status: "published",
    date: "Published Apr 18",
    seed: "br-spike-island",
    readingMinutes: 7,
    views: 1820,
  },
  {
    id: "bedminster-nightline",
    title: "The volunteers keeping the Bedminster nightline open",
    slug: "/bedminster-nightline",
    deck:
      "Funding ended in 2023. The phones still ring. We spent a week with the people answering them.",
    author: "Maya Lin",
    section: "Long reads",
    status: "published",
    date: "Published Apr 14",
    seed: "br-nightline",
    readingMinutes: 24,
    views: 2640,
  },
  {
    id: "council-budget",
    title: "Council passes £4m cuts in late-night session",
    slug: "/council-budget",
    deck:
      "Libraries and after-school provision absorb the bulk of the reductions. The mayor cited “regrettable necessity.”",
    author: "Ben Mosesowitz",
    section: "News",
    status: "published",
    date: "Published Apr 11",
    seed: "br-council",
    readingMinutes: 6,
    views: 1480,
  },
  {
    id: "stokes-croft-music",
    title: "Stokes Croft after the venues",
    slug: "/stokes-croft-music",
    deck:
      "Three closures in eighteen months. What the city loses when the small rooms go dark.",
    author: "Connor Bell",
    section: "Culture",
    status: "published",
    date: "Published Apr 7",
    seed: "br-stokes-croft",
    readingMinutes: 12,
    views: 1280,
  },
  {
    id: "summer-issue-edit",
    title: "Editor's letter — Summer issue",
    slug: "/summer-issue-edit",
    deck:
      "On three months of reporting, what we got right, and what we'd do differently.",
    author: "Iris Caldwell",
    section: "News",
    status: "scheduled",
    date: "Scheduled May 2",
    seed: "br-editors-letter",
    readingMinutes: 4,
  },
  {
    id: "summer-cover-story",
    title: "The river, twenty years on",
    slug: "/summer-cover-story",
    deck:
      "Our summer cover follows the Avon from source to mouth, and the people who live by its turning health.",
    author: "Theo Bennett",
    section: "Long reads",
    status: "scheduled",
    date: "Scheduled May 5",
    seed: "br-river",
    readingMinutes: 28,
  },
  {
    id: "festival-preview",
    title: "What to see at the festival",
    slug: "/festival-preview",
    deck:
      "Our critics' picks across music, theatre, and the rare reading worth the queue.",
    author: "Hannah Wexler",
    section: "Culture",
    status: "scheduled",
    date: "Scheduled May 8",
    seed: "br-festival",
    readingMinutes: 9,
  },
  {
    id: "council-followup",
    title: "After the cuts — a follow-up",
    slug: "/council-followup",
    deck:
      "Three weeks on, what the £4m of reductions look like inside the libraries and after-school clubs.",
    author: "Ben Mosesowitz",
    section: "News",
    status: "scheduled",
    date: "Scheduled May 12",
    seed: "br-council-followup",
    readingMinutes: 8,
  },
  {
    id: "tyntesfield-review",
    title: "Tyntesfield restored — a review",
    slug: "/tyntesfield-review",
    deck:
      "Five years and £18m later, the National Trust reopens the gardens. They land somewhere short of triumphant.",
    author: "Hannah Wexler",
    section: "Reviews",
    status: "scheduled",
    date: "Scheduled May 16",
    seed: "br-tyntesfield",
    readingMinutes: 11,
  },
  {
    id: "harbour-pilot-profile",
    title: "An afternoon with the harbour pilot",
    slug: "/harbour-pilot-profile",
    deck:
      "Twenty-two years guiding container ships through the Severn — and what she sees changing.",
    author: "Iris Caldwell",
    section: "Interviews",
    status: "scheduled",
    date: "Scheduled May 22",
    seed: "br-pilot",
    readingMinutes: 16,
  },
  {
    id: "summer-issue-launch",
    title: "Summer issue — launch event",
    slug: "/summer-issue-launch",
    deck:
      "Drinks, readings from three contributors, and the first print copies of the issue.",
    author: "Iris Caldwell",
    section: "News",
    status: "scheduled",
    date: "Scheduled May 28",
    seed: "br-launch-event",
    readingMinutes: 3,
  },
  {
    id: "housing-investigation",
    title: "Inside the city's longest-running housing fight",
    slug: "/housing-investigation",
    deck:
      "Six months of records, twenty-two interviews. A pattern the council has refused to name.",
    author: "Maya Lin",
    section: "Long reads",
    status: "in-review",
    date: "Modified 18m ago",
    seed: "br-housing",
    readingMinutes: 31,
  },
  {
    id: "nhs-walk-in-piece",
    title: "What happens when the walk-in closes at six",
    slug: "/nhs-walk-in-piece",
    deck:
      "A&E waits, shifted timetables, and the patients who fall through both. From three Bristol postcodes.",
    author: "Ben Mosesowitz",
    section: "News",
    status: "in-review",
    date: "Modified 2h ago",
    seed: "br-nhs",
    readingMinutes: 14,
  },
  {
    id: "art-school-profile",
    title: "Two years inside the new Bristol art school",
    slug: "/art-school-profile",
    deck:
      "A profile of the institution that is — for better and worse — reshaping the city's creative pipeline.",
    author: "Connor Bell",
    section: "Culture",
    status: "draft",
    date: "Modified yesterday",
    seed: "br-art-school",
    readingMinutes: 19,
  },
]

export const SECTION_VARIANT: Record<
  ArticleSection,
  | "info"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
> = {
  News: "info",
  Culture: "secondary",
  Reviews: "outline",
  "Long reads": "warning",
  Interviews: "success",
}

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  published: "Published",
  scheduled: "Scheduled",
  "in-review": "In review",
  draft: "Draft",
}

export const STATUS_VARIANT: Record<
  ArticleStatus,
  "info" | "secondary" | "outline" | "success" | "warning"
> = {
  published: "success",
  scheduled: "info",
  "in-review": "warning",
  draft: "outline",
}

export function getArticle(id: string | undefined): Article | undefined {
  if (!id) return undefined
  return ARTICLES.find((a) => a.id === id)
}

/** Lead story for the publication homepage. */
export function leadArticle(): Article {
  return ARTICLES.find((a) => a.isLead) ?? ARTICLES[0]!
}

/** Most-recent published articles excluding the lead. */
export function recentArticles(limit = 6): Article[] {
  return ARTICLES.filter((a) => a.status === "published" && !a.isLead).slice(
    0,
    limit,
  )
}

/** Articles awaiting editor review, freshest first. */
export function articlesInReview(): Article[] {
  return ARTICLES.filter((a) => a.status === "in-review")
}

/** Scheduled articles, soonest first. */
export function scheduledArticles(): Article[] {
  return ARTICLES.filter((a) => a.status === "scheduled")
}

/** Top published articles by view count, descending. */
export function topArticles(limit = 6): Article[] {
  return [...ARTICLES]
    .filter((a) => a.status === "published" && typeof a.views === "number")
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, limit)
}

/**
 * The day-of-month an article is scheduled to publish, parsed from
 * the cosmetic `date` string ("Scheduled May 12" → 12). Returns
 * `null` for non-scheduled articles or unparseable dates. Used by the
 * editorial calendar widget to drop article chips on the right cell.
 *
 * Months are pinned to the prototype's "current" month (May 2026) —
 * see `EditorialCalendar` for the calendar grid that reads from this.
 */
export function scheduledDay(article: Article): number | null {
  if (article.status !== "scheduled") return null
  const match = /\b(\d{1,2})\b/.exec(article.date)
  if (!match) return null
  const day = Number(match[1])
  if (!Number.isFinite(day) || day < 1 || day > 31) return null
  return day
}
