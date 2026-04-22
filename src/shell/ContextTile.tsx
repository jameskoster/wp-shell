import { useLayoutEffect, useState } from "react"
import { X } from "lucide-react"
import { ContextSurface } from "@/workflows"
import type { Context } from "@/contexts/types"
import type { Cell } from "./stageLayout"

type Props = {
  ctx: Context
  isActive: boolean
  switcherOpen: boolean
  cell: Cell | undefined
  // Stage size in px — used to express "full screen" as numeric width/height
  // so the chrome can interpolate cleanly between full and cell sizes
  // (string "100%" → px doesn't always interpolate cleanly).
  stageW: number
  stageH: number
  instantTransform?: boolean
  // When `launchSeq` changes to a non-null value, the surface snaps to
  // `launchTransform` (no transition) and then on the next frame animates
  // back to its natural position — producing a "scale up from the launch
  // tile" effect. Re-applies for every launch event, so re-opening an
  // already-active context still pings.
  launchTransform?: string | null
  launchSeq?: number | null
  // Loop-swap participation — this tile is one of the two tiles in a
  // choreographed manage <-> editor swap. Runs in two sequential phases:
  //   'exit'  — from: identity → cell; to: snapped at cell (waiting).
  //   'enter' — from: held at cell; to: cell → identity.
  // Snap-from-cell is applied on `loopSwapSeq` changes (to-tile only,
  // exit phase), mirroring the launch-snap pattern.
  loopSwapRole?: "from" | "to" | null
  loopSwapPhase?: "exit" | "enter" | null
  loopSwapCell?: Cell | null
  loopSwapSeq?: number | null
  onSelect: () => void
  onClose: () => void
}

// Inactive contexts park here when the switcher is closed: off the left
// edge at slot scale, so opening the switcher slides them into their slots
// instead of fading them in. Numeric so it animates cleanly with cell.x.
function parkX(stageW: number): number {
  return -Math.max(stageW, 1)
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ContextTile({
  ctx,
  isActive,
  switcherOpen,
  cell,
  stageW,
  stageH,
  instantTransform = false,
  launchTransform = null,
  launchSeq = null,
  loopSwapRole = null,
  loopSwapPhase = null,
  loopSwapCell = null,
  loopSwapSeq = null,
  onSelect,
  onClose,
}: Props) {
  const PARK = parkX(stageW)
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

  // Loop-swap snap: the incoming ('to') tile starts at its swap cell with
  // no transition, then on the next frame releases back to its natural
  // pose (identity, since it's the new active context). Same two-frame
  // dance as launchSeq, but parameterised on cell coords instead of a
  // CSS transform string.
  const [loopSnapTransform, setLoopSnapTransform] = useState<string | null>(
    null
  )
  const [loopSnapping, setLoopSnapping] = useState(false)

  useLayoutEffect(() => {
    // Only the incoming tile needs the snap-at-cell pose, and only at the
    // start of a fresh swap (phase 'exit'). Phase transitions don't
    // retrigger it — seq stays stable across phases.
    if (loopSwapSeq == null || loopSwapRole !== "to" || !loopSwapCell) return
    if (prefersReducedMotion()) return
    const startTransform = `translate3d(${loopSwapCell.x}px, ${loopSwapCell.y}px, 0) scale(${loopSwapCell.scale})`
    setLoopSnapTransform(startTransform)
    setLoopSnapping(true)
    let r1 = 0
    let r2 = 0
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setLoopSnapping(false)
        setLoopSnapTransform(null)
      })
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
    // Re-trigger only on a new swap, mirroring launchSeq semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopSwapSeq])

  // Surface transform — single source of truth for the tile's visual bounds.
  // Precedence: launch snap > loop snap > loop role > switcher > active > parked.
  //
  // Loop swap flow:
  //   from, phase 'exit'   → cell (animates identity → cell; prev DOM was identity)
  //   from, phase 'enter'  → cell (held at cell; no visible motion)
  //   to,   phase 'exit'   → cell (snap-pattern holds it parked while 'from' scales down)
  //   to,   phase 'enter'  → identity (animates cell → identity; prev DOM was cell)
  let surfaceTransform: string
  if (launchOverride) {
    surfaceTransform = launchOverride
  } else if (loopSnapTransform) {
    surfaceTransform = loopSnapTransform
  } else if (loopSwapRole === "from" && loopSwapCell) {
    surfaceTransform = `translate3d(${loopSwapCell.x}px, ${loopSwapCell.y}px, 0) scale(${loopSwapCell.scale})`
  } else if (
    loopSwapRole === "to" &&
    loopSwapPhase === "exit" &&
    loopSwapCell
  ) {
    surfaceTransform = `translate3d(${loopSwapCell.x}px, ${loopSwapCell.y}px, 0) scale(${loopSwapCell.scale})`
  } else if (loopSwapRole === "to" && loopSwapPhase === "enter") {
    surfaceTransform = "translate3d(0px, 0px, 0) scale(1)"
  } else if (switcherOpen && cell) {
    surfaceTransform = `translate3d(${cell.x}px, ${cell.y}px, 0) scale(${cell.scale})`
  } else if (isActive) {
    surfaceTransform = "translate3d(0px, 0px, 0) scale(1)"
  } else if (cell) {
    surfaceTransform = `translate3d(${PARK}px, ${cell.y}px, 0) scale(${cell.scale})`
  } else {
    surfaceTransform = `translate3d(${PARK}px, 0px, 0) scale(1)`
  }

  // Chrome moves with `transform: translate3d` (composited, identical motion
  // profile to the surface) and only width/height animate as plain px. Using
  // top/left/width="100%" caused the close button to drift on a different
  // motion curve than the surface, especially noticeable when the active
  // tile traveled across most of the viewport.
  let chromeTransform: string
  let chromeW: number
  let chromeH: number
  if (loopSwapRole && loopSwapCell) {
    chromeTransform = `translate3d(${loopSwapCell.x}px, ${loopSwapCell.y}px, 0)`
    chromeW = loopSwapCell.w
    chromeH = loopSwapCell.h
  } else if (switcherOpen && cell) {
    chromeTransform = `translate3d(${cell.x}px, ${cell.y}px, 0)`
    chromeW = cell.w
    chromeH = cell.h
  } else if (isActive) {
    chromeTransform = "translate3d(0px, 0px, 0)"
    chromeW = stageW
    chromeH = stageH
  } else if (cell) {
    chromeTransform = `translate3d(${PARK}px, ${cell.y}px, 0)`
    chromeW = cell.w
    chromeH = cell.h
  } else {
    chromeTransform = `translate3d(${PARK}px, 0px, 0)`
    chromeW = stageW
    chromeH = stageH
  }

  const inLoopSwap = !!loopSwapRole
  const surfaceVisible = switcherOpen || isActive || inLoopSwap

  // Single transition spec used by both surface and chrome so they stay in
  // lock-step. Disabled during scroll (direct wheel input) and during the
  // launch snap (so the tile pops to the trigger rect without a rewind).
  // Inactive tiles sliding out to PARK get a slower duration: they cover a
  // much longer distance (full row width) than the active tile growing to
  // fullscreen, and 300ms made the slide-out blink past too quickly.
  const transitionDuration =
    inLoopSwap
      ? "motion-safe:duration-300"
      : !switcherOpen && !isActive
        ? "motion-safe:duration-500"
        : "motion-safe:duration-300"
  const transitionClass =
    instantTransform || snapping || loopSnapping
      ? ""
      : `motion-safe:transition-[transform,width,height,opacity,border-radius] ${transitionDuration} motion-safe:ease-glide`

  // The surface is `transform: scale()`d, which scales its border-radius
  // too. To make the visible corners match the chrome's 8px `rounded-lg`,
  // pre-divide by the cell scale (so 8/0.4 = 20px CSS → 8px visual). Square
  // only when an active tile fully covers the workspace at identity.
  //
  // During a loop swap the to-tile animates cell → identity in 'enter', so
  // its radius transitions from the cell-scaled value to 0 in lock-step
  // with the transform.
  let surfaceBorderRadius: number
  if (
    loopSwapRole === "from" ||
    (loopSwapRole === "to" && loopSwapPhase === "exit")
  ) {
    surfaceBorderRadius = loopSwapCell ? 8 / loopSwapCell.scale : 0
  } else if (loopSwapRole === "to" && loopSwapPhase === "enter") {
    surfaceBorderRadius = 0
  } else if (isActive && !switcherOpen) {
    surfaceBorderRadius = 0
  } else if (cell) {
    surfaceBorderRadius = 8 / cell.scale
  } else {
    surfaceBorderRadius = 0
  }

  // The active tile always sits on top so it covers other tiles as it grows
  // to fullscreen, with inactive tiles sliding away beneath it (iOS-style).
  // While the switcher is open everything sits at the same level — tiles
  // don't overlap in the row, so stacking is irrelevant.
  //
  // During a loop swap, stacking follows the phase's primary actor: the
  // tile currently animating needs to sit on top of the static one.
  //   phase 'exit'  → from scales down, goes on top (26); to waits beneath (21).
  //   phase 'enter' → to scales up, goes on top (26); from stays beneath (21).
  let surfaceZ: number
  if (inLoopSwap) {
    if (loopSwapPhase === "enter") {
      surfaceZ = loopSwapRole === "to" ? 26 : 21
    } else {
      surfaceZ = loopSwapRole === "from" ? 26 : 21
    }
  } else {
    surfaceZ = !switcherOpen && isActive ? 25 : 20
  }

  return (
    <>
      <div
        className={`absolute inset-0 origin-top-left overflow-hidden bg-background shadow-2xl ${transitionClass}`}
        style={{
          transform: surfaceTransform,
          borderRadius: surfaceBorderRadius,
          pointerEvents:
            switcherOpen || inLoopSwap ? "none" : isActive ? "auto" : "none",
          willChange: "transform",
          zIndex: surfaceZ,
        }}
        aria-hidden={!surfaceVisible}
        inert={!surfaceVisible || inLoopSwap}
      >
        <div className="flex h-full w-full flex-col">
          <ContextSurface ctx={ctx} />
        </div>
      </div>

      <div
        className={`absolute left-0 top-0 z-30 origin-top-left ${transitionClass}`}
        style={{
          transform: chromeTransform,
          width: chromeW,
          height: chromeH,
          opacity: switcherOpen ? 1 : 0,
          pointerEvents: switcherOpen ? "auto" : "none",
          willChange: "transform",
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
