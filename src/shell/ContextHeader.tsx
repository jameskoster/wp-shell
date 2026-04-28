import type { ReactNode, MouseEvent as ReactMouseEvent } from "react"
import { Menu as MenuIcon } from "lucide-react"
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
import { useContextLayout } from "./ContextLayout"

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
   * Optional horizontal navigation rendered as a second row of the
   * header (typically a `<ContextHeaderTabs>`). Workspaces drop this
   * during drilldown to make the horizontal nav disappear.
   */
  tabs?: ReactNode
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
 *     <ContextHeader.Title subtitle={`${count} pages`}>
 *       Pages
 *     </ContextHeader.Title>
 *   </ContextHeader>
 *
 * Mobile: when the workspace has a `<ContextSubnav>` inside the same
 * `<ContextLayout>`, a hamburger leading-button is rendered below `md`
 * that opens the sidebar drawer. Workspaces don't pass anything new
 * for this — it's wired up via the layout context.
 *
 * For breadcrumb-style titles (e.g. Editor, or Settings → Zones →
 * Zone name), use `<ContextHeader.Breadcrumb parents={…} current={…} />`
 * as the child instead of `<ContextHeader.Title>`.
 */
export function ContextHeader({
  ctx,
  className,
  actions,
  tabs,
  children,
}: ContextHeaderProps) {
  const { hasSidebar, drawerOpen, toggleDrawer } = useContextLayout()
  return (
    <header className={cn("border-b", className)}>
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {hasSidebar ? (
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="context-subnav-drawer"
              className="-ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:bg-accent/50 md:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          ) : null}
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {ctx ? <ContextHeaderActions ctx={ctx} /> : null}
        </div>
      </div>
      {tabs ? (
        <div className="overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs}
        </div>
      ) : null}
    </header>
  )
}

type TitleProps = {
  subtitle?: ReactNode
  badges?: ReactNode
  children: ReactNode
}

function ContextHeaderTitle({ subtitle, badges, children }: TitleProps) {
  return (
    <>
      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-semibold">{children}</h1>
        {subtitle ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
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
  /**
   * Optional description rendered beneath the breadcrumb row, mirroring
   * `<ContextHeader.Title>`'s `subtitle`. Use this in drilldown views
   * to give the deeper context a different description without losing
   * the breadcrumb hierarchy.
   */
  subtitle?: ReactNode
  badges?: ReactNode
}

function ContextHeaderBreadcrumb({
  parents,
  current,
  subtitle,
  badges,
}: BreadcrumbProps) {
  const crumbs = parents == null ? [] : Array.isArray(parents) ? parents : [parents]
  return (
    <>
      <div className="min-w-0">
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
        {subtitle ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {badges ? <div className="flex shrink-0 items-center gap-2">{badges}</div> : null}
    </>
  )
}
ContextHeaderBreadcrumb.displayName = "ContextHeader.Breadcrumb"

ContextHeader.Title = ContextHeaderTitle
ContextHeader.Breadcrumb = ContextHeaderBreadcrumb
