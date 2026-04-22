import { MoreHorizontal } from "lucide-react"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu"
import { useDashboard } from "@/stores/dashboardStore"
import { cn } from "@/lib/utils"

type WidgetMenuProps = {
  widgetId: string
  className?: string
  /**
   * When true, the trigger stays visible at full opacity. By default the
   * trigger fades in on hover / focus to keep widgets visually quiet.
   */
  alwaysVisible?: boolean
}

export function WidgetMenu({
  widgetId,
  className,
  alwaysVisible = false,
}: WidgetMenuProps) {
  const removeWidget = useDashboard((s) => s.removeWidget)
  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Widget options"
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
        <MenuItem
          variant="destructive"
          onClick={() => removeWidget(widgetId)}
        >
          Remove
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}
