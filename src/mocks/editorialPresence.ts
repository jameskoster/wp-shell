import type { ContextRef } from "@/contexts/types"
import { getArticle, type Article } from "./articles"

/**
 * Where an editorial team member is right now in the admin. Mirrors
 * the shape of `presence.ts` (the Studio Park presence model) so the
 * dashboard's collaborative widgets can read either source uniformly
 * — but points at `articles.ts` rather than `pages.ts`, and uses
 * publication-flavoured screen labels (Submissions, Comments, …).
 */
export type EditorialPresenceLocation =
  | { kind: "dashboard" }
  | { kind: "screen"; label: string; action?: ContextRef }
  | { kind: "editing"; articleId: string }

export type EditorialPresence = {
  id: string
  name: string
  /** Role label rendered as a small caption beside the name. */
  role: string
  location: EditorialPresenceLocation
  since: string
}

export const EDITORIAL_PRESENCE: EditorialPresence[] = [
  {
    id: "iris",
    name: "Iris Caldwell",
    role: "Editor-in-chief",
    location: { kind: "editing", articleId: "summer-issue-edit" },
    since: "Just now",
  },
  {
    id: "theo",
    name: "Theo Bennett",
    role: "Senior reporter",
    location: { kind: "editing", articleId: "summer-cover-story" },
    since: "1m ago",
  },
  {
    id: "maya",
    name: "Maya Lin",
    role: "Investigations",
    location: { kind: "editing", articleId: "housing-investigation" },
    since: "3m ago",
  },
  {
    id: "ben",
    name: "Ben Mosesowitz",
    role: "News editor",
    location: { kind: "editing", articleId: "nhs-walk-in-piece" },
    since: "5m ago",
  },
  {
    id: "hannah",
    name: "Hannah Wexler",
    role: "Culture",
    location: {
      kind: "screen",
      label: "Comments",
      action: {
        type: "edit-page",
        params: { id: "comments" },
        title: "Comments",
      },
    },
    since: "6m ago",
  },
  {
    id: "connor",
    name: "Connor Bell",
    role: "Contributing",
    location: { kind: "editing", articleId: "art-school-profile" },
    since: "9m ago",
  },
  {
    id: "alex",
    name: "Alex Park",
    role: "You",
    location: { kind: "dashboard" },
    since: "Now",
  },
]

export type ActiveArticle = {
  article: Article
  editors: EditorialPresence[]
}

export function activeArticles(): ActiveArticle[] {
  const byArticle = new Map<string, EditorialPresence[]>()
  for (const p of EDITORIAL_PRESENCE) {
    if (p.location.kind !== "editing") continue
    const list = byArticle.get(p.location.articleId) ?? []
    list.push(p)
    byArticle.set(p.location.articleId, list)
  }
  const out: ActiveArticle[] = []
  for (const [articleId, editors] of byArticle) {
    const article = getArticle(articleId)
    if (!article) continue
    out.push({ article, editors })
  }
  return out
}

export function locationLabel(p: EditorialPresence): string {
  if (p.location.kind === "dashboard") return "Dashboard"
  if (p.location.kind === "screen") return p.location.label
  const article = getArticle(p.location.articleId)
  return article ? `Editing “${article.title}”` : "Editing an article"
}

export function locationAction(p: EditorialPresence): ContextRef | undefined {
  if (p.location.kind === "dashboard") return undefined
  if (p.location.kind === "screen") return p.location.action
  return {
    type: "editor",
    params: { kind: "post", id: p.location.articleId },
  }
}
