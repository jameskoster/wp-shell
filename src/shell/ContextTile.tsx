import { useLayoutEffect, useState, type CSSProperties } from "react"
import { X } from "lucide-react"
import { ContextSurface } from "@/workflows"
import type { Context } from "@/contexts/types"
import type { Cell } from "./stageLayout"

type Props = {
  ctx: Context
  isActive: boolean
  switcherOpen: boolean
  cell: Cell | undefined
  instantTransform?: boolean
  // When `launchSeq` changes to a non-null value, the surface snaps to
  // `launchTransform` (no transition) and then on the next frame animates
  // back to its natural position — producing a "scale up from the launch
  // tile" effect. Re-applies for every launch event, so re-opening an
  // already-active context still pings.
  launchTransform?: string | null
  launchSeq?: number | null
  onSelect: () => void
  onClose: () => void
}

// Inactive contexts park here when the switcher is closed: off the left
// edge at slot scale, so opening the switcher slides them into their slots
// instead of fading them in.
const PARK_X = "-100vw"

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ContextTile({
  ctx,
  isActive,
  switcherOpen,
  cell,
  instantTransform = false,
  launchTransform = null,
  launchSeq = null,
  onSelect,
  onClose,
}: Props) {
  // Two-phase launch state:
  //   phase 1 (snapping=true, launchOverride=transform): surface jumps to
  //     the trigger rect with the transition disabled — no "rewind" animation
  //     from whatever pose it was in (identity, parked, or a switcher cell).
  //   phase 2 (snapping=false, launchOverride=null): transition re-enabled,
  //     transform reverts to its natural pose → CSS interpolates from launch
  //     rect → identity for the unfurl.
  const [launchOverride, setLaunchOverride] = useState<string | null>(null)
  const [snapping, setSnapping] = useState(false)

  useLayoutEffect(() => {
    if (launchSeq == null || !launchTransform) return
    if (prefersReducedMotion()) return
    setLaunchOverride(launchTransform)
    setSnapping(true)
    let r1 = 0
    let r2 = 0
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setSnapping(false)
        setLaunchOverride(null)
      })
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
    // launchTransform is intentionally NOT a dep — only re-run when a new
    // launch event fires (signaled by launchSeq changing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchSeq])

  // Surface transform — single source of truth for the tile's visual bounds.
  let surfaceTransform: string
  if (launchOverride) {
    surfaceTransform = launchOverride
  } else if (switcherOpen && cell) {
    surfaceTransform = `translate3d(${cell.x}px, ${cell.y}px, 0) scale(${cell.scale})`
  } else if (isActive) {
    surfaceTransform = "translate3d(0px, 0px, 0) scale(1)"
  } else if (cell) {
    surfaceTransform = `translate3d(${PARK_X}, ${cell.y}px, 0) scale(${cell.scale})`
  } else {
    surfaceTransform = `translate3d(${PARK_X}, 0px, 0) scale(1)`
  }

  // Chrome bounds animate to track the surface's visual bounds. With matching
  // duration + easing, the surface and chrome (close button, click target)
  // travel as one unit instead of the chrome appearing in place.
  let chromeStyle: Pick<CSSProperties, "top" | "left" | "width" | "height">
  if (switcherOpen && cell) {
    chromeStyle = { top: cell.y, left: cell.x, width: cell.w, height: cell.h }
  } else if (isActive) {
    chromeStyle = { top: 0, left: 0, width: "100%", height: "100%" }
  } else if (cell) {
    chromeStyle = { top: cell.y, left: PARK_X, width: cell.w, height: cell.h }
  } else {
    chromeStyle = { top: 0, left: PARK_X, width: "100%", height: "100%" }
  }

  const surfaceVisible = switcherOpen || isActive

  // Single transition spec used by both surface and chrome so they stay in
  // lock-step. Disabled during scroll (direct wheel input) and during the
  // launch snap (so the tile pops to the trigger rect without a rewind).
  const transitionClass =
    instantTransform || snapping
      ? ""
      : "motion-safe:transition-[transform,top,left,width,height,opacity,border-radius] motion-safe:duration-1000 motion-safe:ease-out"

  // The surface is `transform: scale()`d, which scales its border-radius
  // too. To make the visible corners match the chrome's 8px `rounded-lg`,
  // pre-divide by the cell scale (so 8/0.4 = 20px CSS → 8px visual). Square
  // only when an active tile fully covers the workspace at identity.
  const surfaceBorderRadius =
    !cell || (isActive && !switcherOpen) ? 0 : 8 / cell.scale

  return (
    <>
      <div
        className={`absolute inset-0 z-20 origin-top-left overflow-hidden bg-background shadow-2xl ${transitionClass}`}
        style={{
          transform: surfaceTransform,
          borderRadius: surfaceBorderRadius,
          pointerEvents: switcherOpen ? "none" : isActive ? "auto" : "none",
          willChange: "transform",
        }}
        aria-hidden={!surfaceVisible}
        inert={!surfaceVisible}
      >
        <div className="flex h-full w-full flex-col">
          <ContextSurface type={ctx.type} />
        </div>
      </div>

      <div
        className={`absolute z-30 ${transitionClass}`}
        style={{
          ...chromeStyle,
          opacity: switcherOpen ? 1 : 0,
          pointerEvents: switcherOpen ? "auto" : "none",
        }}
        aria-hidden={!switcherOpen}
      >
        <button
          type="button"
          data-context-tile-button
          onClick={onSelect}
          aria-label={`Switch to ${ctx.title}`}
          aria-current={isActive ? "true" : undefined}
          tabIndex={switcherOpen ? 0 : -1}
          className="group absolute inset-0 rounded-lg outline-none ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          tabIndex={switcherOpen ? 0 : -1}
          className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-popover/90 text-muted-foreground shadow-xs/5 backdrop-blur-sm transition-colors hover:bg-popover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Close ${ctx.title}`}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  )
}
