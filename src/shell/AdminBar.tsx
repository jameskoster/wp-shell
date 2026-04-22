import {
  Bell,
  ChevronDown,
  ExternalLink,
  FileText,
  Layers,
  PackagePlus,
  Search,
  Sparkles,
  PenSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useUI } from "./uiStore"
import {
  useActiveContext,
  useClosedRecents,
  useContexts,
  useOpenContexts,
} from "@/contexts/store"
import { refKey } from "@/contexts/url"
import { NOTIFICATIONS } from "@/mocks/notifications"
import { USER } from "@/mocks/user"
import { OTHER_SITES, SITE } from "@/mocks/site"
import { shortcutLabel } from "./useShortcuts"

export function AdminBar() {
  const toggle = useUI((s) => s.toggle)
  const openContext = useContexts((s) => s.open)
  const goHome = useContexts((s) => s.goHome)
  const closedRecents = useClosedRecents()
  const openCount = useOpenContexts().length
  const active = useActiveContext()
  const dashboardActive = active === null
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length

  /**
   * If the active context maps to a dashboard launch tile, resolve its
   * rect so the surface can play the reverse-launch animation back into
   * the tile. Falls back to no rect (instant home) for contexts with no
   * launch tile, or when the dashboard isn't currently in the DOM at the
   * size we expect.
   */
  const handleGoHome = () => {
    if (!active) {
      goHome()
      return
    }
    const key = refKey({ type: active.type, params: active.params })
    const el =
      typeof document !== "undefined"
        ? document.querySelector<HTMLElement>(`[data-launch-key="${key}"]`)
        : null
    const rect = el?.getBoundingClientRect()
    goHome(rect && rect.width > 0 && rect.height > 0 ? rect : null)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-card px-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleGoHome}
              aria-label="Go to Dashboard"
              aria-current={dashboardActive ? "page" : undefined}
              className={
                dashboardActive ? "bg-accent text-accent-foreground" : undefined
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <g clipPath="url(#clip0_56_522)">
                  <path
                    d="M24 12C24 5.388 18.612 0 12 0C5.376 0 0 5.388 0 12C0 18.624 5.376 24 12 24C18.612 24 24 18.624 24 12ZM9.336 18.444L5.244 7.464C5.904 7.44 6.648 7.368 6.648 7.368C7.248 7.296 7.176 6.012 6.576 6.036C6.576 6.036 4.836 6.168 3.732 6.168C3.516 6.168 3.288 6.168 3.036 6.156C4.944 3.228 8.244 1.332 12 1.332C14.796 1.332 17.34 2.376 19.26 4.14C18.444 4.008 17.28 4.608 17.28 6.036C17.28 6.924 17.82 7.668 18.36 8.556C18.78 9.288 19.02 10.188 19.02 11.508C19.02 13.296 17.34 17.508 17.34 17.508L13.704 7.464C14.352 7.44 14.688 7.26 14.688 7.26C15.288 7.2 15.216 5.76 14.616 5.796C14.616 5.796 12.888 5.94 11.76 5.94C10.716 5.94 8.964 5.796 8.964 5.796C8.364 5.76 8.292 7.236 8.892 7.26L9.996 7.356L11.508 11.448L9.336 18.444ZM20.892 12C21.18 11.232 21.78 9.756 21.408 6.9C22.248 8.448 22.668 10.152 22.668 12C22.668 15.948 20.592 19.488 17.388 21.336C18.552 18.228 19.716 15.096 20.892 12ZM7.32 21.708C3.744 19.98 1.332 16.236 1.332 12C1.332 10.44 1.608 9.024 2.196 7.692C3.9 12.36 5.604 17.04 7.32 21.708ZM12.156 13.752L15.252 22.128C14.22 22.476 13.14 22.668 12 22.668C11.052 22.668 10.116 22.536 9.252 22.272C10.224 19.416 11.196 16.584 12.156 13.752Z"
                    fill="currentColor"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_56_522">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </Button>
          }
        />
        <TooltipPopup side="bottom" sideOffset={6}>
          Dashboard
        </TooltipPopup>
      </Tooltip>

      {openCount >= 2 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => toggle("switcher")}
                aria-label={`Workspaces · ${openCount} open`}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300"
              >
                <Layers />
              </Button>
            }
          />
          <TooltipPopup side="bottom" sideOffset={6}>
            Workspaces
          </TooltipPopup>
        </Tooltip>
      ) : null}

      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 ps-1.5"
              aria-label={`Site menu for ${SITE.name}`}
            >
              <span
                aria-hidden
                className={`grid size-5 place-items-center rounded-full text-[10px] font-semibold ${SITE.iconClass}`}
              >
                {SITE.initial}
              </span>
              <span className="hidden max-w-40 truncate font-medium sm:inline">
                {SITE.name}
              </span>
              <ChevronDown className="size-3.5 opacity-72" />
            </Button>
          }
        />
        <MenuPopup align="start" className="min-w-56">
          <MenuItem
            onClick={() => window.open(SITE.url, "_blank", "noreferrer")}
          >
            <span className="flex-1">View site</span>
            <ExternalLink className="size-3.5 opacity-72" />
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger>Add</MenuSubTrigger>
            <MenuSubPopup className="min-w-44">
              <MenuItem
                onClick={(e) =>
                  openContext(
                    { type: "add-product" },
                    e.currentTarget.getBoundingClientRect(),
                  )
                }
              >
                <PackagePlus />
                <span>Product</span>
              </MenuItem>
              <MenuItem
                onClick={(e) =>
                  openContext(
                    { type: "editor", params: { kind: "page", id: "new" } },
                    e.currentTarget.getBoundingClientRect(),
                  )
                }
              >
                <FileText />
                <span>Page</span>
              </MenuItem>
              <MenuItem
                onClick={(e) =>
                  openContext(
                    { type: "editor", params: { kind: "post", id: "new" } },
                    e.currentTarget.getBoundingClientRect(),
                  )
                }
              >
                <PenSquare />
                <span>Post</span>
              </MenuItem>
            </MenuSubPopup>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger>Recent items</MenuSubTrigger>
            <MenuSubPopup className="min-w-56">
              {closedRecents.length === 0 ? (
                <MenuItem disabled>
                  <span className="text-xs text-muted-foreground">
                    Nothing recent yet
                  </span>
                </MenuItem>
              ) : (
                closedRecents.map((r, i) => (
                  <MenuItem
                    key={`${r.type}-${i}`}
                    onClick={(e) =>
                      openContext(
                        {
                          type: r.type,
                          params: r.params,
                          title: r.title,
                        },
                        e.currentTarget.getBoundingClientRect(),
                      )
                    }
                  >
                    <span className="truncate">{r.title}</span>
                  </MenuItem>
                ))
              )}
            </MenuSubPopup>
          </MenuSub>
          <MenuSeparator />
          <MenuItem
            onClick={(e) =>
              openContext(
                { type: "settings" },
                e.currentTarget.getBoundingClientRect(),
              )
            }
          >
            Site settings
          </MenuItem>
          <MenuItem disabled>Customize dashboard</MenuItem>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>WordPress</MenuSubTrigger>
            <MenuSubPopup className="min-w-48">
              <MenuItem disabled>About WordPress</MenuItem>
              <MenuItem disabled>Get Involved</MenuItem>
              <MenuSeparator />
              <MenuItem
                onClick={() =>
                  window.open("https://wordpress.org", "_blank", "noreferrer")
                }
              >
                WordPress.org
              </MenuItem>
              <MenuItem
                onClick={() =>
                  window.open(
                    "https://wordpress.org/documentation/",
                    "_blank",
                    "noreferrer",
                  )
                }
              >
                Documentation
              </MenuItem>
              <MenuItem
                onClick={() =>
                  window.open(
                    "https://learn.wordpress.org",
                    "_blank",
                    "noreferrer",
                  )
                }
              >
                Learn WordPress
              </MenuItem>
              <MenuItem
                onClick={() =>
                  window.open(
                    "https://wordpress.org/support/",
                    "_blank",
                    "noreferrer",
                  )
                }
              >
                Support
              </MenuItem>
              <MenuItem disabled>Feedback</MenuItem>
            </MenuSubPopup>
          </MenuSub>
          <MenuItem disabled>Help</MenuItem>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>Switch site</MenuSubTrigger>
            <MenuSubPopup className="min-w-56">
              {OTHER_SITES.map((s) => (
                <MenuItem key={s.id} disabled>
                  <span
                    aria-hidden
                    className={`grid size-5 place-items-center rounded-full text-[10px] font-semibold ${s.iconClass}`}
                  >
                    {s.initial}
                  </span>
                  <span className="truncate">{s.name}</span>
                </MenuItem>
              ))}
            </MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>

      <button
        type="button"
        onClick={() => toggle("palette")}
        aria-label="Search or jump to"
        className="group ms-1 inline-flex h-8 w-auto items-center gap-2 rounded-md border bg-background px-2 text-sm text-muted-foreground shadow-xs/5 transition-colors hover:bg-accent/50 sm:w-64 sm:px-2.5"
      >
        <Search className="size-4 opacity-80" />
        <span className="hidden flex-1 text-start sm:inline">
          Search or jump to…
        </span>
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>{shortcutLabel("palette")}</Kbd>
        </KbdGroup>
      </button>

      <div className="flex-1" />

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
              className="relative"
            >
              <Bell />
              {unreadCount > 0 ? (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-card"
                />
              ) : null}
            </Button>
          }
        />
        <PopoverPopup align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium">Notifications</span>
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          </div>
          <ul className="max-h-80 overflow-auto">
            {NOTIFICATIONS.map((n) => (
              <li
                key={n.id}
                className="border-b px-4 py-3 last:border-b-0 hover:bg-accent/40"
              >
                <div className="flex items-start gap-2">
                  {n.unread ? (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-transparent" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/72">
                      {n.time}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </PopoverPopup>
      </Popover>

      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="AI assistant">
              <Sparkles />
            </Button>
          }
        />
        <SheetPopup className="w-96">
          <SheetHeader>
            <SheetTitle>AI assistant</SheetTitle>
            <SheetDescription>
              Context-aware help, content generation, and task support.
              Placeholder in slice 1.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
            <Sparkles className="mb-3 size-6" />
            <p>The AI panel will live here.</p>
            <p className="mt-1 text-xs">
              In future slices it would summarize the active workspace, suggest
              actions, and help compose content.
            </p>
          </div>
          <div className="border-t px-6 py-3">
            <SheetClose
              render={<Button variant="outline" size="sm" className="w-full" />}
            >
              Close
            </SheetClose>
          </div>
        </SheetPopup>
      </Sheet>

      <div className="mx-1 h-5 w-px bg-border" aria-hidden />

      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              className="ms-1 inline-flex items-center gap-2 rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              aria-label="User menu"
            />
          }
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px]">
              {USER.initials}
            </AvatarFallback>
          </Avatar>
        </MenuTrigger>
        <MenuPopup align="end" className="min-w-56">
          <div className="px-2 py-2">
            <p className="text-sm font-medium">{USER.name}</p>
            <p className="text-xs text-muted-foreground">{USER.email}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/72">
              {USER.role}
            </p>
          </div>
          <MenuSeparator />
          <MenuItem
            onClick={(e) =>
              openContext(
                { type: "settings" },
                e.currentTarget.getBoundingClientRect(),
              )
            }
          >
            Settings
          </MenuItem>
          <MenuItem disabled>Sign out</MenuItem>
        </MenuPopup>
      </Menu>
    </header>
  )
}
