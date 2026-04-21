import { useEffect } from "react"
import { AdminBar } from "./AdminBar"
import { CommandPalette } from "./CommandPalette"
import { ContextSwitcher } from "./ContextSwitcher"
import { ContextStage } from "./ContextStage"
import { useShortcuts } from "./useShortcuts"
import { useUI } from "./uiStore"
import {
  bindHashListener,
  useActiveContext,
  useContexts,
} from "@/contexts/store"

export function Shell() {
  useShortcuts()
  const hydrate = useContexts((s) => s.hydrateFromHash)
  const active = useActiveContext()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const goHome = useContexts((s) => s.goHome)
  const closeOverlay = useUI((s) => s.close)

  useEffect(() => {
    hydrate()
    return bindHashListener()
  }, [hydrate])

  useEffect(() => {
    document.title = active ? `${active.title} — WP Shell` : "Home — WP Shell"
  }, [active])

  return (
    <div className="flex h-svh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-popover focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-lg/5"
      >
        Skip to content
      </a>
      <div
        className="shrink-0"
        onClick={
          switcherOpen
            ? () => {
                goHome()
                closeOverlay()
              }
            : undefined
        }
        role={switcherOpen ? "button" : undefined}
        aria-label={switcherOpen ? "Return home" : undefined}
      >
        <div
          className={`motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-glide ${
            switcherOpen
              ? "pointer-events-none opacity-40 blur-sm"
              : "opacity-100 blur-0"
          }`}
          aria-hidden={switcherOpen}
          inert={switcherOpen}
        >
          <AdminBar />
        </div>
      </div>
      <main
        id="main"
        aria-label={active ? active.title : "Home"}
        className="relative flex flex-1 min-h-0 overflow-hidden"
      >
        <ContextStage />
      </main>
      <CommandPalette />
      <ContextSwitcher />
    </div>
  )
}
