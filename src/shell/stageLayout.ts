export type Cell = {
  x: number
  y: number
  w: number
  h: number
  scale: number
}

export type StackLayout = {
  cells: Cell[]
  tileW: number
  tileH: number
  scale: number
  maxScroll: number
}

const TILE_SCALE = 0.4
const GAP = 16
const SIDE_PADDING = 32

/**
 * Stack layout: a single horizontal row of equally sized tiles ordered
 * left-to-right from oldest to newest (so `cells[0]` for the most recent
 * is the rightmost). At rest with >= 3 tiles, the rightmost two are fully
 * visible and the third peeks from the left edge. Older tiles are revealed
 * by scrolling (positive scrollOffset shifts the row right, exposing older
 * on the left).
 */
export function computeStackLayout(
  count: number,
  stageW: number,
  stageH: number,
): StackLayout {
  if (count === 0 || stageW <= 0 || stageH <= 0) {
    return { cells: [], tileW: 0, tileH: 0, scale: 0, maxScroll: 0 }
  }

  const scale = TILE_SCALE
  const tileW = stageW * scale
  const tileH = stageH * scale
  const y = (stageH - tileH) / 2

  const cells: Cell[] = []

  if (count === 1) {
    cells.push({
      x: (stageW - tileW) / 2,
      y,
      w: tileW,
      h: tileH,
      scale,
    })
  } else if (count === 2) {
    const rowW = 2 * tileW + GAP
    const rowStart = (stageW - rowW) / 2
    // ordered[0] = most recent = rightmost
    cells.push({ x: rowStart + tileW + GAP, y, w: tileW, h: tileH, scale })
    cells.push({ x: rowStart, y, w: tileW, h: tileH, scale })
  } else {
    const rightmostX = stageW - SIDE_PADDING - tileW
    for (let i = 0; i < count; i++) {
      cells.push({
        x: rightmostX - i * (tileW + GAP),
        y,
        w: tileW,
        h: tileH,
        scale,
      })
    }
  }

  const leftmostX = cells[count - 1]!.x
  const maxScroll =
    leftmostX < SIDE_PADDING ? Math.ceil(SIDE_PADDING - leftmostX) : 0

  return { cells, tileW, tileH, scale, maxScroll }
}
