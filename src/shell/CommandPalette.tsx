import { Fragment } from "react"
import { Home as HomeIcon } from "lucide-react"
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
import { useUI } from "./uiStore"
import { useClosedRecents, useContexts } from "@/contexts/store"
import { DESTINATIONS, metaFor } from "@/contexts/registry"
import type { ContextRef, Destination } from "@/contexts/types"
import { shortcutLabel } from "./useShortcuts"

type Row =
  | { kind: "home" }
  | { kind: "destination"; data: Destination }
  | { kind: "recent"; data: { ref: ContextRef; title: string } }

type Group = {
  value: string
  label: string
  rows: Row[]
}

export function CommandPalette() {
  const open = useUI((s) => s.overlay === "palette")
  const close = useUI((s) => s.close)
  const openContext = useContexts((s) => s.open)
  const goHome = useContexts((s) => s.goHome)
  const recents = useClosedRecents()

  const groups: Group[] = []

  if (recents.length > 0) {
    groups.push({
      value: "recent",
      label: "Recent",
      rows: recents.map((r) => ({
        kind: "recent" as const,
        data: { ref: { type: r.type, params: r.params, title: r.title }, title: r.title },
      })),
    })
  }

  groups.push({
    value: "go-to",
    label: "Go to",
    rows: [
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
                <CommandGroup items={group.rows}>
                  <CommandGroupLabel>{group.label}</CommandGroupLabel>
                  <CommandCollection>
                    {(row: Row) => {
                      if (row.kind === "home") {
                        return (
                          <CommandItem
                            key="home"
                            value="Home Dashboard"
                            onClick={handleHome}
                          >
                            <HomeIcon className="size-4 text-muted-foreground" />
                            <span>Home</span>
                            <span className="ms-auto text-xs text-muted-foreground/72">
                              Your dashboard
                            </span>
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
                            <span>{d.title}</span>
                            {d.description ? (
                              <span className="ms-auto text-xs text-muted-foreground/72">
                                {d.description}
                              </span>
                            ) : null}
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
