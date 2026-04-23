"use client"

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import type * as React from "react"
import { MenuPopup } from "@/components/ui/menu"

/**
 * Right-click / long-press menu. Base UI ships dedicated `Root` and
 * `Trigger` parts for context menus; the rest of the surface (popup,
 * items, separators, etc.) is shared with the regular `Menu` so we can
 * reuse the styled wrappers in `@/components/ui/menu`.
 */

export const ContextMenu: typeof ContextMenuPrimitive.Root =
  ContextMenuPrimitive.Root

export const ContextMenuPortal: typeof ContextMenuPrimitive.Portal =
  ContextMenuPrimitive.Portal

export function ContextMenuTrigger({
  className,
  children,
  ...props
}: ContextMenuPrimitive.Trigger.Props): React.ReactElement {
  return (
    <ContextMenuPrimitive.Trigger
      className={className}
      data-slot="context-menu-trigger"
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  )
}

// `MenuPopup` already renders a `Positioner` + `Popup` pair and wires up
// `align`, `side`, etc. Base UI's context-menu reuses Menu's positioner,
// so we just hand off to the existing wrapper.
export const ContextMenuPopup = MenuPopup
