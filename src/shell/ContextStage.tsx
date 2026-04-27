import { useEffect, useMemo, useRef, useState } from "react"
import {
  useActiveContext,
  useContexts,
  useFocusOrder,
  useOpenContexts,
} from "@/contexts/store"
import { useUI } from "./uiStore"
import { ContextTile } from "./ContextTile"
import {
  computeLoopSwapLayout,
  computeStackLayout,
  type Cell,
} from "./stageLayout"
import { shortcutLabel } from "./useShortcuts"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Dashboard } from "@/workflows"

const SCROLL_SETTLE_MS = 120
const SIDE_PADDING = 32

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// Maps the launch trigger's viewport rect into a stage-local transform that
// places the (full-stage) surface element exactly over that rect. With
// origin-top-left + non-uniform scale the surface starts pixel-aligned to
// the source button and animates out to identity (full stage).
function buildLaunchTransform(
  rect: { left: number; top: number; width: number; height: number },
  stage: { x: number; y: number; w: number; h: number },
): string {
  const tx = rect.left - stage.x
  const ty = rect.top - stage.y
  const sx = rect.width / stage.w
  const sy = rect.height / stage.h
  return `translate3d(${tx}px, ${ty}px, 0) scale(${sx}, ${sy})`
}

export function ContextStage() {
  const ordered = useFocusOrder()
  // Stable iteration source — never re-sorts on focus changes. Iterating
  // `ordered` directly meant React had to reorder fragment children whenever
  // focus changed, which interrupted the in-flight CSS transitions on the
  // tiles that got shifted (i.e. the ones to the right of the selected
  // tile). Driving the map off `openContexts` keeps DOM positions fixed and
  // only the computed `cell`/`isActive` props change.
  const openContexts = useOpenContexts()
  const active = useActiveContext()
  const switcherOpen = useUI((s) => s.overlay === "switcher")
  const focus = useContexts((s) => s.focus)
  const close = useContexts((s) => s.close)
  const goHome = useContexts((s) => s.goHome)
  const clearPendingHome = useContexts((s) => s.clearPendingHome)
  const closeOverlay = useUI((s) => s.close)

  const stageRef = useRef<HTMLDivElement>(null)
  // Full stage rect (viewport-relative) so we can also project the launch
  // origin rect into stage-local coords.
  const [stageRect, setStageRect] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [scrollOffset, setScrollOffset] = useState(0)
  const [scrolling, setScrolling] = useState(false)
  const scrollTimer = useRef<number | null>(null)

  // Tracks which tile (if any) should sit pinned at full-screen identity
  // behind a launching tile. Without it, switching from one active context
  // to another lets the prior tile slide off to PARK while the new tile is
  // still mid-launch (small, anchored at the dock rect) — leaving a brief
  // window where the dashboard shows through between them. Pinning the
  // outgoing tile at identity until the launch lands keeps the new tile
  // visually "on top of" the existing one.
  const [coveringId, setCoveringId] = useState<string | null>(null)

  // pendingLaunch lives in the store and is overwritten (or cleared to null)
  // by the next open() call. We don't proactively consume it: the tile
  // gates re-fires on launchSeq, so a stale value sitting in the store is
  // harmless, and clearing it mid-launch races the tile's two-rAF release
  // and strands the surface at the trigger rect.
  const pendingLaunch = useContexts((s) => s.pendingLaunch)
  const pendingHome = useContexts((s) => s.pendingHome)
  const loopSwap = useContexts((s) => s.loopSwap)

  // Mirror of `active.id` from the previous render. Captured during render
  // (rather than via useEffect) because we need yesterday's value while
  // the launchSeq effect runs synchronously after the commit that already
  // wrote the new active.
  const lastActiveIdRef = useRef<string | null>(null)
  const prevActiveIdRef = useRef<string | null>(null)
  const currentActiveId = active?.id ?? null
  if (lastActiveIdRef.current !== currentActiveId) {
    prevActiveIdRef.current = lastActiveIdRef.current
    lastActiveIdRef.current = currentActiveId
  }

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      setStageRect({ x: r.left, y: r.top, w: r.width, h: r.height })
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const size = stageRect
  const layout = useMemo(
    () => computeStackLayout(ordered.length, size.w, size.h),
    [ordered.length, size.w, size.h],
  )

  // Reset scroll when the switcher CLOSES, not when it opens. Resetting on
  // open happens after the first switcher-open render paints, so the tiles
  // briefly fan out at the stale offset, then re-animate to the correct
  // positions. While the switcher is closed, scrollOffset doesn't affect any
  // transform (active tile is at identity, others are parked), so clearing
  // it eagerly is safe and means the next open render starts at 0.
  useEffect(() => {
    if (!switcherOpen) {
      setScrollOffset(0)
      setScrolling(false)
    }
  }, [switcherOpen])

  // Arm the cover when a launch fires while another context was active.
  // Held just long enough to span the launch animation (300ms; matched to
  // ContextTile's transitionDuration in the launch case), then released
  // so the outgoing tile can complete its slide to PARK behind the
  // already-landed new active. Reduced motion skips the launch animation
  // entirely, so the cover is unnecessary there.
  useEffect(() => {
    if (!pendingLaunch) return
    if (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const prev = prevActiveIdRef.current
    if (!prev || prev === pendingLaunch.id) return
    setCoveringId(prev)
    const t = window.setTimeout(() => setCoveringId(null), 320)
    return () => {
      window.clearTimeout(t)
      setCoveringId(null)
    }
    // Re-arm only on a new launch event (signalled by pendingLaunch.seq
    // changing); a re-rendered identical pendingLaunch object should not
    // restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLaunch?.seq])

  // The home animation leaves `pendingHome` parked in its 'done' phase so
  // the surface stays invisible at the launch tile rect (instead of
  // sliding to PARK). Opening the switcher means the user has moved past
  // that handoff — drop the override so the tile rejoins the row and
  // becomes visible at its cell.
  useEffect(() => {
    if (switcherOpen) clearPendingHome()
  }, [switcherOpen, clearPendingHome])

  // Clamp scroll if the layout shrinks (e.g. a context closes).
  useEffect(() => {
    setScrollOffset((o) => clamp(o, 0, layout.maxScroll))
  }, [layout.maxScroll])

  // Wheel / trackpad: free horizontal scroll. Attached imperatively so we
  // can use { passive: false } and preventDefault.
  useEffect(() => {
    const el = stageRef.current
    if (!el || !switcherOpen || layout.maxScroll === 0) return
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX !== 0 ? e.deltaX : e.deltaY
      if (dx === 0) return
      e.preventDefault()
      setScrollOffset((o) => clamp(o - dx, 0, layout.maxScroll))
      setScrolling(true)
      if (scrollTimer.current != null) window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(
        () => setScrolling(false),
        SCROLL_SETTLE_MS,
      )
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [switcherOpen, layout.maxScroll])

  // Initial focus: when the switcher opens, focus the second-most-recent
  // tile (the macOS Cmd-Tab "previous app" pre-selection).
  useEffect(() => {
    if (!switcherOpen || ordered.length === 0) return
    const tiles = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-context-tile-button]"),
    )
    if (tiles.length === 0) return
    const initial = tiles[Math.min(1, tiles.length - 1)]
    initial?.focus({ preventScroll: true })
  }, [switcherOpen, ordered.length])

  // Keyboard navigation: ArrowLeft = next older (i+1), ArrowRight = next
  // newer (i-1). Tiles render in stable DOM (openContexts) order but are
  // visually positioned by focus rank, so we walk `ordered` to build the
  // navigation list — that way `next` aligns with `layout.cells[next]` and
  // arrow direction matches what's on screen.
  useEffect(() => {
    if (!switcherOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      const tiles = ordered
        .map((c) =>
          document.querySelector<HTMLButtonElement>(
            `[data-context-tile-button][data-context-id="${c.id}"]`,
          ),
        )
        .filter((b): b is HTMLButtonElement => b !== null)
      if (tiles.length === 0) return
      const currentIdx = tiles.findIndex((b) => b === document.activeElement)
      const delta = e.key === "ArrowLeft" || e.key === "ArrowDown" ? 1 : -1
      const safeIdx = currentIdx === -1 ? 0 : currentIdx
      const next = (safeIdx + delta + tiles.length) % tiles.length
      e.preventDefault()
      tiles[next]?.focus({ preventScroll: true })

      // Scroll the focused tile fully into view.
      const cell = layout.cells[next]
      if (!cell || layout.maxScroll === 0) return
      setScrollOffset((o) => {
        const effectiveX = cell.x + o
        const visibleLeft = SIDE_PADDING
        const visibleRight = size.w - SIDE_PADDING - cell.w
        if (effectiveX < visibleLeft) return clamp(o + (visibleLeft - effectiveX), 0, layout.maxScroll)
        if (effectiveX > visibleRight) return clamp(o + (visibleRight - effectiveX), 0, layout.maxScroll)
        return o
      })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [switcherOpen, layout, size.w, ordered])

  // Compose effective cells (with current scroll applied).
  const effectiveCells = useMemo<Cell[]>(
    () => layout.cells.map((c) => ({ ...c, x: c.x + scrollOffset })),
    [layout.cells, scrollOffset],
  )

  // Map ctx.id → cell index in the focus-ordered switcher row. Lets us
  // iterate the stable `openContexts` array (preserving DOM order) while
  // still positioning each tile based on its focus rank.
  const cellIndexById = useMemo(() => {
    const map = new Map<string, number>()
    ordered.forEach((c, i) => map.set(c.id, i))
    return map
  }, [ordered])

  // Loop-swap layout: precomputed once per stage size + swap pair so both
  // participants get stable cell coordinates for the duration of the
  // animation. The swap is short (≈280ms) and the layout doesn't react to
  // scroll, so memoising on stage size alone is enough.
  const loopSwapLayout = useMemo(
    () =>
      loopSwap && stageRect.w > 0 && stageRect.h > 0
        ? computeLoopSwapLayout(stageRect.w, stageRect.h)
        : null,
    [loopSwap, stageRect.w, stageRect.h],
  )

  const homeIsActive = active === null
  const showHomeHint = switcherOpen && ordered.length === 0

  return (
    <div
      ref={stageRef}
      className="relative isolate flex-1 overflow-hidden"
      data-switcher-open={switcherOpen ? "" : undefined}
      role={switcherOpen ? "region" : undefined}
      aria-label={switcherOpen ? "Open workspaces" : undefined}
    >
      <div
        className={`absolute inset-0 z-0 flex motion-safe:transition-[opacity,filter] motion-safe:duration-300 motion-safe:ease-glide ${
          switcherOpen || loopSwap
            ? "opacity-40 blur-sm"
            : "opacity-100 blur-0"
        }`}
        aria-hidden={!homeIsActive && !switcherOpen}
        inert={!homeIsActive && !switcherOpen}
      >
        <Dashboard />
      </div>

      {switcherOpen ? (
        <button
          type="button"
          onClick={() => {
            goHome()
            closeOverlay()
          }}
          aria-label="Go to Dashboard"
          className="absolute inset-0 z-10 cursor-default outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
        />
      ) : null}

      {openContexts.map((ctx) => {
        const i = cellIndexById.get(ctx.id) ?? 0
        const cell = effectiveCells[i]
        const isActive = ctx.id === active?.id
        const isLaunching =
          pendingLaunch?.id === ctx.id && stageRect.w > 0 && stageRect.h > 0
        const launchTransform = isLaunching
          ? buildLaunchTransform(pendingLaunch!.rect, stageRect)
          : null
        const launchSeq = isLaunching ? pendingLaunch!.seq : null

        const isHoming =
          pendingHome?.id === ctx.id && stageRect.w > 0 && stageRect.h > 0
        const homeTransform = isHoming
          ? buildLaunchTransform(pendingHome!.rect, stageRect)
          : null
        const homePhase = isHoming ? pendingHome!.phase : null

        let loopSwapRole: "from" | "to" | null = null
        let loopSwapCell: Cell | null = null
        if (loopSwap && loopSwapLayout) {
          if (ctx.id === loopSwap.fromId) {
            loopSwapRole = "from"
            loopSwapCell = loopSwapLayout.from
          } else if (ctx.id === loopSwap.toId) {
            loopSwapRole = "to"
            loopSwapCell = loopSwapLayout.to
          }
        }
        const loopSwapPhase = loopSwapRole ? loopSwap!.phase : null
        const loopSwapSeq = loopSwapRole ? loopSwap!.seq : null

        const isCovering = ctx.id === coveringId && !isActive

        return (
          <ContextTile
            key={ctx.id}
            ctx={ctx}
            isActive={isActive}
            isCovering={isCovering}
            switcherOpen={switcherOpen}
            cell={cell}
            stageW={stageRect.w}
            stageH={stageRect.h}
            instantTransform={scrolling}
            launchTransform={launchTransform}
            launchSeq={launchSeq}
            homeTransform={homeTransform}
            homePhase={homePhase}
            loopSwapRole={loopSwapRole}
            loopSwapPhase={loopSwapPhase}
            loopSwapCell={loopSwapCell}
            loopSwapSeq={loopSwapSeq}
            onSelect={() => {
              focus(ctx.id)
              closeOverlay()
            }}
            onClose={() => {
              close(ctx.id)
              // Closing the last open context returns home — keeping the
              // switcher overlay around with nothing to switch to would
              // strand the user behind the blur/dim.
              if (openContexts.length === 1 && switcherOpen) closeOverlay()
            }}
          />
        )
      })}

      {showHomeHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <div className="rounded-full border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-xs/5">
            <KbdGroup>
              <span>Open something from</span>
              <Kbd>{shortcutLabel("palette")}</Kbd>
            </KbdGroup>
          </div>
        </div>
      ) : null}

      <span aria-live="polite" className="sr-only">
        {switcherOpen
          ? `Workspaces open. ${ordered.length} ${
              ordered.length === 1 ? "workspace" : "workspaces"
            }. Tap empty space to return to Dashboard.`
          : ""}
      </span>
    </div>
  )
}
