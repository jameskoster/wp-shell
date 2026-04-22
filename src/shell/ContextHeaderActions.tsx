import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { iconFor } from "@/contexts/registry"
import type { Context, ContextRef } from "@/contexts/types"
import { useDashboard } from "@/stores/dashboardStore"

export function ContextHeaderActions({ ctx }: { ctx: Context }) {
  const action: ContextRef = {
    type: ctx.type,
    params: ctx.params,
    title: ctx.title,
  }
  // Subscribe to a derived boolean so the checkbox re-renders when the
  // tile is added or removed. Selecting `hasTile` directly returns the
  // same function reference every time and would skip the update.
  const exists = useDashboard((s) => s.hasTile(action))
  const addTile = useDashboard((s) => s.addTile)
  const removeTile = useDashboard((s) => s.removeTile)
  const icon = ctx.icon ?? iconFor(action)
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Context actions"
          >
            <MoreHorizontal />
          </Button>
        }
      />
      <MenuPopup align="end">
        <MenuCheckboxItem
          checked={exists}
          onCheckedChange={(next) => {
            if (next) addTile({ action, title: ctx.title, icon })
            else removeTile(action)
          }}
        >
          Show on dashboard
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuItem disabled>Help</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
