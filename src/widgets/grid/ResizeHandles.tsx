import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import {
  ALL_RESIZE_EDGES,
  resizeHandleId,
  type ResizeEdge,
} from "./resizeIds"

const EDGE_POSITION: Record<ResizeEdge, string> = {
  nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  e: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
  w: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
}

const EDGE_CURSOR: Record<ResizeEdge, string> = {
  nw: "cursor-nwse-resize",
  n: "cursor-ns-resize",
  ne: "cursor-nesw-resize",
  e: "cursor-ew-resize",
  se: "cursor-nwse-resize",
  s: "cursor-ns-resize",
  sw: "cursor-nesw-resize",
  w: "cursor-ew-resize",
}

const EDGE_HAS_DOT: Record<ResizeEdge, boolean> = {
  nw: true,
  n: false,
  ne: true,
  e: false,
  se: true,
  s: false,
  sw: true,
  w: false,
}

/**
 * Eight directional resize handles overlaid on a non-launch dashboard
 * slot. Each handle is its own `useDraggable`, registered under
 * `resize:<slotId>:<edge>` so the routing layer can mutate the matching
 * rect edge without re-deriving the gesture from raw deltas.
 *
 * Corner handles render a small visible dot; edge handles are
 * invisible 12×12 hit zones — the larger corner affordance hints "you
 * can resize from here" while edges stay quiet to keep the widget face
 * uncluttered. All handles disappear during an active drag (the floating
 * preview + ghost is the user's only feedback at that moment).
 */
export function ResizeHandles({
  slotId,
  hidden,
}: {
  slotId: string
  hidden: boolean
}) {
  if (hidden) return null
  return (
    <>
      {ALL_RESIZE_EDGES.map((edge) => (
        <ResizeHandle key={edge} slotId={slotId} edge={edge} />
      ))}
    </>
  )
}

function ResizeHandle({ slotId, edge }: { slotId: string; edge: ResizeEdge }) {
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: resizeHandleId(slotId, edge),
  })
  const dot = EDGE_HAS_DOT[edge]
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="separator"
      aria-label={`Resize ${edge}`}
      className={cn(
        "absolute z-30 size-3 touch-none outline-none",
        EDGE_POSITION[edge],
        EDGE_CURSOR[edge],
        // Edge handles are invisible; corners get a small dot. Both
        // accept the same 12px hit area so keyboard/touch resize is
        // possible from any direction.
        dot &&
          "rounded-full border border-border bg-card shadow-sm/10 opacity-0 group-hover/slot:opacity-100 transition-opacity",
      )}
    />
  )
}
