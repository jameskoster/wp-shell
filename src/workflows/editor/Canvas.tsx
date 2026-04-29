import { useMemo } from "react"
import {
  Compass,
  Hammer,
  Heart,
  Mail,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Context, EditorKind } from "@/contexts/types"
import {
  leadArticle,
  recentArticles,
  type Article,
} from "@/mocks/articles"
import { featuredBlogPost, recentBlogPosts, type BlogPost } from "@/mocks/blogPosts"
import {
  CATEGORY_VARIANT,
  topDiscussions,
  type Discussion,
} from "@/mocks/discussions"
import { recentSignups, TIER_LABEL, type Member } from "@/mocks/members"
import { getPage, type PageRow } from "@/mocks/pages"
import { siteFor } from "@/mocks/site"
import { useSite } from "@/stores/siteStore"

/**
 * The shape of "the document being edited", normalised from a context's
 * params. Lives next to `Canvas` (rather than inside `Editor.tsx`) so
 * the dashboard's Site Preview widget can render the same surface the
 * editor renders, with the same `Doc` resolution rules.
 */
/**
 * Which homepage layout the Canvas should render when `isFrontPage`
 * is true. Lets the same Site Preview widget power multiple recipes:
 * Studio Park's eCommerce storefront vs. Field Notes' personal blog,
 * etc. Defaults to `"commerce"` to preserve existing behaviour.
 */
export type FrontPageVariant = "commerce" | "blog" | "publication" | "community"

export type Doc = {
  title: string
  slug: string
  status: PageRow["status"]
  template: string
  isFrontPage: boolean
  /**
   * Only meaningful when `isFrontPage` is true. Picks which
   * site-shaped homepage the Canvas renders.
   */
  frontPageVariant?: FrontPageVariant
  kind: EditorKind
  excerpt: string
}

/**
 * Non-reactive read of the active site's homepage variant. Used by
 * `resolveDoc` and `homepageDoc` to keep the editor's canvas in sync
 * with the dashboard's Site Preview without threading site identity
 * through every caller. The site store is initialised at module load
 * with `DEFAULT_SITE_ID`, so this is always defined.
 */
function activeFrontPageVariant(): FrontPageVariant {
  return siteFor(useSite.getState().activeSiteId).frontPageVariant
}

/**
 * Resolve the editor context's params into a `Doc`. Falls back to the
 * homepage when no params are supplied (matching the editor's
 * `resolveDefaultParams`) so a bare `open({ type: "editor" })` lands on
 * a sensible-looking surface.
 *
 * When the resolved page is the front page, the document carries the
 * active site's `frontPageVariant` — so editing the homepage of Field
 * Notes opens the blog layout, the Bristol Review opens the
 * publication layout, and Studio Park keeps its eCommerce one.
 */
export function resolveDoc(ctx: Context): Doc {
  const params = ctx.params ?? {}
  const kind = (params.kind as EditorKind | undefined) ?? "page"
  const id = params.id ? String(params.id) : "home"

  if (id === "new") {
    return {
      title: "Untitled page",
      slug: "/untitled",
      status: "draft",
      template: "Default",
      isFrontPage: false,
      kind,
      excerpt:
        "Start writing — your first heading, a hero image, an opening paragraph. Anything you put down here lives only in this prototype.",
    }
  }

  const page = getPage(id)
  if (page) {
    const isFrontPage = Boolean(page.isFrontPage)
    return {
      title: page.title,
      slug: page.slug,
      status: page.status,
      template: page.template,
      isFrontPage,
      frontPageVariant: isFrontPage ? activeFrontPageVariant() : undefined,
      kind,
      excerpt:
        "This is a static representation of the document — the real block editor would render here. Switch documents from Pages to see this surface swap.",
    }
  }

  return {
    title: id.replace(/-/g, " "),
    slug: `/${id}`,
    status: "draft",
    template: "Default",
    isFrontPage: false,
    kind,
    excerpt:
      "No mock document for this id — but the editor surface still loads, the manage→edit handoff still works.",
  }
}

/**
 * Convenience: the homepage `Doc`. Used by the Site Preview widget so
 * it can render the same canvas the editor renders without minting a
 * fake `Context`. The `variant` arg overrides the active site's
 * default — omit it (the common case) to render the homepage layout
 * declared on the site descriptor.
 */
export function homepageDoc(variant?: FrontPageVariant): Doc {
  const page = getPage("home")
  return {
    title: page?.title ?? "Home",
    slug: page?.slug ?? "/",
    status: page?.status ?? "published",
    template: page?.template ?? "Front page",
    isFrontPage: true,
    frontPageVariant: variant ?? activeFrontPageVariant(),
    kind: "page",
    excerpt: "",
  }
}

/**
 * The "what's being edited" surface. Switches on `doc.isFrontPage` so
 * the homepage gets a bespoke per-variant layout (an eCommerce
 * storefront for Studio Park, a personal blog homepage for Field
 * Notes, etc.), while every other page falls back to the generic
 * block-stack mockup.
 *
 * Both branches are intentionally non-interactive — the editor wraps
 * this in its own chrome (header + actions), and the dashboard widget
 * embeds it under a single click-target. Adding live controls here
 * would compete with both surfaces.
 */
export function Canvas({ doc }: { doc: Doc }) {
  if (doc.isFrontPage) {
    if (doc.frontPageVariant === "blog") return <BlogHomepage />
    if (doc.frontPageVariant === "publication") return <PublicationHomepage />
    if (doc.frontPageVariant === "community") return <CommunityHomepage />
    return <EcommerceHomepage />
  }
  return <GenericDocument doc={doc} />
}

function GenericDocument({ doc }: { doc: Doc }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <article className="rounded-lg border bg-background shadow-sm/5">
        <div className="px-10 pt-12 pb-8">
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight">
            {doc.title}
          </h1>
          <p className="mt-4 text-base text-muted-foreground">{doc.excerpt}</p>
        </div>
        <BlockPlaceholder kind="image" label="Image block" />
        <BlockPlaceholder
          kind="paragraph"
          text="A second paragraph picks up where the intro left off — block-level controls would let you change typography, alignment, and color, none of which are wired up here."
        />
        <BlockPlaceholder kind="quote" text="A pull-quote block." />
        <BlockPlaceholder
          kind="paragraph"
          text="One more paragraph to give the canvas some weight. The point is to feel the swap when you switch documents from Pages, not to actually edit anything."
        />
        <BlockPlaceholder kind="button" label="A call-to-action button" />
        <div className="px-10 pb-12 pt-4 text-xs text-muted-foreground">
          End of document
        </div>
      </article>
    </div>
  )
}

function BlockPlaceholder({
  kind,
  text,
  label,
}: {
  kind: "image" | "paragraph" | "quote" | "button"
  text?: string
  label?: string
}) {
  if (kind === "image") {
    return (
      <div className="px-10 py-3">
        <div className="flex aspect-[16/9] items-center justify-center rounded-md border border-dashed bg-muted/20 text-xs text-muted-foreground">
          {label}
        </div>
      </div>
    )
  }
  if (kind === "quote") {
    return (
      <div className="px-10 py-3">
        <blockquote className="border-l-2 border-primary/40 pl-4 text-lg italic text-foreground/80">
          {text}
        </blockquote>
      </div>
    )
  }
  if (kind === "button") {
    return (
      <div className="px-10 py-3">
        <Button size="default" disabled>
          {label}
        </Button>
      </div>
    )
  }
  return (
    <div className="px-10 py-3">
      <p className="text-base text-foreground/90">{text}</p>
    </div>
  )
}

// ===== Blog homepage ======================================================

/**
 * Personal-blog homepage layout — the Field Notes site preview. Sits
 * deliberately apart from `EcommerceHomepage`: cool paper background
 * (vs. warm cream), no commerce affordances (cart, search, login), an
 * editorial typographic feel (wide tracking, light weights, mono date
 * kickers), and a single-author voice in the copy.
 */
function BlogHomepage() {
  const featured = featuredBlogPost()
  const recent = recentBlogPosts(4)
  return (
    <div className="bg-[#f6f5f1] text-stone-900 dark:bg-[#16171a] dark:text-stone-100">
      <BlogSiteHeader />
      <BlogHero post={featured} />
      <BlogPostList posts={recent} />
      <BlogSubscribe />
      <BlogSiteFooter />
    </div>
  )
}

function BlogSiteHeader() {
  return (
    <header className="border-b border-stone-200 dark:border-stone-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-6">
        <div className="font-heading text-base font-medium tracking-[0.02em]">
          Field&nbsp;Notes
        </div>
        <nav className="flex items-center gap-8 text-sm text-stone-700 dark:text-stone-300">
          <a className="hover:text-stone-900 dark:hover:text-stone-100">Writing</a>
          <a className="hover:text-stone-900 dark:hover:text-stone-100">Notes</a>
          <a className="hover:text-stone-900 dark:hover:text-stone-100">About</a>
          <a className="hover:text-stone-900 dark:hover:text-stone-100">Subscribe</a>
        </nav>
      </div>
    </header>
  )
}

function BlogHero({ post }: { post: BlogPost }) {
  return (
    <section className="border-b border-stone-200 dark:border-stone-800">
      <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto] items-center gap-12 px-8 py-20">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {post.date} · {post.readingMinutes} min read
          </p>
          <h1 className="font-heading mt-5 text-4xl font-medium leading-[1.15] tracking-tight">
            {post.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            {post.excerpt}
          </p>
          <p className="mt-7 text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400">
            Continue reading →
          </p>
        </div>
        <div className="aspect-[3/4] w-56 overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
          <ProductImage seed={post.seed} alt="" />
        </div>
      </div>
    </section>
  )
}

function BlogPostList({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="border-b border-stone-200 dark:border-stone-800">
      <div className="mx-auto max-w-4xl px-8 py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-medium tracking-tight">
            Recently
          </h2>
          <span className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400">
            All writing
          </span>
        </div>
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {posts.map((p) => (
            <li key={p.id} className="grid grid-cols-[5rem_1fr] gap-6 py-6">
              <div className="aspect-square overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
                <ProductImage seed={p.seed} alt="" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                  {p.date} · {p.readingMinutes} min
                </p>
                <p className="font-heading mt-2 text-lg font-medium leading-snug tracking-tight">
                  {p.title}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-stone-700 dark:text-stone-300">
                  {p.excerpt}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function BlogSubscribe() {
  return (
    <section className="border-b border-stone-200 bg-stone-100/60 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="mx-auto max-w-4xl px-8 py-16 text-center">
        <h3 className="font-heading text-2xl font-medium tracking-tight">
          A short note, every other Sunday.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-stone-600 dark:text-stone-400">
          One essay, a few links, occasional photographs from the studio. No
          tracking, no algorithm, easy to leave.
        </p>
        <div className="mx-auto mt-7 flex max-w-md items-center gap-2">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-md border border-stone-300 bg-background px-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            <Mail className="size-4" />
            you@example.com
          </div>
          <span className="inline-flex h-11 items-center rounded-md bg-stone-900 px-5 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900">
            Subscribe
          </span>
        </div>
      </div>
    </section>
  )
}

function BlogSiteFooter() {
  return (
    <footer className="bg-[#f6f5f1] dark:bg-[#16171a]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-10 text-xs text-stone-500 dark:text-stone-500">
        <span>© 2026 Field Notes · Written from Bristol</span>
        <span className="flex items-center gap-5">
          <span>RSS</span>
          <span>Archive</span>
          <span>Colophon</span>
        </span>
      </div>
    </footer>
  )
}

// ===== Publication homepage ===============================================

/**
 * The Bristol Review's homepage layout — an editorial / magazine feel
 * for the multi-author publication site. Sits apart from the blog
 * variant in two ways that matter visually: a structured grid that
 * leads with one headline and surfaces multiple stories beneath it
 * (vs. a single-author feed), and a section eyebrow on every story
 * (News / Culture / Long reads / …) that anchors the editorial
 * vocabulary in the chrome itself. Cool off-white page with a deep
 * ink accent — feels close to print.
 */
function PublicationHomepage() {
  const lead = leadArticle()
  const featured = recentArticles(3)
  const picks = recentArticles(6).slice(3)
  return (
    <div className="bg-[#f7f6f2] text-stone-900 dark:bg-[#13141a] dark:text-stone-100">
      <PubMasthead />
      <PubLead article={lead} />
      <PubFeaturedRow articles={featured} />
      <PubEditorsPicks articles={picks} />
      <PubSubscribe />
      <PubFooter />
    </div>
  )
}

function PubMasthead() {
  return (
    <header className="border-b border-stone-300/70 dark:border-stone-700/70">
      <div className="mx-auto max-w-6xl px-8 pt-8 pb-3">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Bristol · Issue 24 · Spring 2026
        </p>
        <h1 className="font-heading mt-2 text-center text-5xl font-semibold tracking-tight">
          The Bristol Review
        </h1>
      </div>
      <nav className="border-t border-stone-300/70 bg-stone-50/60 dark:border-stone-700/70 dark:bg-stone-900/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-8 py-3 text-sm">
          <div className="flex items-center gap-7 text-stone-700 dark:text-stone-300">
            <a className="hover:text-stone-900 dark:hover:text-stone-100">News</a>
            <a className="hover:text-stone-900 dark:hover:text-stone-100">Culture</a>
            <a className="hover:text-stone-900 dark:hover:text-stone-100">Reviews</a>
            <a className="hover:text-stone-900 dark:hover:text-stone-100">Long reads</a>
            <a className="hover:text-stone-900 dark:hover:text-stone-100">Interviews</a>
          </div>
          <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
            <Search className="size-4" />
            <span className="text-xs uppercase tracking-[0.16em]">Subscribe</span>
          </div>
        </div>
      </nav>
    </header>
  )
}

function PubLead({ article }: { article: Article }) {
  return (
    <section className="border-b border-stone-300/70 dark:border-stone-700/70">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-8 px-8 py-14">
        <div className="col-span-7 aspect-[4/3] overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
          <ProductImage seed={article.seed} alt="" />
        </div>
        <div className="col-span-5 flex flex-col justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            {article.section}
          </p>
          <h2 className="font-heading mt-3 text-4xl font-semibold leading-[1.1] tracking-tight">
            {article.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            {article.deck}
          </p>
          <p className="mt-5 text-sm text-stone-600 dark:text-stone-400">
            By {article.author} · {article.readingMinutes} min read
          </p>
        </div>
      </div>
    </section>
  )
}

function PubFeaturedRow({ articles }: { articles: Article[] }) {
  return (
    <section className="border-b border-stone-300/70 dark:border-stone-700/70">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <div className="grid grid-cols-3 gap-8">
          {articles.map((a) => (
            <article key={a.id} className="flex flex-col">
              <div className="aspect-[16/10] overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
                <ProductImage seed={a.seed} alt="" />
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                {a.section}
              </p>
              <h3 className="font-heading mt-2 text-xl font-semibold leading-snug tracking-tight">
                {a.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-stone-700 dark:text-stone-300">
                {a.deck}
              </p>
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
                By {a.author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function PubEditorsPicks({ articles }: { articles: Article[] }) {
  return (
    <section className="border-b border-stone-300/70 dark:border-stone-700/70">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Editor's picks
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-x-12 gap-y-6">
          {articles.map((a) => (
            <li key={a.id} className="grid grid-cols-[6rem_1fr] gap-5">
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
                <ProductImage seed={a.seed} alt="" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  {a.section}
                </p>
                <p className="font-heading mt-1 text-base font-semibold leading-snug tracking-tight">
                  {a.title}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                  By {a.author} · {a.readingMinutes} min
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PubSubscribe() {
  return (
    <section className="border-b border-stone-300/70 bg-[#1c1d24] text-stone-100 dark:border-stone-700/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-12 px-8 py-14">
        <div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight">
            Independent reporting,
            <br />
            paid for by readers.
          </h3>
          <p className="mt-3 max-w-md text-sm text-stone-400">
            Three issues a year in print, a weekly newsletter, and full archive
            access. From £6 a month — cancel anytime.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div className="flex h-12 items-center gap-3 rounded-md border border-stone-700 bg-stone-900 px-4 text-sm text-stone-400">
            <Mail className="size-4" />
            you@example.com
          </div>
          <span className="inline-flex h-12 items-center justify-center rounded-md bg-stone-100 px-6 text-sm font-medium text-stone-900">
            Become a member
          </span>
        </div>
      </div>
    </section>
  )
}

function PubFooter() {
  return (
    <footer className="bg-[#f7f6f2] dark:bg-[#13141a]">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8 py-12 text-sm">
        <div>
          <div className="font-heading text-base font-semibold">
            The Bristol Review
          </div>
          <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
            A reader-funded quarterly covering the city since 2018.
          </p>
        </div>
        <PubFooterColumn
          label="Read"
          items={["Latest issue", "Archive", "Long reads", "Interviews"]}
        />
        <PubFooterColumn
          label="About"
          items={["Masthead", "Ethics", "Contact", "Submissions"]}
        />
        <PubFooterColumn
          label="Support"
          items={["Membership", "Donate", "Stockists", "Newsletter"]}
        />
      </div>
      <div className="border-t border-stone-300/70 dark:border-stone-700/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5 text-xs text-stone-500 dark:text-stone-500">
          <span>© 2026 The Bristol Review CIC</span>
          <span>Made with WordPress</span>
        </div>
      </div>
    </footer>
  )
}

function PubFooterColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </div>
      <ul className="mt-3 space-y-2 text-stone-700 dark:text-stone-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// ===== Community homepage =================================================

/**
 * Maker Circle's homepage — a paid community for craftspeople. Sits
 * apart from the other variants:
 *
 *  - Warmer than Field Notes' cool stone, cooler than Studio Park's
 *    cream — a craft-paper / workshop palette (`#f3ede2`) with a
 *    deep walnut accent for chrome and CTAs.
 *  - Reads as a community, not a publication: the hero leads with
 *    member count, the proof row counts countries / workshops /
 *    weekly threads, and the centre of the page is what's *being
 *    discussed* (active forum threads) rather than what's been
 *    published.
 *  - Membership tiers are visible above the fold's reach so the
 *    join CTA is always one scroll away.
 *
 * Pulls real data from the same MEMBERS / DISCUSSIONS mocks that
 * power the dashboard widgets, so the public homepage and the
 * manager's dashboard tell one consistent story.
 */
function CommunityHomepage() {
  const featured = topDiscussions(3)
  const newest = recentSignups(4)
  return (
    <div className="bg-[#f3ede2] text-[#2a221a] dark:bg-[#1a1612] dark:text-stone-100">
      <CommunityHeader />
      <CommunityHero />
      <CommunityProofRow />
      <CommunityFeaturedThreads threads={featured} />
      <CommunityNewMembers members={newest} />
      <CommunityTiers />
      <CommunityFooter />
    </div>
  )
}

function CommunityHeader() {
  return (
    <header className="border-b border-[#e6dcc7] dark:border-stone-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-[#2a221a] text-amber-200 dark:bg-amber-200 dark:text-[#2a221a]">
            <Hammer className="size-4" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Maker&nbsp;Circle
          </span>
        </div>
        <nav className="flex items-center gap-7 text-sm text-[#4a3f33] dark:text-stone-300">
          <a className="hover:text-[#2a221a] dark:hover:text-stone-100">Forum</a>
          <a className="hover:text-[#2a221a] dark:hover:text-stone-100">Workshops</a>
          <a className="hover:text-[#2a221a] dark:hover:text-stone-100">Members</a>
          <a className="hover:text-[#2a221a] dark:hover:text-stone-100">About</a>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#4a3f33] dark:text-stone-400">Sign in</span>
          <span className="inline-flex h-9 items-center rounded-md bg-[#2a221a] px-4 text-sm font-medium text-amber-100 dark:bg-amber-200 dark:text-[#2a221a]">
            Join the circle
          </span>
        </div>
      </div>
    </header>
  )
}

function CommunityHero() {
  return (
    <section className="border-b border-[#e6dcc7] dark:border-stone-800">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-12 px-8 py-20">
        <div className="col-span-7 flex flex-col justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7a6a52] dark:text-stone-400">
            A community for makers · Est. 2024
          </p>
          <h1 className="font-heading mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">
            Where the
            <br />
            craft happens.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[#4a3f33] dark:text-stone-400">
            A small, paid community of letterpressers, ceramicists, weavers,
            woodworkers, and binders. Weekly workshops, an active forum, and
            twice-a-month critique sessions — for people who'd rather be
            making.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="inline-flex h-11 items-center rounded-md bg-[#2a221a] px-6 text-sm font-medium text-amber-100 dark:bg-amber-200 dark:text-[#2a221a]">
              Join from £8 / month
            </span>
            <span className="inline-flex h-11 items-center rounded-md border border-[#cdbf9f] px-5 text-sm font-medium text-[#2a221a] dark:border-stone-700 dark:text-stone-100">
              Browse the forum
            </span>
          </div>
        </div>
        <div className="col-span-5 aspect-[4/5] overflow-hidden rounded-md bg-[#e6dcc7] dark:bg-stone-900">
          <ProductImage seed="makercircle-workshop-hands" alt="" />
        </div>
      </div>
    </section>
  )
}

function CommunityProofRow() {
  return (
    <section className="border-b border-[#e6dcc7] bg-[#ece2cb] dark:border-stone-800 dark:bg-[#22190f]">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-6 px-8 py-10 text-center">
        <ProofStat label="Members" value="3,420" />
        <ProofStat label="Countries" value="48" />
        <ProofStat label="Workshops a year" value="60+" />
        <ProofStat label="New threads / week" value="74" />
      </div>
    </section>
  )
}

function ProofStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#7a6a52] dark:text-stone-400">
        {label}
      </p>
    </div>
  )
}

function CommunityFeaturedThreads({ threads }: { threads: Discussion[] }) {
  return (
    <section className="border-b border-[#e6dcc7] dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            What's in the workshop today
          </h2>
          <span className="text-sm text-[#4a3f33] underline-offset-4 hover:underline dark:text-stone-400">
            All discussions →
          </span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {threads.map((t) => (
            <CommunityThreadCard key={t.id} thread={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CommunityThreadCard({ thread }: { thread: Discussion }) {
  // Reuse the recipe-layer category badge variant so the public
  // homepage and the manager's dashboard widget tag threads with
  // the same vocabulary. The variant is `BadgeVariant`, not a class
  // — we just borrow the semantic to pick a paint color here.
  const tone = CATEGORY_VARIANT[thread.category]
  const dot =
    tone === "warning"
      ? "bg-amber-500"
      : tone === "info"
        ? "bg-sky-500"
        : tone === "secondary"
          ? "bg-stone-500"
          : "bg-stone-400"
  return (
    <article className="flex flex-col rounded-md border border-[#e6dcc7] bg-white/40 p-5 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a6a52] dark:text-stone-400">
        <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
        {thread.category}
      </div>
      <h3 className="font-heading mt-3 text-lg font-semibold leading-snug tracking-tight">
        {thread.title}
      </h3>
      <div className="mt-4 flex items-center gap-3 text-xs text-[#7a6a52] dark:text-stone-400">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#e6dcc7] text-[10px] font-medium text-[#2a221a] dark:bg-stone-800 dark:text-stone-200">
          {thread.authorName.charAt(0)}
        </span>
        <span>
          {thread.authorName} · {thread.replyCount} replies · {thread.lastReplyAt}
        </span>
      </div>
    </article>
  )
}

function CommunityNewMembers({ members }: { members: Member[] }) {
  return (
    <section className="border-b border-[#e6dcc7] dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Newest members
          </h2>
          <span className="text-sm text-[#4a3f33] underline-offset-4 hover:underline dark:text-stone-400">
            Member directory
          </span>
        </div>
        <ul className="grid grid-cols-4 gap-6">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-md border border-[#e6dcc7] bg-white/40 p-5 dark:border-stone-800 dark:bg-stone-900/40"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6dcc7] text-sm font-medium text-[#2a221a] dark:bg-stone-800 dark:text-stone-200">
                  {m.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a6a52] dark:text-stone-500">
                    {TIER_LABEL[m.tier]} · {m.handle}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[#4a3f33] dark:text-stone-400">
                {m.craft}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CommunityTiers() {
  return (
    <section className="border-b border-[#e6dcc7] dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Three ways to join.
          </h2>
          <p className="mt-3 text-base text-[#4a3f33] dark:text-stone-400">
            Pick the tier that fits the rhythm you make at. Cancel any time —
            we'll keep the lights on either way.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <CommunityTierCard
            label="Free"
            price="£0"
            cadence=""
            blurb="Newsletter and read-only forum access. A way in."
            features={["Weekly newsletter", "Browse the forum", "Public showcase"]}
            icon={<Compass className="size-5" />}
          />
          <CommunityTierCard
            label="Maker"
            price="£8"
            cadence="/ month"
            blurb="The full community: forum, workshops, monthly hangouts."
            features={[
              "Post in the forum",
              "Live workshops (~5 / month)",
              "Monthly community hangout",
            ]}
            icon={<MessageCircle className="size-5" />}
            featured
          />
          <CommunityTierCard
            label="Pro"
            price="£18"
            cadence="/ month"
            blurb="Everything in Maker, plus small-group critique sessions."
            features={[
              "Everything in Maker",
              "Small-group critique (twice / mo.)",
              "Annual print zine",
            ]}
            icon={<Sparkles className="size-5" />}
          />
        </div>
      </div>
    </section>
  )
}

function CommunityTierCard({
  label,
  price,
  cadence,
  blurb,
  features,
  icon,
  featured,
}: {
  label: string
  price: string
  cadence: string
  blurb: string
  features: string[]
  icon: React.ReactNode
  featured?: boolean
}) {
  // The featured ("Maker") tier inverts the palette so it pops as
  // the recommended path — same trick most pricing tables use.
  const base = featured
    ? "bg-[#2a221a] text-amber-100 border-[#2a221a] dark:bg-amber-200 dark:text-[#2a221a] dark:border-amber-200"
    : "bg-white/50 text-[#2a221a] border-[#e6dcc7] dark:bg-stone-900/40 dark:text-stone-100 dark:border-stone-800"
  const muted = featured
    ? "text-amber-100/70 dark:text-[#2a221a]/70"
    : "text-[#7a6a52] dark:text-stone-400"
  const accent = featured
    ? "bg-amber-300 text-[#2a221a] dark:bg-[#2a221a] dark:text-amber-200"
    : "bg-[#e6dcc7] text-[#2a221a] dark:bg-stone-800 dark:text-stone-200"
  return (
    <div className={`flex flex-col rounded-lg border p-6 ${base}`}>
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex size-9 items-center justify-center rounded-md ${accent}`}>
          {icon}
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">
          {label}
        </span>
      </div>
      <p className={`mt-5 font-mono text-[10px] uppercase tracking-[0.18em] ${muted}`}>
        From
      </p>
      <p className="mt-1 font-heading text-4xl font-semibold tabular-nums tracking-tight">
        {price}
        <span className={`ml-1 font-sans text-sm font-normal ${muted}`}>
          {cadence}
        </span>
      </p>
      <p className={`mt-4 text-sm ${muted}`}>{blurb}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${featured ? "bg-amber-200 dark:bg-[#2a221a]" : "bg-[#7a6a52]"}`} aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <span
        className={`mt-7 inline-flex h-10 items-center justify-center rounded-md text-sm font-medium ${
          featured
            ? "bg-amber-200 text-[#2a221a] dark:bg-[#2a221a] dark:text-amber-200"
            : "border border-[#cdbf9f] text-[#2a221a] dark:border-stone-700 dark:text-stone-100"
        }`}
      >
        Choose {label}
      </span>
    </div>
  )
}

function CommunityFooter() {
  return (
    <footer className="bg-[#2a221a] text-stone-200">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8 py-14 text-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-amber-200 text-[#2a221a]">
              <Users className="size-4" />
            </span>
            <span className="font-heading text-base font-semibold text-white">
              Maker Circle
            </span>
          </div>
          <p className="mt-3 text-xs text-stone-400">
            A small paid community for craftspeople. Run by makers, for makers.
          </p>
        </div>
        <FooterColumn
          label="Community"
          items={["Forum", "Workshops", "Members", "Code of conduct"]}
        />
        <FooterColumn
          label="About"
          items={["Manifesto", "Hosts", "Contact", "Press"]}
        />
        <FooterColumn
          label="Join"
          items={["Pricing", "Gift a membership", "Scholarships", "Newsletter"]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5 text-xs text-stone-400">
          <span>© 2026 Maker Circle Co-op</span>
          <span>Made with WordPress</span>
        </div>
      </div>
    </footer>
  )
}

// ===== eCommerce homepage =================================================

/**
 * The featured-products grid. Pulls from the same picsum seeds the
 * dashboard's Best sellers / Low stock / Reviews widgets use, so the
 * preview reads as the SAME store the rest of the prototype is talking
 * about (rather than a generic stock-photo dump).
 */
const FEATURED_PRODUCTS: Array<{
  id: string
  name: string
  price: string
  seed: string
}> = [
  { id: "f1", name: "Linen tote — natural", price: "$48", seed: "linen-tote-natural" },
  { id: "f2", name: "Ceramic mug — sage", price: "$24", seed: "ceramic-mug-sage" },
  { id: "f3", name: "Brass lamp — small", price: "$128", seed: "brass-lamp-small" },
  { id: "f4", name: "Wool throw — charcoal", price: "$96", seed: "wool-throw-charcoal" },
]

const NEW_ARRIVALS: Array<{
  id: string
  name: string
  price: string
  seed: string
}> = [
  { id: "n1", name: "Beeswax candle — amber", price: "$22", seed: "beeswax-candle-amber" },
  { id: "n2", name: "Cotton scarf — sand", price: "$36", seed: "cotton-scarf-sand" },
  { id: "n3", name: "Reed diffuser — fig", price: "$28", seed: "reed-diffuser-fig" },
  { id: "n4", name: "Walnut tray — large", price: "$64", seed: "walnut-tray-large" },
]

/**
 * Homepage palette is intentionally OFF the admin's neutral palette —
 * the dashboard chrome is white / cool-grey, the site preview is warm
 * stone with a muted forest accent. Stops the embedded preview from
 * looking like just another admin card and reads as "this is the
 * brand". Custom hex on the page background nudges the warmth a touch
 * past Tailwind's stone-50 (which is barely warmer than pure white).
 */
function EcommerceHomepage() {
  return (
    <div className="bg-[#f4ede0] text-stone-900 dark:bg-[#1c1813] dark:text-stone-100">
      <SiteHeader />
      <Hero />
      <FeaturedGrid title="Best sellers" products={FEATURED_PRODUCTS} />
      <LifestyleBanner />
      <FeaturedGrid title="New this season" products={NEW_ARRIVALS} />
      <Newsletter />
      <SiteFooter />
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <div className="font-heading text-xl font-semibold tracking-tight">
          Studio&nbsp;Park
        </div>
        <nav className="flex items-center gap-7 text-sm">
          <a className="hover:opacity-70">Shop</a>
          <a className="hover:opacity-70">Collections</a>
          <a className="hover:opacity-70">Journal</a>
          <a className="hover:opacity-70">About</a>
        </nav>
        <div className="flex items-center gap-4 text-stone-700 dark:text-stone-300">
          <Search className="size-4" />
          <User className="size-4" />
          <div className="relative">
            <ShoppingBag className="size-4" />
            <span className="absolute -top-1.5 -right-2 inline-flex size-4 items-center justify-center rounded-full bg-stone-900 text-[10px] font-medium text-white tabular-nums dark:bg-stone-100 dark:text-stone-900">
              2
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-12 px-8 py-20">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Spring collection · 2026
          </p>
          <h1 className="font-heading mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">
            Soft textures,
            <br />
            slow living.
          </h1>
          <p className="mt-6 max-w-md text-base text-stone-600 dark:text-stone-400">
            A small batch of considered objects for the home — woven, thrown,
            and turned by hand in our Bristol studio.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="inline-flex h-10 items-center rounded-full bg-stone-900 px-5 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900">
              Shop the collection
            </span>
            <span className="inline-flex h-10 items-center rounded-full border border-stone-300 px-5 text-sm font-medium text-stone-900 dark:border-stone-700 dark:text-stone-100">
              Read the lookbook
            </span>
          </div>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
          <ProductImage seed="homepage-hero" alt="" />
        </div>
      </div>
    </section>
  )
}

function FeaturedGrid({
  title,
  products,
}: {
  title: string
  products: Array<{ id: string; name: string; price: string; seed: string }>
}) {
  return (
    <section className="border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {title}
          </h2>
          <span className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400">
            Shop all
          </span>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCard({
  product,
}: {
  product: { id: string; name: string; price: string; seed: string }
}) {
  return (
    <article className="group/card flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900">
        <ProductImage seed={product.seed} alt="" />
        <span className="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm/10 dark:bg-stone-900/80 dark:text-stone-300">
          <Heart className="size-3.5" />
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="text-sm tabular-nums text-stone-600 dark:text-stone-400">
          {product.price}
        </p>
      </div>
    </article>
  )
}

function LifestyleBanner() {
  return (
    <section className="relative border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="relative mx-auto max-w-6xl px-8 py-16">
        <div className="relative aspect-[16/7] overflow-hidden rounded-md">
          <ProductImage seed="studio-spring" alt="" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-12">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">
              Our story
            </p>
            <h3 className="font-heading mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
              Made with care, sourced with intent.
            </h3>
            <p className="mt-3 max-w-md text-sm text-white/80">
              Every piece begins with a material — linen from Lithuania, brass
              from Birmingham, clay from a quarry an hour from the studio.
            </p>
            <span className="mt-6 inline-flex h-10 w-fit items-center rounded-full bg-white px-5 text-sm font-medium text-stone-900">
              About the studio
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <section className="border-b border-stone-200/80 bg-[#ebdfc4] dark:border-stone-800/80 dark:bg-[#251f17]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-12 px-8 py-16">
        <div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight">
            Field notes, monthly.
          </h3>
          <p className="mt-3 max-w-md text-sm text-stone-600 dark:text-stone-400">
            New pieces, restocks, and the occasional behind-the-scenes from the
            studio. No tracking pixels, no second emails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-full border border-stone-300 bg-white px-5 text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-400">
            <Mail className="size-4" />
            you@example.com
          </div>
          <span className="inline-flex h-12 items-center rounded-full bg-stone-900 px-6 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900">
            Subscribe
          </span>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  // Deep warm brown anchors the bottom of the page and reinforces the
  // brand palette — the rest of the homepage is light cream / stone, so
  // the footer doubles as a definite "end of site" affordance.
  return (
    <footer className="bg-[#2a221a] text-stone-200">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-8 py-14 text-sm">
        <div>
          <div className="font-heading text-lg font-semibold text-white">
            Studio Park
          </div>
          <p className="mt-3 text-xs text-stone-400">
            Considered objects for the home, made in Bristol since 2019.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-stone-400">
            <span>@studiopark</span>
            <span>Newsletter</span>
          </div>
        </div>
        <FooterColumn label="Shop" items={["New arrivals", "Best sellers", "Last chance", "Gift cards"]} />
        <FooterColumn label="Studio" items={["About", "Journal", "Stockists", "Contact"]} />
        <FooterColumn label="Help" items={["Shipping", "Returns", "Care guides", "FAQ"]} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5 text-xs text-stone-400">
          <span>© 2026 Studio Park Ltd.</span>
          <span>Made with WordPress</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-stone-400">
        {label}
      </div>
      <ul className="mt-3 space-y-2 text-stone-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Picsum thumbnail with a deterministic offline-friendly fallback. The
 * fallback color is derived from the seed (same hashing the dashboard's
 * `Thumbnail` uses) so a missing image still reads as a distinct chip
 * rather than a uniform grey.
 */
function ProductImage({
  seed,
  alt,
  className = "",
}: {
  seed: string
  alt: string
  className?: string
}) {
  const fallback = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) | 0
    }
    const hue = Math.abs(h) % 360
    return `hsl(${hue} 32% 78%)`
  }, [seed])

  return (
    <img
      src={`https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1000`}
      alt={alt}
      loading="lazy"
      style={{ backgroundColor: fallback }}
      className={`size-full object-cover ${className}`}
    />
  )
}
