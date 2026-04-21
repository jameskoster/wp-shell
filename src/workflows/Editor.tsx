import { useMemo } from "react"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { parentForEditor, titleFor } from "@/contexts/registry"
import { useContexts } from "@/contexts/store"
import type { Context, ContextRef, EditorKind } from "@/contexts/types"
import { getPage, type PageRow } from "@/mocks/pages"

type Doc = {
  title: string
  slug: string
  status: PageRow["status"]
  template: string
  isFrontPage: boolean
  kind: EditorKind
  excerpt: string
}

const STATUS_LABEL: Record<PageRow["status"], string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  trash: "Trash",
}

const STATUS_VARIANT: Record<
  PageRow["status"],
  "success" | "secondary" | "info" | "outline"
> = {
  published: "success",
  draft: "secondary",
  scheduled: "info",
  trash: "outline",
}

function resolveDoc(ctx: Context): Doc {
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

export function Editor({ ctx }: { ctx: Context }) {
  const doc = useMemo(() => resolveDoc(ctx), [ctx])
  const open = useContexts((s) => s.open)
  const parent = parentForEditor(doc.kind)

  function handleParentClick(
    ref: ContextRef,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    open(ref, event.currentTarget.getBoundingClientRect())
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap text-base sm:text-base">
              {parent ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <button
                          type="button"
                          onClick={(e) => handleParentClick(parent, e)}
                          className="font-heading text-lg font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                        />
                      }
                    >
                      {titleFor(parent)}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/60" />
                </>
              ) : null}
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage
                  className="min-w-0 truncate font-heading text-lg font-semibold"
                  title={doc.title}
                >
                  {doc.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Badge size="sm" variant={STATUS_VARIANT[doc.status]}>
            {STATUS_LABEL[doc.status]}
          </Badge>
          {doc.isFrontPage ? (
            <Badge size="sm" variant="outline">
              Front page
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled>
            Save draft
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Eye />
            Preview
          </Button>
          <Button size="sm" disabled>
            {doc.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] dark:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)]">
        <Canvas doc={doc} />
      </ScrollArea>
    </div>
  )
}

function Canvas({ doc }: { doc: Doc }) {
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
