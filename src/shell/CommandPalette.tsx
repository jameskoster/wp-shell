import { Fragment } from "react"
import { Home as HomeIcon, SlidersHorizontal } from "lucide-react"
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Badge } from "@/components/ui/badge"
import { useUI } from "./uiStore"
import { useCustomize } from "./customizeStore"
import { goHomeFromActive } from "./goHomeFromActive"
import { useActiveContext, useClosedRecents, useContexts } from "@/contexts/store"
import { DESTINATIONS, metaFor } from "@/contexts/registry"
import type { ContextRef, Destination } from "@/contexts/types"
import { shortcutLabel } from "./useShortcuts"

type Row =
  | { kind: "home" }
  | { kind: "destination"; data: Destination }
  | { kind: "recent"; data: { ref: ContextRef; title: string } }
  | { kind: "action"; data: { id: string; title: string; onSelect: () => void } }

type Group = {
  value: string
  label: string
  items: Row[]
}

export function CommandPalette() {
  const open = useUI((s) => s.overlay === "palette")
  const close = useUI((s) => s.close)
  const openContext = useContexts((s) => s.open)
  const goHome = useContexts((s) => s.goHome)
  const recents = useClosedRecents()
  const setCustomizing = useCustomize((s) => s.setActive)
  const customizing = useCustomize((s) => s.active)
  const activeContext = useActiveContext()
  const dashboardActive = activeContext === null

  const groups: Group[] = []

  // Customize is always offered (except when already customizing). When
  // invoked from inside a context, the action implicitly closes that
  // context first — invoking "Customize Dashboard" from a context is a
  // statement of intent that we shouldn't make the user satisfy by
  // navigating home themselves.
  if (!customizing) {
    groups.push({
      value: "actions",
      label: "Actions",
      items: [
        {
          kind: "action" as const,
          data: {
            id: "customize-dashboard",
            title: "Customize Dashboard",
            onSelect: () => {
              if (!dashboardActive) goHomeFromActive(activeContext)
              setCustomizing(true)
              close()
            },
          },
        },
      ],
    })
  }

  if (recents.length > 0) {
    groups.push({
      value: "recent",
      label: "Recent",
      items: recents.map((r) => ({
        kind: "recent" as const,
        data: { ref: { type: r.type, params: r.params, title: r.title }, title: r.title },
      })),
    })
  }

  groups.push({
    value: "go-to",
    label: "Go to",
    items: [
      { kind: "home" as const },
      ...DESTINATIONS.map((d) => ({ kind: "destination" as const, data: d })),
    ],
  })

  function handleSelect(
    ref: ContextRef,
    e?: React.MouseEvent | React.KeyboardEvent,
  ) {
    const rect =
      e && "currentTarget" in e
        ? (e.currentTarget as HTMLElement).getBoundingClientRect()
        : null
    openContext(ref, rect)
    close()
  }

  function handleHome() {
    goHome()
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={(v) => (v ? null : close())}>
      <CommandDialogPopup>
        <Command items={groups}>
          <CommandInput placeholder="Search destinations, recents, or actions…" />
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandList>
            {(group: Group, index: number) => (
              <Fragment key={group.value}>
                <CommandGroup items={group.items}>
                  <CommandGroupLabel>{group.label}</CommandGroupLabel>
                  <CommandCollection>
                    {(row: Row) => {
                      if (row.kind === "home") {
                        return (
                          <CommandItem
                            key="home"
                            value="Dashboard Home"
                            onClick={handleHome}
                          >
                            <HomeIcon className="size-4 text-muted-foreground" />
                            <span>Dashboard</span>
                          </CommandItem>
                        )
                      }
                      if (row.kind === "destination") {
                        const d = row.data
                        const Icon = d.icon ?? metaFor(d.type).icon
                        return (
                          <CommandItem
                            key={d.id}
                            value={d.title}
                            onClick={(e) =>
                              handleSelect(
                                { type: d.type, params: d.params, title: d.title },
                                e,
                              )
                            }
                          >
                            <Icon className="size-4 text-muted-foreground" />
                            <span className="flex-1">{d.title}</span>
                            {d.badge ? (
                              <Badge variant="secondary" className="text-[11px]">
                                {d.badge}
                              </Badge>
                            ) : d.description ? (
                              <span className="text-xs text-muted-foreground/72">
                                {d.description}
                              </span>
                            ) : null}
                          </CommandItem>
                        )
                      }
                      if (row.kind === "action") {
                        return (
                          <CommandItem
                            key={row.data.id}
                            value={row.data.title}
                            onClick={() => row.data.onSelect()}
                          >
                            <SlidersHorizontal className="size-4 text-muted-foreground" />
                            <span>{row.data.title}</span>
                          </CommandItem>
                        )
                      }
                      const Icon = metaFor(row.data.ref.type).icon
                      return (
                        <CommandItem
                          key={`recent-${row.data.title}`}
                          value={row.data.title}
                          onClick={(e) => handleSelect(row.data.ref, e)}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          <span>{row.data.title}</span>
                          <span className="ms-auto text-xs text-muted-foreground/72">
                            Reopen
                          </span>
                        </CommandItem>
                      )
                    }}
                  </CommandCollection>
                </CommandGroup>
                {index < groups.length - 1 ? <CommandSeparator /> : null}
              </Fragment>
            )}
          </CommandList>
          <CommandFooter>
            <KbdGroup>
              <Kbd>↵</Kbd>
              <span>Open</span>
            </KbdGroup>
            <KbdGroup>
              <Kbd>{shortcutLabel("switcher")}</Kbd>
              <span>Switcher</span>
            </KbdGroup>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}
