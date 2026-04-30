import { useState } from "react"
import { MoreHorizontal, Settings } from "lucide-react"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { usePlacement } from "@/stores/placementStore"
import { cn } from "@/lib/utils"

type WidgetMenuProps = {
  widgetId: string
  className?: string
  /**
   * When true, the trigger stays visible at full opacity. By default the
   * trigger fades in on hover / focus to keep widgets visually quiet.
   */
  alwaysVisible?: boolean
  /**
   * Show a "Settings" item that opens a per-widget settings dialog. The
   * dialog body is intentionally left as a placeholder for now — the
   * point is to demonstrate where individual widget settings would live.
   * Pass `widgetTitle` to label the dialog with the widget's name.
   */
  showSettings?: boolean
  widgetTitle?: string
}

export function WidgetMenu({
  widgetId,
  className,
  alwaysVisible = false,
  showSettings = false,
  widgetTitle,
}: WidgetMenuProps) {
  const removeWidget = usePlacement((s) => s.removeWidget)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
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
          {showSettings ? (
            <>
              <MenuItem onClick={() => setSettingsOpen(true)}>
                <Settings />
                Settings
              </MenuItem>
              <MenuSeparator />
            </>
          ) : null}
          <MenuItem
            variant="destructive"
            onClick={() => removeWidget(widgetId)}
          >
            Remove
          </MenuItem>
        </MenuPopup>
      </Menu>
      {showSettings ? (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>
                {widgetTitle ? `${widgetTitle} settings` : "Widget settings"}
              </DialogTitle>
              <DialogDescription>
                Configure how this widget behaves on the dashboard. Per-widget
                options will live here — date ranges, comparison windows,
                visible metrics, and so on.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel>
              <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No settings yet — this dialog is a placeholder.
              </div>
            </DialogPanel>
          </DialogPopup>
        </Dialog>
      ) : null}
    </>
  )
}
