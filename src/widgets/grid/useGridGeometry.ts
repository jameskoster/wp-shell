import { useEffect, useState, type RefObject } from "react"

/**
 * Live measurement of the dashboard grid. `cols` mirrors whatever the
 * CSS resolved `--cols` to (so JS can never disagree with the actual
 * layout); `cellSize` is the rendered cell side in CSS pixels;
 * `originRect` is read on demand from `getOriginRect()` so it always
 * reflects the latest scroll position.
 */
export type GridGeometry = {
  cols: number
  cellSize: number
  gap: number
  /** Returns the live bounding rect of the grid container. */
  getOriginRect: () => DOMRect
}

/**
 * Module-level reference to the currently-mounted grid's geometry.
 * Populated by the `WidgetGrid` host (the only consumer of
 * `useGridGeometry`) so cross-cutting code — specifically the drag /
 * resize handlers in `CustomizeDnd`, which sit outside the grid in the
 * tree — can read pointer-to-cell info without prop drilling.
 *
 * Always null when no grid is mounted (Customize mode is dashboard-
 * specific, so the grid is always mounted while we'd ever read this).
 */
let activeGridGeometry: GridGeometry | null = null

export function setActiveGridGeometry(g: GridGeometry | null): void {
  activeGridGeometry = g
}

export function getActiveGridGeometry(): GridGeometry | null {
  return activeGridGeometry
}

/**
 * Observe a grid container and return its live geometry. Re-reads the
 * computed `--cols` and `gap` (both CSS-controlled) on every resize so
 * the JS never disagrees with the rendered layout — there's no
 * separate JS breakpoint table to keep in sync with `index.css`.
 */
export function useGridGeometry(
  ref: RefObject<HTMLElement | null>,
): GridGeometry | null {
  const [geometry, setGeometry] = useState<GridGeometry | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function measure(): void {
      const node = ref.current
      if (!node) return
      const cs = getComputedStyle(node)
      const cols = parseInt(cs.getPropertyValue("--cols"), 10) || 4
      // `gap` resolves to a px length on grid containers; if the
      // shorthand resolves to "row col" pick the column gap.
      const gapValue = cs.columnGap || cs.gap || "0px"
      const gap = parseFloat(gapValue) || 0
      const width = node.clientWidth
      const cellSize = (width - (cols - 1) * gap) / cols
      const next: GridGeometry = {
        cols,
        cellSize,
        gap,
        getOriginRect: () => node.getBoundingClientRect(),
      }
      setGeometry(next)
      setActiveGridGeometry(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // Viewport changes can flip `--cols` (media-query-driven) without
    // changing the container's box, so subscribe to window resizes too.
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
      setActiveGridGeometry(null)
    }
  }, [ref])

  return geometry
}
