export type PageStatus = "published" | "draft" | "scheduled" | "trash"

export type PageRow = {
  id: string
  title: string
  slug: string
  status: PageStatus
  author: string
  modified: string
  template: string
  isFrontPage?: boolean
}

export const PAGES: PageRow[] = [
  {
    id: "home",
    title: "Home",
    slug: "/",
    status: "published",
    author: "Anya P.",
    modified: "2 hours ago",
    template: "Front page",
    isFrontPage: true,
  },
  {
    id: "about",
    title: "About the studio",
    slug: "/about",
    status: "published",
    author: "Anya P.",
    modified: "Yesterday",
    template: "Default",
  },
  {
    id: "shop",
    title: "Shop",
    slug: "/shop",
    status: "published",
    author: "Marco D.",
    modified: "3 days ago",
    template: "Wide",
  },
  {
    id: "contact",
    title: "Contact",
    slug: "/contact",
    status: "published",
    author: "Sarah K.",
    modified: "1 week ago",
    template: "Default",
  },
  {
    id: "press",
    title: "Press kit",
    slug: "/press",
    status: "published",
    author: "Marco D.",
    modified: "2 weeks ago",
    template: "Default",
  },
  {
    id: "field-notes",
    title: "Field notes",
    slug: "/field-notes",
    status: "published",
    author: "Sarah K.",
    modified: "3 weeks ago",
    template: "Wide",
  },
  {
    id: "spring-collection",
    title: "Spring collection — preview",
    slug: "/spring-collection-preview",
    status: "draft",
    author: "Anya P.",
    modified: "12 minutes ago",
    template: "Wide",
  },
  {
    id: "studio-update",
    title: "A note from the studio",
    slug: "/studio-update",
    status: "draft",
    author: "Marco D.",
    modified: "Yesterday",
    template: "Default",
  },
  {
    id: "april-look",
    title: "Look book — April",
    slug: "/look-book-april",
    status: "draft",
    author: "Sarah K.",
    modified: "3 days ago",
    template: "Wide",
  },
  {
    id: "ceramics-restock",
    title: "Ceramics restock",
    slug: "/ceramics-restock",
    status: "draft",
    author: "Anya P.",
    modified: "5 days ago",
    template: "Default",
  },
  {
    id: "summer-launch",
    title: "Summer launch — landing",
    slug: "/summer-launch",
    status: "scheduled",
    author: "Marco D.",
    modified: "Schedules in 4 days",
    template: "Wide",
  },
  {
    id: "old-press",
    title: "Old press release",
    slug: "/press-2022",
    status: "trash",
    author: "Sarah K.",
    modified: "6 months ago",
    template: "Default",
  },
  {
    id: "faq",
    title: "FAQ",
    slug: "/faq",
    status: "published",
    author: "Anya P.",
    modified: "1 month ago",
    template: "Default",
  },
  {
    id: "shipping",
    title: "Shipping & returns",
    slug: "/shipping",
    status: "published",
    author: "Marco D.",
    modified: "1 month ago",
    template: "Default",
  },
  {
    id: "privacy",
    title: "Privacy policy",
    slug: "/privacy",
    status: "published",
    author: "Sarah K.",
    modified: "3 months ago",
    template: "Default",
  },
  {
    id: "terms",
    title: "Terms of service",
    slug: "/terms",
    status: "published",
    author: "Sarah K.",
    modified: "3 months ago",
    template: "Default",
  },
]

export const HOMEPAGE_ID = "home"

export function getPage(id: string | undefined): PageRow | undefined {
  if (!id) return undefined
  return PAGES.find((p) => p.id === id)
}

export function pagesByStatus(status: PageStatus | "all"): PageRow[] {
  if (status === "all") return PAGES.filter((p) => p.status !== "trash")
  return PAGES.filter((p) => p.status === status)
}

export function statusCounts(): Record<PageStatus | "all", number> {
  return {
    all: PAGES.filter((p) => p.status !== "trash").length,
    published: PAGES.filter((p) => p.status === "published").length,
    draft: PAGES.filter((p) => p.status === "draft").length,
    scheduled: PAGES.filter((p) => p.status === "scheduled").length,
    trash: PAGES.filter((p) => p.status === "trash").length,
  }
}
