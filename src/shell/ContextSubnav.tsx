import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useContextLayout } from "./ContextLayout"

type ContextSubnavProps = {
  children: ReactNode
  className?: string
}

const DRAWER_ID = "context-subnav-drawer"

export function ContextSubnav({
  children,
  className,
}: ContextSubnavProps) {
  const { registerSidebar, drawerOpen, closeDrawer } = useContextLayout()
  const asideRef = useRef<HTMLElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => registerSidebar(), [registerSidebar])

  // Drawer-open side effects: body scroll lock, Esc-to-close, focus
  // management. md+ ignores all of this since the rail is always
  // visible there — but the state is still set, so we gate on
  // `matchMedia` to avoid hijacking focus on desktop.
  useEffect(() => {
    if (typeof window === "undefined") return
    const isMobile = window.matchMedia("(max-width: 767px)").matches
    if (!drawerOpen || !isMobile) return

    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null
    const focusables = asideRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    focusables?.[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        closeDrawer()
      }
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [drawerOpen, closeDrawer])

  return (
    <>
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeDrawer}
          className="fixed inset-0 z-40 cursor-default bg-foreground/30 backdrop-blur-[1px] md:hidden"
        />
      ) : null}
      <aside
        ref={asideRef}
        id={DRAWER_ID}
        aria-label="Section navigation"
        aria-modal={drawerOpen ? "true" : undefined}
        role={drawerOpen ? "dialog" : undefined}
        // Two layouts in one element. md+: static rail in the flex row.
        // md-: fixed off-canvas drawer that translates in when
        // `drawerOpen` is set. Click-through on the drawer surface is
        // handled by the click-handler intercept on `<nav>` below.
        className={cn(
          "flex shrink-0 flex-col border-r bg-background",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-72",
          "max-md:transition-transform max-md:duration-200 max-md:ease-out",
          "max-md:-translate-x-full",
          drawerOpen && "max-md:translate-x-0 max-md:shadow-2xl",
          "md:relative md:w-56 md:translate-x-0 md:shadow-none md:bg-background/40",
          className
        )}
      >
        {/* Click intercept: any item-click inside the drawer closes it.
            Doesn't fire on desktop because the drawer state isn't open
            there. Cheap and avoids per-item wiring. */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-2"
          onClick={() => {
            if (drawerOpen) closeDrawer()
          }}
        >
          {children}
        </nav>
      </aside>
    </>
  )
}

function Group({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-3 last:mb-0", className)}>
      {label ? (
        <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
          {label}
        </div>
      ) : null}
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  )
}

type ItemProps = {
  active?: boolean
  icon?: LucideIcon
  count?: number | string
  onClick?: () => void
  children?: ReactNode
  title?: string
  className?: string
}

function Item({
  active,
  icon: Icon,
  count,
  onClick,
  children,
  title,
  className,
}: ItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={title}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none transition-colors",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground focus-visible:bg-accent/40",
          className
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "size-4 shrink-0",
              active ? "text-accent-foreground" : "text-muted-foreground"
            )}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {count !== undefined && count !== "" ? (
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 text-[11px] tabular-nums",
              active
                ? "bg-background/60 text-foreground"
                : "text-muted-foreground/80 group-hover:text-muted-foreground"
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
    </li>
  )
}

ContextSubnav.Group = Group
ContextSubnav.Item = Item
