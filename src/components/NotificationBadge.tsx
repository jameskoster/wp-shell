import type React from "react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Canonical "needs attention" badge used wherever the shell signals an
 * actionable count: the dock, launch tiles, and info-widget headers
 * all share this primitive so the visual stays consistent across
 * surfaces. Built on top of `Badge`'s `destructive` variant with a
 * fixed 11px tabular-nums type — the conventional iOS/macOS dot-pill
 * size, regardless of breakpoint.
 *
 * Numeric `0`, empty string, and `undefined` render nothing, so call
 * sites can pass raw counts without guarding.
 *
 * Positioning lives at the call site (e.g. absolute corner overlay on
 * dock buttons, inline next to the title in info widgets) — pass
 * those classes through `className`.
 */
export type NotificationBadgeProps = Omit<
  BadgeProps,
  "variant" | "size" | "children"
> & {
  count: number | string | undefined
}

export function NotificationBadge({
  count,
  className,
  ...props
}: NotificationBadgeProps): React.ReactElement | null {
  if (count === undefined || count === 0 || count === "") return null

  return (
    <Badge
      variant="destructive"
      className={cn("text-[11px] tabular-nums", className)}
      {...props}
    >
      {count}
    </Badge>
  )
}
