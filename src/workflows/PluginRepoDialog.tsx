import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { PLUGINS, type MockPlugin } from "@/mocks/plugins"
import { cn } from "@/lib/utils"

const CATEGORIES: ("All" | MockPlugin["category"])[] = [
  "All",
  "Analytics",
  "Productivity",
  "Communication",
  "Security",
]

/**
 * Mocked plugin repository surface, opened from the "Discover more
 * widgets…" item in the AddWidgetMenu. The Install button is a no-op
 * placeholder — we mark the row as "Installed" in local state so the
 * interaction loop reads end-to-end without backing services.
 */
export function PluginRepoDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All")
  const [installed, setInstalled] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLUGINS.filter((p) => {
      if (category !== "All" && p.category !== category) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  function install(id: string) {
    setInstalled((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Discover widgets</DialogTitle>
          <DialogDescription>
            Browse plugins from the WordPress widget directory. Installing a
            plugin makes its widgets available in the Add widgets menu.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plugins"
              className="h-9 w-full rounded-md border bg-input/32 pe-3 ps-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const isActive = c === category
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-popover text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
        <DialogPanel className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No plugins match {`"${query}"`}.
            </p>
          ) : (
            filtered.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                installed={installed.has(plugin.id)}
                onInstall={() => install(plugin.id)}
              />
            ))
          )}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}

function PluginCard({
  plugin,
  installed,
  onInstall,
}: {
  plugin: MockPlugin
  installed: boolean
  onInstall: () => void
}) {
  const Icon = plugin.icon
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-popover p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/40 text-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{plugin.name}</span>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {plugin.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {plugin.author} · {plugin.installs} installs
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{plugin.description}</p>
      <div className="mt-auto flex justify-end">
        <Button
          variant={installed ? "outline" : "secondary"}
          size="xs"
          onClick={onInstall}
          disabled={installed}
        >
          {installed ? "Installed" : "Install"}
        </Button>
      </div>
    </div>
  )
}
