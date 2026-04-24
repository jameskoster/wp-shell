/**
 * Identity layer for the eight directional resize handles. Lives apart
 * from `ResizeHandles.tsx` so the routing layer (`CustomizeDnd`) can
 * import the parser / type without pulling in the React component
 * (and tripping the react-refresh "only export components" rule).
 */

/**
 * The eight directions a resize gesture can originate from. Names
 * mirror compass points so the routing layer can mutate the rect's
 * edges symbolically rather than from raw pointer deltas.
 */
export type ResizeEdge = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export const ALL_RESIZE_EDGES: ResizeEdge[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
]

/**
 * The id format the routing layer in `CustomizeDnd` parses to identify
 * a resize gesture. Centralised so `useDraggable` registration in
 * `ResizeHandles` and parsing in `CustomizeDnd` stay in lockstep.
 */
export function resizeHandleId(slotId: string, edge: ResizeEdge): string {
  return `resize:${slotId}:${edge}`
}
