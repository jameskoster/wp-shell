import { useMemo } from "react"
import { Heart, Mail, Search, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Context, EditorKind } from "@/contexts/types"
import { getPage, type PageRow } from "@/mocks/pages"

/**
 * The shape of "the document being edited", normalised from a context's
 * params. Lives next to `Canvas` (rather than inside `Editor.tsx`) so
 * the dashboard's Site Preview widget can render the same surface the
 * editor renders, with the same `Doc` resolution rules.
 */
export type Doc = {
  title: string
  slug: string
  status: PageRow["status"]
  template: string
  isFrontPage: boolean
  kind: EditorKind
  excerpt: string
}

/**
 * Resolve the editor context's params into a `Doc`. Falls back to the
 * homepage when no params are supplied (matching the editor's
 * `resolveDefaultParams`) so a bare `open({ type: "editor" })` lands on
 * a sensible-looking surface.
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
    return {
      title: page.title,
      slug: page.slug,
      status: page.status,
      template: page.template,
      isFrontPage: Boolean(page.isFrontPage),
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
 * fake `Context`. Falls through to `resolveDoc`'s `home` branch.
 */
export function homepageDoc(): Doc {
  const page = getPage("home")
  return {
    title: page?.title ?? "Home",
    slug: page?.slug ?? "/",
    status: page?.status ?? "published",
    template: page?.template ?? "Front page",
    isFrontPage: true,
    kind: "page",
    excerpt: "",
  }
}

/**
 * The "what's being edited" surface. Switches on `doc.isFrontPage` so
 * the homepage gets a bespoke eCommerce layout (the kind a Twenty
 * Twenty-Six storefront would render at `/`), while every other page
 * falls back to the generic block-stack mockup.
 *
 * Both branches are intentionally non-interactive — the editor wraps
 * this in its own chrome (header + actions), and the dashboard widget
 * embeds it under a single click-target. Adding live controls here
 * would compete with both surfaces.
 */
export function Canvas({ doc }: { doc: Doc }) {
  if (doc.isFrontPage) return <EcommerceHomepage />
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
