import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useUI } from "./uiStore"
import { shortcutLabel } from "./useShortcuts"

export function ContextSwitcher() {
  const open = useUI((s) => s.overlay === "switcher")
  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-1000">
      <div className="pointer-events-auto rounded-full border bg-popover px-4 py-2 shadow-lg/5">
        <KbdGroup>
          <Kbd>{shortcutLabel("switcher")}</Kbd>
          <span className="text-xs text-muted-foreground">cycle</span>
          <Kbd>↵</Kbd>
          <span className="text-xs text-muted-foreground">select</span>
          <Kbd>Esc</Kbd>
          <span className="text-xs text-muted-foreground">close</span>
        </KbdGroup>
      </div>
    </div>
  )
}
