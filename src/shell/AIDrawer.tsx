import { ArrowUp, Sparkles, X } from "lucide-react"
import {
  useEffect,
  useLayoutEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useUI } from "./uiStore"

const DRAWER_WIDTH_PX = 384
const DRAWER_WIDTH_VAR = "--ai-drawer-width"

/**
 * Shared body for both the desktop aside and the mobile bottom sheet.
 * Keeping the visible content identical makes the breakpoint hop a
 * cosmetic change rather than a content one.
 */
function AIDrawerContent() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
      <Sparkles className="mb-3 size-6" />
      <p>The AI panel will live here.</p>
    </div>
  )
}

/**
 * Chat composer pinned to the bottom of the drawer. Submission is a
 * no-op for the prototype: pressing Enter (or the send button) just
 * clears the field — there's no model wired up behind it yet, the goal
 * is to convey the eventual interaction shape.
 *
 * Keyboard contract mirrors common chat UIs: Enter submits, Shift+Enter
 * inserts a newline. `requestSubmit` is used so the form's submit
 * handler runs (rather than calling the clear logic twice from both
 * keydown and submit).
 */
function ChatComposer() {
  const [value, setValue] = useState("")
  const canSend = value.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSend) return
    setValue("")
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      <InputGroup>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the assistant..."
          aria-label="Message AI assistant"
          size="sm"
        />
        <InputGroupAddon align="block-end">
          <Button
            type="submit"
            size="icon-sm"
            disabled={!canSend}
            aria-label="Send message"
            className="ml-auto"
          >
            <ArrowUp />
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

/**
 * Desktop branch: a non-modal aside that lives inside the shell flex
 * row, pushing the workspace stage inward when open. Width animates
 * between 0 and 384px while the inner content stays at fixed 24rem so
 * text doesn't reflow during the transition.
 */
function DesktopDrawer() {
  const open = useUI((s) => s.aiOpen)
  const closeAI = useUI((s) => s.closeAI)
  // The drawer is normally a peer surface, but while the workspace
  // switcher is up the whole shell is in a "pick something" posture —
  // dim and inert it alongside the admin bar and dock so the switcher
  // reads as covering the full viewport. Same treatment as Dock.tsx.
  const switcherOpen = useUI((s) => s.overlay === "switcher")

  // Publish drawer width as a CSS variable on the document root. Mirrors
  // the dock-inset pattern in `Dock.tsx` so any consumer (currently the
  // right-center dock) can offset itself without importing this store.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.setProperty(
      DRAWER_WIDTH_VAR,
      open ? `${DRAWER_WIDTH_PX}px` : "0px",
    )
    return () => {
      root.style.setProperty(DRAWER_WIDTH_VAR, "0px")
    }
  }, [open])

  const dimmed = switcherOpen
  const interactable = open && !dimmed
  return (
    <aside
      aria-label="AI assistant"
      aria-hidden={!interactable}
      inert={!interactable}
      className={cn(
        "relative shrink-0 overflow-hidden border-l bg-popover motion-safe:transition-[width,opacity,filter] motion-safe:duration-300 motion-safe:ease-glide",
        open ? "w-96" : "w-0",
        dimmed ? "pointer-events-none opacity-40 blur-sm" : "opacity-100 blur-0",
      )}
    >
      <div className="flex h-full w-96 flex-col">
        <header className="flex items-start justify-between gap-4 p-6 pb-3">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-xl font-semibold leading-none">
              AI assistant
            </h2>
            <p className="text-sm text-muted-foreground">
              Context-aware help, content generation, and task support.
              Placeholder in slice 1.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close AI assistant"
            onClick={closeAI}
            className="-mr-2 -mt-1"
          >
            <X />
          </Button>
        </header>
        <AIDrawerContent />
        <ChatComposer />
      </div>
    </aside>
  )
}

/**
 * Mobile branch: a controlled modal sheet anchored to the bottom of the
 * viewport. At < 800px there's no room to keep the workspace usable
 * next to a 384px panel, so we fall back to the platform-conventional
 * transient sheet — same boolean drives both modes, so the AdminBar
 * trigger has a single behavior across breakpoints.
 */
function MobileDrawer() {
  const open = useUI((s) => s.aiOpen)
  const openAI = useUI((s) => s.openAI)
  const closeAI = useUI((s) => s.closeAI)

  // Mobile mode never insets the layout; keep the var pinned to 0 so a
  // dock that's been forced into a side position (e.g. mid-resize from
  // desktop) doesn't end up offset against a phantom drawer.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.setProperty(DRAWER_WIDTH_VAR, "0px")
    return () => {
      root.style.setProperty(DRAWER_WIDTH_VAR, "0px")
    }
  }, [])

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) openAI()
        else closeAI()
      }}
    >
      <SheetPopup side="bottom">
        <SheetHeader>
          <SheetTitle>AI assistant</SheetTitle>
          <SheetDescription>
            Context-aware help, content generation, and task support.
            Placeholder in slice 1.
          </SheetDescription>
        </SheetHeader>
        <AIDrawerContent />
        <ChatComposer />
      </SheetPopup>
    </Sheet>
  )
}

/**
 * Reset the published drawer width on unmount as a safety net (e.g.
 * dev hot-reload swaps the component out without running the inner
 * branch's cleanup).
 */
function useDrawerVarReset() {
  useEffect(
    () => () => {
      document.documentElement.style.setProperty(DRAWER_WIDTH_VAR, "0px")
    },
    [],
  )
}

export function AIDrawer() {
  const isMobile = useIsMobile()
  useDrawerVarReset()
  return isMobile ? <MobileDrawer /> : <DesktopDrawer />
}
