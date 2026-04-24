import { useEffect, type MouseEvent } from "react"
import { AdminBar } from "./AdminBar"
import { CommandPalette } from "./CommandPalette"
import { ContextSwitcher } from "./ContextSwitcher"
import { ContextStage } from "./ContextStage"
import { CustomizeDnd } from "./CustomizeDnd"
import { Dock } from "./Dock"
import { useCanCustomize, useCustomize } from "./customizeStore"
import { useShortcuts } from "./useShortcuts"
import { useUI } from "./uiStore"
import {
  bindHashListener,
  useActiveContext,
  useContexts,
} from "@/contexts/store"
import { CustomizeBar } from "@/workflows/CustomizeBar"

export function Shell() {
  useShortcuts()
  const hydrate = useContexts((s) => s.hydrateFromHash)
  const active = useActiveContext()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const goHome = useContexts((s) => s.goHome)
  const closeOverlay = useUI((s) => s.close)
  const customizing = useCustomize((s) => s.active)
  const setCustomizing = useCustomize((s) => s.setActive)
  const canCustomize = useCanCustomize()

  useEffect(() => {
    hydrate()
    return bindHashListener()
  }, [hydrate])

  // Auto-exit customize if the viewport shrinks below the supported
  // breakpoint (e.g. user resized the window or rotated a tablet).
  // Same idea as the existing context-switch / overlay auto-exit a few
  // lines down: customize mode is an editing posture that only makes
  // sense at widths the free-form grid is designed for.
  useEffect(() => {
    if (customizing && !canCustomize) setCustomizing(false)
  }, [customizing, canCustomize, setCustomizing])

  useEffect(() => {
    document.title = active
      ? `${active.title} — WP Shell`
      : "Dashboard — WP Shell"
  }, [active])

  // Customize mode is a property of the Dashboard surface. If the user
  // navigates into any other context (via palette, hash, etc.) or opens
  // the workspace switcher, exit customize mode automatically so the
  // shell isn't half-locked into an editing posture that no longer
  // applies to what's on screen.
  useEffect(() => {
    if (customizing && (active || switcherOpen)) setCustomizing(false)
  }, [active, switcherOpen, customizing, setCustomizing])

  // Esc exits customize mode. Bound at the shell so it works everywhere
  // — including from inside a focused widget — without needing the
  // CustomizeBar to be focused.
  useEffect(() => {
    if (!customizing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      // Don't fight overlays (palette / switcher) — those have their own
      // Esc handlers in `useShortcuts`. Only intercept when no overlay
      // is open.
      if (useUI.getState().overlay) return
      e.preventDefault()
      setCustomizing(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [customizing, setCustomizing])

  // The AdminBar and Dock dim+inert in two different overlays:
  //   - the workspace switcher (existing behavior)
  //   - customize mode (new)
  // Click semantics on the dimmed bar:
  //   - switcher open → go home + close overlay
  //   - customize active → exit customize
  //   - both inactive → no click handler (chrome is interactive)
  //
  // IMPORTANT: React events bubble through the React tree, not the DOM
  // tree, so a click inside any portaled child of AdminBar (menu items,
  // popovers, sheets, etc.) will surface here as well. We must only
  // treat clicks landing *directly on the wrapper itself* as an exit
  // gesture — otherwise opening a menu and clicking an item that
  // changes shell state (e.g. "Customize Dashboard") would immediately
  // bubble back to this handler and undo the change.
  const dimmed = switcherOpen || customizing
  const handleDimmedClick = switcherOpen
    ? (e: MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return
        goHome()
        closeOverlay()
      }
    : customizing
      ? (e: MouseEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return
          setCustomizing(false)
        }
      : undefined

  return (
    <div className="flex h-svh flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-popover focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-lg/5"
      >
        Skip to content
      </a>
      {/*
        CustomizeDnd wraps the admin bar slot too, not just the dashboard
        + dock, because the CustomizeBar's "Drop here to remove" target
        registers a `useDroppable` and reads `useActiveDrag()` — both of
        which need a DndContext + DragInfoContext ancestor to function.
      */}
      <CustomizeDnd>
        <div
          className="relative shrink-0"
          onClick={handleDimmedClick}
          role={dimmed ? "button" : undefined}
          aria-label={
            switcherOpen
              ? "Go to Dashboard"
              : customizing
                ? "Exit customize mode"
                : undefined
          }
        >
          <div
            className={`motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-glide ${
              dimmed
                ? "pointer-events-none opacity-40 blur-sm"
                : "opacity-100 blur-0"
            }`}
            aria-hidden={dimmed}
            inert={dimmed}
          >
            <AdminBar />
          </div>
          {/*
            Customize toolbar overlays the admin bar slot so entering /
            exiting customize mode doesn't shift the page vertically.
            Mounted only while active so its sortable/droppable wiring
            isn't paying the cost when idle.
          */}
          {customizing ? (
            <div className="absolute inset-0 z-10">
              <CustomizeBar />
            </div>
          ) : null}
        </div>
        <main
          id="main"
          aria-label={active ? active.title : "Dashboard"}
          className="relative flex flex-1 min-h-0 overflow-hidden"
        >
          <ContextStage />
        </main>
        <Dock />
      </CustomizeDnd>
      <CommandPalette />
      <ContextSwitcher />
    </div>
  )
}
