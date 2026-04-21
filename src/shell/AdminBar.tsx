import {
  Bell,
  ChevronDown,
  ExternalLink,
  FileText,
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
  useClosedRecents,
  useContexts,
  useOpenContexts,
} from "@/contexts/store"
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
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-card px-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          if (openCount >= 2) toggle("switcher")
          else goHome()
        }}
        aria-label={
          openCount >= 2
            ? `Open switcher · ${openCount} contexts`
            : "Return home"
        }
        className="relative"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M22 12C22 6.49 17.51 2 12 2C6.48 2 2 6.49 2 12C2 17.52 6.48 22 12 22C17.51 22 22 17.52 22 12ZM9.78 17.37L6.37 8.22C6.92 8.2 7.54 8.14 7.54 8.14C8.04 8.08 7.98 7.01 7.48 7.03C7.48 7.03 6.03 7.14 5.11 7.14C4.93 7.14 4.74 7.14 4.53 7.13C6.12 4.69 8.87 3.11 12 3.11C14.33 3.11 16.45 3.98 18.05 5.45C17.37 5.34 16.4 5.84 16.4 7.03C16.4 7.77 16.85 8.39 17.3 9.13C17.65 9.74 17.85 10.49 17.85 11.59C17.85 13.08 16.45 16.59 16.45 16.59L13.42 8.22C13.96 8.2 14.24 8.05 14.24 8.05C14.74 8 14.68 6.8 14.18 6.83C14.18 6.83 12.74 6.95 11.8 6.95C10.93 6.95 9.47 6.83 9.47 6.83C8.97 6.8 8.91 8.03 9.41 8.05L10.33 8.13L11.59 11.54L9.78 17.37ZM19.41 12C19.65 11.36 20.15 10.13 19.84 7.75C20.54 9.04 20.89 10.46 20.89 12C20.89 15.29 19.16 18.24 16.49 19.78C17.46 17.19 18.43 14.58 19.41 12ZM8.1 20.09C5.12 18.65 3.11 15.53 3.11 12C3.11 10.7 3.34 9.52 3.83 8.41C5.25 12.3 6.67 16.2 8.1 20.09ZM12.13 13.46L14.71 20.44C13.85 20.73 12.95 20.89 12 20.89C11.21 20.89 10.43 20.78 9.71 20.56C10.52 18.18 11.33 15.82 12.13 13.46Z"
            fill="currentColor"
          />
        </svg>
        {openCount >= 2 ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-card"
          />
        ) : null}
      </Button>

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
              In future slices it would summarize the active context, suggest
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
