/**
 * Mock essays / posts for Field Notes — the solo-blogger demo site.
 *
 * Kept intentionally small (~8 entries) and personal in voice so the
 * blog homepage preview reads as "an individual writer's site"
 * rather than "a publication". Reused by the dashboard's Recent
 * posts widget so the homepage and the dashboard tell the same
 * story.
 */

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  date: string
  /** Picsum seed for the thumbnail / hero image. */
  seed: string
  status: "published" | "draft"
  /** Reading time in minutes — surfaced in some recipe widgets. */
  readingMinutes: number
  isFeatured?: boolean
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "morning-pages",
    title: "On keeping morning pages for a year",
    slug: "/morning-pages",
    excerpt:
      "Twelve months in, I have a stack of notebooks I'll never reread — and a quieter mind for it. Some notes on the practice and what I'd change.",
    date: "Apr 24, 2026",
    seed: "fieldnotes-morning-pages",
    status: "published",
    readingMinutes: 7,
    isFeatured: true,
  },
  {
    id: "small-walks",
    title: "The case for the small walk",
    slug: "/small-walks",
    excerpt:
      "Twenty minutes, no phone, the same loop most days. It is — to my surprise — the part of my routine I miss the hardest when I skip it.",
    date: "Apr 17, 2026",
    seed: "fieldnotes-small-walks",
    status: "published",
    readingMinutes: 5,
  },
  {
    id: "writing-tools",
    title: "What I write with, in spring 2026",
    slug: "/writing-tools",
    excerpt:
      "An accounting of the apps, paper, and one stubborn fountain pen I've ended up with. Mostly an exercise in noticing how little has changed.",
    date: "Apr 9, 2026",
    seed: "fieldnotes-writing-tools",
    status: "published",
    readingMinutes: 6,
  },
  {
    id: "letting-the-draft-rest",
    title: "Letting the draft rest",
    slug: "/letting-the-draft-rest",
    excerpt:
      "I used to publish the day I finished. Now I leave drafts for a week and read them like a stranger. The hit rate is much better.",
    date: "Mar 28, 2026",
    seed: "fieldnotes-draft-rest",
    status: "published",
    readingMinutes: 4,
  },
  {
    id: "reading-list-q1",
    title: "Reading list — first quarter",
    slug: "/reading-list-q1",
    excerpt:
      "Twelve books I finished, three I abandoned, and the one I keep returning to. Fiction is up, criticism is down. No theme to report.",
    date: "Mar 19, 2026",
    seed: "fieldnotes-reading-list",
    status: "published",
    readingMinutes: 9,
  },
  {
    id: "studio-light",
    title: "Notes on studio light",
    slug: "/studio-light",
    excerpt:
      "How a single south-facing window has reorganised my workday. With a small detour into the colour temperature of bulbs I won't shut up about.",
    date: "Mar 11, 2026",
    seed: "fieldnotes-studio-light",
    status: "published",
    readingMinutes: 6,
  },
  {
    id: "rss-still-works",
    title: "RSS still works, and I still use it",
    slug: "/rss-still-works",
    excerpt:
      "A small love letter to a quiet protocol — and the reader I built my own routine around. No algorithm, no notifications, all signal.",
    date: "Mar 3, 2026",
    seed: "fieldnotes-rss",
    status: "published",
    readingMinutes: 5,
  },
  {
    id: "newsletter-restart",
    title: "Restarting the newsletter — a draft",
    slug: "/newsletter-restart",
    excerpt:
      "After eighteen months away. What I want it to be, what I'm going to leave out, and the schedule I'll inevitably miss by a week.",
    date: "Apr 28, 2026",
    seed: "fieldnotes-newsletter",
    status: "draft",
    readingMinutes: 4,
  },
]

/** The post that anchors the blog homepage hero. */
export function featuredBlogPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.isFeatured) ?? BLOG_POSTS[0]!
}

/** The N most-recent published posts after the featured one. */
export function recentBlogPosts(limit = 6): BlogPost[] {
  return BLOG_POSTS.filter(
    (p) => p.status === "published" && !p.isFeatured,
  ).slice(0, limit)
}
