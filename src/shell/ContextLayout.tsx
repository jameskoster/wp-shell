import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

type LayoutCtx = {
  /**
   * True when a `<ContextSubnav>` is mounted somewhere inside this
   * layout. Drives whether `<ContextHeader>` renders the mobile
   * hamburger that opens the drawer. The flag is registration-based
   * (subnav calls `registerSidebar()` from a `useEffect`) so workspaces
   * don't have to wire anything up explicitly.
   */
  hasSidebar: boolean
  registerSidebar: () => () => void
  drawerOpen: boolean
  toggleDrawer: () => void
  closeDrawer: () => void
}

const NOOP_LAYOUT: LayoutCtx = {
  hasSidebar: false,
  registerSidebar: () => () => {},
  drawerOpen: false,
  toggleDrawer: () => {},
  closeDrawer: () => {},
}

const Ctx = createContext<LayoutCtx | null>(null)

/**
 * Read the surrounding `<ContextLayout>`'s state. Returns a no-op
 * default when there's no provider, so primitives like
 * `<ContextHeader>` can be used standalone (e.g. inside the Editor,
 * which owns its own chrome and doesn't compose with `<ContextLayout>`).
 */
export function useContextLayout(): LayoutCtx {
  return useContext(Ctx) ?? NOOP_LAYOUT
}

type ContextLayoutProps = {
  children: ReactNode
  className?: string
}

export function ContextLayout({ children, className }: ContextLayoutProps) {
  const [sidebarCount, setSidebarCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const registerSidebar = useCallback(() => {
    setSidebarCount((n) => n + 1)
    return () => setSidebarCount((n) => Math.max(0, n - 1))
  }, [])

  const value = useMemo<LayoutCtx>(
    () => ({
      hasSidebar: sidebarCount > 0,
      registerSidebar,
      drawerOpen,
      toggleDrawer: () => setDrawerOpen((v) => !v),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [sidebarCount, registerSidebar, drawerOpen]
  )

  return (
    <Ctx.Provider value={value}>
      <div className={cn("relative flex h-full min-h-0 flex-1", className)}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

function ContextLayoutMain({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative flex min-w-0 flex-1 flex-col", className)}>
      {children}
    </div>
  )
}

ContextLayout.Main = ContextLayoutMain
