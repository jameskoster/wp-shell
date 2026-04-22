import type { ReactNode, MouseEvent as ReactMouseEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { Context } from "@/contexts/types"
import { cn } from "@/lib/utils"
import { ContextHeaderActions } from "./ContextHeaderActions"

type ContextHeaderProps = {
  ctx?: Context
  className?: string
  /**
   * Workflow-specific actions. Rendered in the right-hand cluster
   * immediately to the left of the always-on `ContextHeaderActions`
   * overflow menu, so the primary action always sits next to the
   * `…` button rather than the title.
   */
  actions?: ReactNode
  /**
   * Title content — typically `<ContextHeader.Title>` or
   * `<ContextHeader.Breadcrumb>`.
   */
  children?: ReactNode
}

/**
 * Shared header for every context surface.
 *
 * Owns the bordered bar, padding, layout, and the always-rendered
 * `ContextHeaderActions` overflow menu so individual workflows can't
 * forget it or drift on spacing.
 *
 *   <ContextHeader
 *     ctx={ctx}
 *     actions={<Button size="sm">Add new</Button>}
 *   >
 *     <ContextHeader.Title icon={FileText} subtitle={`${count} pages`}>
 *       Pages
 *     </ContextHeader.Title>
 *   </ContextHeader>
 *
 * For breadcrumb-style titles (e.g. Editor, or Orders → Order #123),
 * use `<ContextHeader.Breadcrumb parents={…} current={…} />` as the
 * child instead of `<ContextHeader.Title>`.
 */
export function ContextHeader({
  ctx,
  className,
  actions,
  children,
}: ContextHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b px-6 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {ctx ? <ContextHeaderActions ctx={ctx} /> : null}
      </div>
    </header>
  )
}

type TitleProps = {
  icon?: LucideIcon
  subtitle?: ReactNode
  badges?: ReactNode
  children: ReactNode
}

function ContextHeaderTitle({ icon: Icon, subtitle, badges, children }: TitleProps) {
  return (
    <>
      {Icon ? <Icon className="size-5 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-semibold">{children}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {badges ? <div className="flex shrink-0 items-center gap-2">{badges}</div> : null}
    </>
  )
}
ContextHeaderTitle.displayName = "ContextHeader.Title"

export type BreadcrumbCrumb = {
  label: string
  /**
   * Click handler for this crumb. Omit to render a non-interactive
   * label (e.g. for an unreachable ancestor). Receives the event so
   * callers that need launch/loop choreography can grab the bounding
   * rect from `event.currentTarget`.
   */
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void
}

type BreadcrumbProps = {
  /**
   * Ancestor crumbs in document order (root first, immediate parent
   * last). Most cases are a single parent; arrays leave room for
   * deeper hierarchies (e.g. Settings → General → Email) without an
   * API change.
   *
   * The breadcrumb component itself is navigation-agnostic — it just
   * renders crumbs and fires `onClick`. Callers wire the behaviour
   * they need: `swapTo(ref, rect)` for the editor's manage ↔ detail
   * loop, plain in-context state changes for sub-views like
   * Orders → Order #123, etc.
   */
  parents?: BreadcrumbCrumb | BreadcrumbCrumb[] | null
  current: ReactNode
  badges?: ReactNode
}

function ContextHeaderBreadcrumb({ parents, current, badges }: BreadcrumbProps) {
  const crumbs = parents == null ? [] : Array.isArray(parents) ? parents : [parents]
  return (
    <>
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap text-base sm:text-base">
          {crumbs.map((crumb, i) => (
            // Position is the only meaningful identity for ancestor
            // crumbs in this list — labels can repeat ("Settings" >
            // "Settings") and they're never reordered.
            // eslint-disable-next-line react/no-array-index-key
            <span key={i} className="contents">
              <BreadcrumbItem>
                {crumb.onClick ? (
                  <BreadcrumbLink
                    render={
                      <button
                        type="button"
                        onClick={crumb.onClick}
                        className="font-heading text-lg font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                      />
                    }
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="font-heading text-lg font-medium text-muted-foreground">
                    {crumb.label}
                  </span>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground/60" />
            </span>
          ))}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage
              className="min-w-0 truncate font-heading text-lg font-semibold"
              title={typeof current === "string" ? current : undefined}
            >
              {current}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {badges ? <div className="flex shrink-0 items-center gap-2">{badges}</div> : null}
    </>
  )
}
ContextHeaderBreadcrumb.displayName = "ContextHeader.Breadcrumb"

ContextHeader.Title = ContextHeaderTitle
ContextHeader.Breadcrumb = ContextHeaderBreadcrumb
