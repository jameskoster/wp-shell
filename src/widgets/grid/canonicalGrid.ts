import type { CellSize, GridRect, WidgetSize } from "@/widgets/types"

/**
 * The dashboard's canonical reference width. The packer lays slots out
 * against this column count when at full width; smaller breakpoints
 * reflow via `pack()`, larger ones don't exist (we cap at 12).
 */
export const CANONICAL_COLS = 12

/**
 * Translate the recipe's declarative `WidgetSize` token to a cell
 * footprint. Used at seed time to bootstrap each slot's authored
 * `size`; after seeding, `size` is the only source of truth and
 * `WidgetSize` is no longer consulted at render.
 */
export const SIZE_TO_CELLS: Record<WidgetSize, CellSize> = {
  sm: { w: 1, h: 1 },
  tall: { w: 1, h: 2 },
  md: { w: 2, h: 1 },
  lg: { w: 2, h: 2 },
  xl: { w: 4, h: 2 },
}

/**
 * Inverse of `SIZE_TO_CELLS` — derives a content-density token from
 * the rect's actual cell footprint. Used by `WidgetGrid` to keep the
 * widget renderers' internal `size` switch (item count, header layout,
 * etc.) coherent with the user-resized cell allocation, without
 * forcing each widget to learn about rects.
 */
export function rectToWidgetSize(rect: { w: number; h: number }): WidgetSize {
  if (rect.w <= 1 && rect.h <= 1) return "sm"
  if (rect.w <= 1) return "tall"
  if (rect.h <= 1) return "md"
  if (rect.w >= 4 && rect.h >= 2) return "xl"
  return "lg"
}

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return (
    a.col < b.col + b.w &&
    a.col + a.w > b.col &&
    a.row < b.row + b.h &&
    a.row + a.h > b.row
  )
}

export function overlapsAny(rect: GridRect, others: GridRect[]): boolean {
  for (const o of others) {
    if (rectsOverlap(rect, o)) return true
  }
  return false
}

/**
 * Clamp a rect inside `cols`. Width is clamped to `cols`; col is clamped
 * so the rect doesn't overflow the right edge. Row stays put — vertical
 * scrolling is unbounded by design (rows can grow).
 */
export function clampToGrid(rect: GridRect, cols: number): GridRect {
  const w = Math.max(1, Math.min(rect.w, cols))
  const h = Math.max(1, rect.h)
  const col = Math.max(0, Math.min(rect.col, cols - w))
  const row = Math.max(0, rect.row)
  return { col, row, w, h }
}

/**
 * Find the first available `w × h` rectangle in row-major order, given
 * the rectangles already on the grid. Returns coordinates anchored to
 * the top-left of the empty region.
 *
 * The grid is conceptually unbounded vertically, so this always
 * succeeds — at worst the new rect is placed below every existing one.
 */
export function firstFreeRect(
  others: GridRect[],
  cols: number,
  w: number,
  h: number,
): GridRect {
  const clampedW = Math.max(1, Math.min(w, cols))
  const clampedH = Math.max(1, h)

  // Search at most one row past the current bottom; if nothing fits,
  // fall through to the next-empty row below everything.
  const maxRow = others.reduce((m, r) => Math.max(m, r.row + r.h), 0)
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col + clampedW <= cols; col++) {
      const candidate: GridRect = { col, row, w: clampedW, h: clampedH }
      if (!overlapsAny(candidate, others)) return candidate
    }
  }
  return { col: 0, row: maxRow, w: clampedW, h: clampedH }
}

/**
 * Pack a list of slots into `cols` available columns in array order,
 * row-major, first-fit. Each slot's `size` is authored; its `rect`
 * (col/row position) is derived here.
 *
 * Order is authoritative — there is no notion of an "authored
 * position" for a slot. Two slots can't overlap because each is placed
 * into the first cell that isn't yet occupied by an earlier slot. The
 * grid is unbounded vertically, so the packer always succeeds.
 *
 * Used both as the responsive reflow at narrower breakpoints and as
 * the seed packer when bootstrapping from a recipe.
 */
export function pack<T extends { size: CellSize }>(
  items: T[],
  cols: number,
): Array<T & { rect: GridRect }> {
  const placed: GridRect[] = []
  return items.map((item) => {
    const w = Math.max(1, Math.min(item.size.w, cols))
    const h = Math.max(1, item.size.h)
    const rect = firstFreeRect(placed, cols, w, h)
    placed.push(rect)
    return { ...item, rect }
  })
}

/**
 * Resolve a target cell anchor to an insertion index in `order`,
 * given the dragged slot's current index. Strategy: try each
 * candidate index, pack the order with the dragged slot moved there,
 * score by manhattan distance from the dragged slot's resulting rect
 * to the target anchor, pick the minimum.
 *
 * Used live during a drag so the grid can render the previewed
 * displacement, and again on drop to commit the reorder. O(n²) per
 * call — fine for the dashboard's slot counts.
 *
 * `stickyIndex` and `stickyBias` add hysteresis: the named index gets
 * its score reduced by `stickyBias` so the cursor must travel
 * meaningfully past the boundary before the resolved index switches.
 * Default bias of 0.5 means the cursor must overshoot by at least one
 * whole cell (anchors are integer cells), so adjacent same-shape
 * neighbours don't oscillate when the cursor sits on the seam.
 *
 * Ties (after the bias) resolve to the lower index, which biases
 * insertion toward the start of the array when the cursor sits
 * between two equally-good positions and there's no sticky index.
 */
export function indexForAnchor<T extends { size: CellSize }>(
  order: T[],
  fromIndex: number,
  anchor: { col: number; row: number },
  cols: number,
  options?: { stickyIndex?: number; stickyBias?: number },
): number {
  if (order.length === 0) return 0
  const stickyIndex = options?.stickyIndex
  const stickyBias = options?.stickyBias ?? 0.5
  let bestIndex = fromIndex
  let bestScore = Infinity
  for (let i = 0; i < order.length; i++) {
    const trial = reorderArray(order, fromIndex, i)
    const packed = pack(trial, cols)
    const rect = packed[i].rect
    let score =
      Math.abs(rect.col - anchor.col) + Math.abs(rect.row - anchor.row)
    if (stickyIndex !== undefined && i === stickyIndex) score -= stickyBias
    if (score < bestScore) {
      bestScore = score
      bestIndex = i
    }
  }
  return bestIndex
}

/**
 * Resolve a target cell anchor to an insertion index for a NEW item
 * not yet present in `order` (e.g. a dock item being dragged onto the
 * dashboard for the first time). Conceptually identical to
 * `indexForAnchor` but inserts a hypothetical slot at each candidate
 * index `0..order.length` (inclusive — appending is a valid index).
 *
 * `stickyIndex` and `stickyBias` add hysteresis the same way as
 * `indexForAnchor`. Initial drags into an empty grid trivially
 * resolve to 0.
 */
export function indexForInsertion<T extends { size: CellSize }>(
  order: T[],
  newItem: { size: CellSize },
  anchor: { col: number; row: number },
  cols: number,
  options?: { stickyIndex?: number; stickyBias?: number },
): number {
  if (order.length === 0) return 0
  const stickyIndex = options?.stickyIndex
  const stickyBias = options?.stickyBias ?? 0.5
  let bestIndex = order.length
  let bestScore = Infinity
  for (let i = 0; i <= order.length; i++) {
    const trial = [
      ...order.slice(0, i),
      newItem as unknown as T,
      ...order.slice(i),
    ]
    const packed = pack(trial, cols)
    const rect = packed[i].rect
    let score =
      Math.abs(rect.col - anchor.col) + Math.abs(rect.row - anchor.row)
    if (stickyIndex !== undefined && i === stickyIndex) score -= stickyBias
    if (score < bestScore) {
      bestScore = score
      bestIndex = i
    }
  }
  return bestIndex
}

/**
 * Splice helper: move `from` to `to` in a new array. Returns the
 * input reference unchanged when the move is a no-op so callers can
 * short-circuit equality checks.
 */
export function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Compute the cell under a client-space pointer. Returns negative or
 * out-of-range coordinates when the pointer is outside the grid; the
 * caller is expected to clamp.
 */
export function pointerToCell(
  pointer: { x: number; y: number },
  geometry: {
    originRect: { left: number; top: number }
    cellSize: number
    gap: number
  },
): { col: number; row: number } {
  const stride = geometry.cellSize + geometry.gap
  if (stride <= 0) return { col: 0, row: 0 }
  const col = Math.floor((pointer.x - geometry.originRect.left) / stride)
  const row = Math.floor((pointer.y - geometry.originRect.top) / stride)
  return { col, row }
}
