import type { GridRect, WidgetSize } from "@/widgets/types"

/**
 * The dashboard's canonical reference width. User-authored placements
 * are stored against this column count; smaller breakpoints reflow via
 * `compact()`, larger ones don't exist (we cap at 12).
 */
export const CANONICAL_COLS = 12

/**
 * Translate the legacy `WidgetSize` token to a canonical cell count.
 * Used once at seed time to bootstrap the rect-based layout from the
 * recipe's declarative `size` field. After seeding, `rect` is the only
 * source of truth and `WidgetSize` is no longer consulted at render.
 */
export const SIZE_TO_CELLS: Record<WidgetSize, { w: number; h: number }> = {
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
 * Reflow a list of slots into `cols` available columns, honouring each
 * slot's authored position when it still fits — only items that would
 * overflow the new width or collide with an earlier-placed slot get
 * relocated to the first free cell.
 *
 * Slots are visited in `(row, col)` order so top-left items have first
 * claim on their authored cells; the rest fall through to firstFreeRect
 * if they can't keep their original position.
 *
 * Returns the items in their original input order (stable for React
 * keys and DOM order). Used both for responsive reflow at narrower
 * breakpoints and as the seed packer when bootstrapping from a recipe.
 */
export function compact<T extends { rect: GridRect }>(
  items: T[],
  cols: number,
): T[] {
  if (items.length === 0) return items
  const indexed = items.map((item, i) => ({ item, i }))
  // Sort by authored (row, col); ties broken by original index so the
  // sort is stable.
  indexed.sort((a, b) => {
    if (a.item.rect.row !== b.item.rect.row) return a.item.rect.row - b.item.rect.row
    if (a.item.rect.col !== b.item.rect.col) return a.item.rect.col - b.item.rect.col
    return a.i - b.i
  })

  const placed: GridRect[] = []
  const placedItems = new Map<number, T>()
  for (const { item, i } of indexed) {
    const w = Math.max(1, Math.min(item.rect.w, cols))
    const h = Math.max(1, item.rect.h)
    // First try the authored position (clamped so it can't overflow);
    // only relocate if that lands on a previously-placed slot.
    const desired: GridRect = {
      col: Math.max(0, Math.min(item.rect.col, cols - w)),
      row: Math.max(0, item.rect.row),
      w,
      h,
    }
    const rect = overlapsAny(desired, placed)
      ? firstFreeRect(placed, cols, w, h)
      : desired
    placed.push(rect)
    placedItems.set(i, { ...item, rect })
  }

  return items.map((_, i) => placedItems.get(i)!)
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
