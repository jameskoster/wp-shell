import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  FileEdit,
  FilePlus2,
  FileText,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContextLayout } from "@/shell/ContextLayout"
import { ContextSubnav } from "@/shell/ContextSubnav"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"
import {
  PAGES,
  pagesByStatus,
  statusCounts,
  type PageRow,
  type PageStatus,
} from "@/mocks/pages"

type ViewKey = PageStatus | "all"

const VIEWS: Array<{
  key: ViewKey
  label: string
  icon: typeof FileText
}> = [
  { key: "all", label: "All pages", icon: FileText },
  { key: "published", label: "Published", icon: CheckCircle2 },
  { key: "draft", label: "Drafts", icon: FileEdit },
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "trash", label: "Trash", icon: Trash2 },
]

const STATUS_VARIANT: Record<
  PageStatus,
  { label: string; variant: "success" | "secondary" | "info" | "outline" }
> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "info" },
  trash: { label: "Trash", variant: "outline" },
}

function isViewKey(value: unknown): value is ViewKey {
  return (
    value === "all" ||
    value === "published" ||
    value === "draft" ||
    value === "scheduled" ||
    value === "trash"
  )
}

export function Pages({ ctx }: { ctx: Context }) {
  const open = useContexts((s) => s.open)
  const swapTo = useContexts((s) => s.swapTo)
  const rawView = ctx.params?.view
  const view: ViewKey = isViewKey(rawView) ? rawView : "all"
  const counts = useMemo(() => statusCounts(), [])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const visible = useMemo<PageRow[]>(() => {
    const base = pagesByStatus(view)
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    )
  }, [view, query])

  const allSelected = visible.length > 0 && visible.every((p) => selected.has(p.id))
  const someSelected = visible.some((p) => selected.has(p.id))

  function setView(next: ViewKey) {
    setSelected(new Set())
    open({
      type: "pages",
      params: { view: next },
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev)
        for (const p of visible) next.delete(p.id)
        return next
      }
      const next = new Set(prev)
      for (const p of visible) next.add(p.id)
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openInEditor(
    page: PageRow,
    options: { pinned?: boolean; rect?: DOMRect | null } = {}
  ) {
    const ref = {
      type: "editor" as const,
      params: {
        kind: "page" as const,
        id: page.id,
        ...(options.pinned ? { instanceId: page.id } : {}),
      },
    }
    // Pinned spawns a fresh singleton; that's a "new context" event, not a
    // loop step, so keep the launch-rect animation. Default opens pass
    // through swapTo: if the default Editor is already open it choreographs
    // the manage ↔ editor loop swap, otherwise it falls back to a normal
    // launch-rect open.
    if (options.pinned) {
      open(ref, options.rect ?? null)
    } else {
      swapTo(ref, options.rect ?? null)
    }
  }

  function handleTitleClick(
    page: PageRow,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    const pinned = event.metaKey || event.ctrlKey
    openInEditor(page, {
      pinned,
      rect: event.currentTarget.getBoundingClientRect(),
    })
  }

  function handleAddNew(event: React.MouseEvent<HTMLButtonElement>) {
    swapTo(
      {
        type: "editor",
        params: { kind: "page", id: "new" },
      },
      event.currentTarget.getBoundingClientRect()
    )
  }

  return (
    <ContextLayout>
      <ContextSubnav header="Status">
        <ContextSubnav.Group>
          {VIEWS.map((v) => (
            <ContextSubnav.Item
              key={v.key}
              icon={v.icon}
              active={view === v.key}
              count={counts[v.key]}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </ContextSubnav.Item>
          ))}
        </ContextSubnav.Group>
      </ContextSubnav>
      <ContextLayout.Main>
        <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold">Pages</h1>
            <p className="text-xs text-muted-foreground">
              {visible.length} {visible.length === 1 ? "page" : "pages"}
              {view !== "all" ? ` in ${VIEWS.find((v) => v.key === view)?.label.toLowerCase()}` : ""}
            </p>
          </div>
          <Button size="sm" onClick={handleAddNew}>
            <FilePlus2 />
            Add new
          </Button>
        </header>

        <div className="flex items-center gap-2 border-b px-6 py-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pages…"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              className="pl-7"
              size="sm"
            />
          </div>
          {someSelected ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{selected.size} selected</span>
              <Button size="xs" variant="outline" disabled>
                Bulk edit
              </Button>
              <Button size="xs" variant="destructive-outline" disabled>
                Trash
              </Button>
            </div>
          ) : null}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-px">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all pages"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-40">Author</TableHead>
                  <TableHead className="w-44">Modified</TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((page) => {
                  const status = STATUS_VARIANT[page.status]
                  const isSelected = selected.has(page.id)
                  return (
                    <TableRow
                      key={page.id}
                      data-state={isSelected ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(page.id)}
                          aria-label={`Select ${page.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => handleTitleClick(page, e)}
                          className="text-start outline-none transition-colors hover:text-primary focus-visible:text-primary"
                        >
                          <span className="font-medium">{page.title}</span>
                          {page.isFrontPage ? (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="ms-2 align-middle"
                            >
                              Front page
                            </Badge>
                          ) : null}
                          <span className="block text-xs text-muted-foreground">
                            {page.slug}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {page.author}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {page.modified}
                      </TableCell>
                      <TableCell>
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Actions for ${page.title}`}
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <MenuPopup align="end">
                            <MenuItem onClick={() => openInEditor(page)}>
                              Edit
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                openInEditor(page, { pinned: true })
                              }
                            >
                              Open in new workspace
                            </MenuItem>
                            <MenuItem disabled>View</MenuItem>
                            <MenuSeparator />
                            <MenuItem variant="destructive" disabled>
                              Trash
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No pages match this view.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </ContextLayout.Main>
    </ContextLayout>
  )
}

export const PAGES_DATA = PAGES
