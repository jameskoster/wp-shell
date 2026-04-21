import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

type LayoutCtx = {
  collapsed: boolean
  setCollapsed: (next: boolean) => void
  toggleCollapsed: () => void
}

const Ctx = createContext<LayoutCtx | null>(null)

export function useContextLayout(): LayoutCtx {
  const ctx = useContext(Ctx)
  if (!ctx)
    throw new Error("useContextLayout must be used inside <ContextLayout>")
  return ctx
}

type ContextLayoutProps = {
  children: ReactNode
  className?: string
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (next: boolean) => void
}

export function ContextLayout({
  children,
  className,
  defaultCollapsed = false,
  collapsed: controlled,
  onCollapsedChange,
}: ContextLayoutProps) {
  const [internal, setInternal] = useState(defaultCollapsed)
  const isControlled = controlled !== undefined
  const collapsed = isControlled ? (controlled as boolean) : internal
  const value = useMemo<LayoutCtx>(
    () => ({
      collapsed,
      setCollapsed: (next) => {
        if (!isControlled) setInternal(next)
        onCollapsedChange?.(next)
      },
      toggleCollapsed: () => {
        const next = !collapsed
        if (!isControlled) setInternal(next)
        onCollapsedChange?.(next)
      },
    }),
    [collapsed, isControlled, onCollapsedChange]
  )
  return (
    <Ctx.Provider value={value}>
      <div className={cn("flex h-full min-h-0 flex-1", className)}>
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
