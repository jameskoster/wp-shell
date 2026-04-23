import { MoreHorizontal } from "lucide-react"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import type { ContextRef } from "@/contexts/types"
import { usePlacement } from "@/stores/placementStore"
import { cn } from "@/lib/utils"

type LaunchTileMenuProps = {
  action: ContextRef
  className?: string
  /**
   * When true, the trigger stays visible at full opacity. By default the
   * trigger fades in on hover / focus to keep tiles visually quiet.
   */
  alwaysVisible?: boolean
}

export function LaunchTileMenu({
  action,
  className,
  alwaysVisible = false,
}: LaunchTileMenuProps) {
  const setPlacement = usePlacement((s) => s.setPlacement)
  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Tile options"
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-[opacity,background-color] hover:bg-accent/60 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-[popup-open]:opacity-100 data-[popup-open]:bg-accent/60",
              alwaysVisible
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </button>
        }
      />
      <MenuPopup align="end" className="min-w-40">
        <MenuItem onClick={() => setPlacement(action, "dock")}>
          Move to dock
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          variant="destructive"
          onClick={() => setPlacement(action, "none")}
        >
          Remove
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}
