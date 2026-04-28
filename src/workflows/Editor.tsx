import { useMemo } from "react"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { parentForEditor, titleFor } from "@/contexts/registry"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"
import { ContextHeader, type BreadcrumbCrumb } from "@/shell/ContextHeader"
import type { PageRow } from "@/mocks/pages"
import { Canvas, resolveDoc } from "./editor/Canvas"

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

export function Editor({ ctx }: { ctx: Context }) {
  const doc = useMemo(() => resolveDoc(ctx), [ctx])
  const swapTo = useContexts((s) => s.swapTo)
  const parent = parentForEditor(doc.kind)
  // Walking back to the parent manage context is the other half of the
  // edit loop. swapTo runs the choreographed two-tile swap when the
  // parent is already open and falls back to a launch-rect open when
  // it's not. This is editor-specific — most breadcrumbs (e.g. an
  // order detail returning to Orders) navigate within a single context
  // and don't touch swapTo at all.
  const parentCrumb: BreadcrumbCrumb | null = parent
    ? {
        label: titleFor(parent),
        onClick: (event) =>
          swapTo(parent, event.currentTarget.getBoundingClientRect()),
      }
    : null

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <ContextHeader
        ctx={ctx}
        actions={
          <>
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
          </>
        }
      >
        <ContextHeader.Breadcrumb
          parents={parentCrumb}
          current={doc.title}
          badges={
            <>
              <Badge size="sm" variant={STATUS_VARIANT[doc.status]}>
                {STATUS_LABEL[doc.status]}
              </Badge>
              {doc.isFrontPage ? (
                <Badge size="sm" variant="outline">
                  Front page
                </Badge>
              ) : null}
            </>
          }
        />
      </ContextHeader>

      <ScrollArea className="flex-1 bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] dark:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)]">
        <Canvas doc={doc} />
      </ScrollArea>
    </div>
  )
}
