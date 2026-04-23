import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { iconFor } from "@/contexts/registry"
import type { Context, ContextRef } from "@/contexts/types"
import { usePlacement, type Placement } from "@/stores/placementStore"

export function ContextHeaderActions({ ctx }: { ctx: Context }) {
  const action: ContextRef = {
    type: ctx.type,
    params: ctx.params,
    title: ctx.title,
  }
  // Subscribe to a derived value so the radio re-renders when the
  // placement changes. Selecting `placementOf` directly returns the same
  // function reference every time and would skip the update.
  const placement = usePlacement((s) => s.placementOf(action))
  const setPlacement = usePlacement((s) => s.setPlacement)
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
        <MenuRadioGroup
          value={placement}
          onValueChange={(next) =>
            setPlacement(action, next as Placement, {
              title: ctx.title,
              icon,
            })
          }
        >
          <MenuRadioItem value="dashboard">Show on dashboard</MenuRadioItem>
          <MenuRadioItem value="dock">Show in dock</MenuRadioItem>
          <MenuRadioItem value="none">Don't show</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem disabled>Help</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
