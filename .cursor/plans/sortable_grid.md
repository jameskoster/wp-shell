# Sortable Dashboard Grid — Plan

Refactor the dashboard customize experience from a free-form rect grid into a sortable, displacement-based grid (iOS home screen / iPadOS widgets model). Drop targets become insertion points between widgets; neighbours flow out of the way live during the drag; every drop is valid.

---

## Why

The current free-form grid validates each candidate rect against `overlapsAny` and rejects overlaps with a red ghost. Concretely: in the default recipe, dragging the Revenue widget (xl, 4×2) over the Orders widget (also xl) shows a destructive indicator and the drop is silently discarded. Users expect the widgets to trade places — or, more generally, for the layout to make room.

A swap-only fix handles the same-shape case but doesn't generalise. The model users actually have in their head — from iOS, iPadOS, Notion, Figma boards, Android home screens — is **displacement during drag**: drop anywhere, neighbours shuffle to accommodate.

This plan adopts that model. The free-form rect remains internal (as a derived layout) but the authored shape becomes order + size, not coordinates.

---

## Goals & non‑goals

**In scope**
- Convert the dashboard slot model from rect-authored to order + size authored.
- During a move drag: live displacement of neighbours, no invalid states.
- Every drop is valid — no red indicator, no silent discards.
- Resize stays available (rect-derived from size + order index).
- One-time migration of any persisted free-form layouts.

**Out of scope (this pass)**
- Magnify / hover-zoom on widgets.
- Folder-style grouping (iOS app folders) — drag-on-top is just a regular insert.
- Multi-select drag.
- Undo/redo for customize gestures.
- Cross-context sync (this changes only the dashboard customize layer; dock model is unchanged beyond cross-surface insertion semantics).

---

## Locked decisions

| Decision | Choice |
|---|---|
| Source of truth | Authored `order` (array) + `size` (per slot). Rect is derived per breakpoint by the packer. |
| Packer | Reuse first-fit row-major; rename `compact()` → `pack()`. Behavior unchanged, contract simpler (no "authored position survives"). |
| Insertion-index strategy | Predictive: pack with the dragged slot inserted at each candidate index, pick the index whose resulting rect is closest to the cursor cell. O(n²) per move, fine for ≤50 widgets. |
| Hysteresis | Insertion index only changes when the cursor crosses past the *centre* of a neighbour's rect (not its edge), to prevent jitter at boundaries. |
| Displacement animation | CSS `transition: transform 200ms var(--ease-glide)` on slot wrappers, using FLIP if grid-cell transitions don't read smoothly (test first). |
| Drop affordance | No insertion bar in v1 — the live displacement of neighbours is the affordance, mirroring iOS. Revisit if user testing shows ambiguity. |
| Validation | None. Every cursor position resolves to a legal index; every drop commits. |
| Resize behavior | Updates `size` only. Re-packing is a side effect. No "compact upward" pass — shrinking a widget leaves cells empty in the row until later widgets naturally flow up on the next drag/reorder. Revisit after testing. |
| Launch tiles | Still 1×1, still draggable. Indistinguishable from any other slot in the reorder pipeline. |
| Cross-surface (dock → dashboard) | Insert at cursor's insertion index, not first-free cell. |
| Cross-surface (dashboard → dock) | Unchanged. |
| Persisted state migration | One-time at store init: derive `size` from old `rect`, sort slots by `(rect.row, rect.col)` to seed `order`. Drop the `rect` field after migration. |

---

## State shape

```ts
// src/widgets/types.ts
export type DashboardSlot =
  | { kind: "pinned"; pinned: PinnedItem; size: { w: number; h: number } }
  | { kind: "recipe"; widgetId: string; size: { w: number; h: number } }

export type GridRect = { col: number; row: number; w: number; h: number }
// GridRect is now derived-only; no longer part of any authored shape.
```

```ts
// src/stores/placementStore.ts
type PlacementState = {
  dashboardOrder: DashboardSlot[]      // order is authoritative
  dock: PinnedItem[]
  hiddenWidgetIds: string[]
  // ...
  reorderWidget: (id: string, toIndex: number) => void
  resizeWidget: (id: string, size: { w: number; h: number }) => void
  // placeWidget removed
}
```

`reorderWidget` is a pure splice — no validation, no overlap check, can't fail (other than `id` not found, which is a silent no-op as today).

---

## Packer

Replace `compact()` with `pack()` in `src/widgets/grid/canonicalGrid.ts`. Same first-fit algorithm, but the contract becomes "pack in given order" rather than "honour authored position when possible":

```ts
export function pack<T extends { size: { w: number; h: number } }>(
  slots: T[],
  cols: number,
): Array<T & { rect: GridRect }> {
  const placed: GridRect[] = []
  return slots.map((slot) => {
    const w = Math.max(1, Math.min(slot.size.w, cols))
    const h = Math.max(1, slot.size.h)
    const rect = firstFreeRect(placed, cols, w, h)
    placed.push(rect)
    return { ...slot, rect }
  })
}
```

`firstFreeRect`, `clampToGrid`, `rectsOverlap`, `overlapsAny`, and `pointerToCell` stay as-is. `SIZE_TO_CELLS` and `rectToWidgetSize` stay (still used to seed sizes from recipe `WidgetSize` and to derive content-density tokens).

---

## Drag pipeline

The `DragInfo` published by `CustomizeDnd` becomes index-oriented:

```ts
export type DragInfo = {
  active: { id: string; surface: "dashboard" | "dock"; rawId: string }
  gesture: "move" | "resize"
  isLaunchTile: boolean
  preview:
    | { kind: "dashboard"; widget: WidgetDef }
    | { kind: "dock"; item: PinnedItem }
  // Move gestures:
  insertionIndex?: number
  previewOrder?: DashboardSlot[]   // dashboardOrder with the dragged slot moved to insertionIndex
  // Resize gestures (unchanged):
  ghost?: { rect: GridRect; valid: boolean }
}
```

### `onDragStart`
Capture the dragged slot's id and current index. Initial `insertionIndex = currentIndex`, `previewOrder = dashboardOrder` (so first paint matches committed state).

### `onDragMove`
1. Translate cursor → `(col, row)` cell via `pointerToCell` + the existing `getActiveGridGeometry()`.
2. Compute insertion index. Predictive strategy:
   ```
   for i in 0..order.length:
     candidate = order with dragged slot spliced to index i
     packed = pack(candidate, cols)
     draggedRect = packed[i].rect
     score = manhattan distance from (draggedRect.col, draggedRect.row) to (cursorCol, cursorRow)
   pick i with min score
   ```
3. Apply hysteresis: if the new index would replace the current one, only switch if the cursor is past the centre of the boundary cell. (Track last-committed insertion index in a ref.)
4. If `insertionIndex` changed, splice `dashboardOrder` to produce `previewOrder` and publish both via `setActiveDrag`.

Resize gestures keep the existing pixel-delta → cell-delta → rect pipeline. They publish `ghost: { rect, valid }` exactly as today, except `valid` is now computed against the *packed* layout (sized slots in order), not against authored rects.

### `onDragEnd`
- Move: `reorderWidget(activeId, insertionIndex)`.
- Resize: `resizeWidget(activeId, { w: ghost.rect.w, h: ghost.rect.h })` if `ghost?.valid`.
- Cross-surface (dock → dashboard): `setPlacement(action, "dashboard")`, then `reorderWidget(newId, insertionIndex)`.
- Cross-surface (dashboard → dock): unchanged.

### `onDragCancel`
Clear `activeDrag`. No state to revert — `dashboardOrder` was never mutated.

---

## Render pipeline

`WidgetGrid` swaps `compact()` for `pack()` and reads from `previewOrder` during drag:

```tsx
const drag = useActiveDrag()
const order = drag?.previewOrder ?? slots
const packed = useMemo(() => pack(order, cols), [order, cols])
```

Each `DraggableSlot` keeps its current pattern (`gridColumn` / `gridRow` from `slot.rect`) but adds:

```tsx
<div
  className={cn(
    "group/slot relative motion-safe:transition-[grid-column,grid-row] motion-safe:duration-200 motion-safe:ease-[var(--ease-glide)]",
    // ... existing classes
  )}
```

If transitioning `grid-column` / `grid-row` doesn't animate cleanly across browsers (it likely doesn't — these are not animatable in CSS Grid), fall back to FLIP:

1. Before render: measure each slot's `getBoundingClientRect()`.
2. After render with new `previewOrder`: measure again.
3. For each slot, set `transform: translate(dx, dy)` to its old position, then `requestAnimationFrame` → `transform: ""` with the transition. dnd-kit ships `useAnimateLayoutChanges` for sortable contexts that does exactly this; we can reuse it via `useSortable` or implement a lightweight FLIP hook.

Test plain CSS first; commit to FLIP only if needed.

`SnapGhost` is removed from move gestures (kept for resize). The dragged slot still hides itself with `opacity-0`; the floating `DragOverlay` is unchanged.

---

## Cross-surface details

**Dock → dashboard** drop on the grid container:
- Compute insertion index from cursor as for an in-grid move.
- Call `setPlacement(action, "dashboard")` to materialise the slot, *then* `reorderWidget(newSlotId, insertionIndex)` to position it.
- (Alternative: extend `setPlacement` to take an optional `insertAt: number`. Cleaner state update, one fewer round-trip. Pick during implementation based on store API ergonomics.)

**Dashboard → dock**: unchanged.

**Within dock**: unchanged (already a sortable list).

**Resize handle on a dashboard slot**: unchanged routing, but commits via the new `resizeWidget(id, size)` signature.

---

## Migration

The store currently persists `dashboardOrder` with each slot carrying a `rect`. On store init (and as a one-time codemod for any in-memory state from previous sessions during dev):

```ts
function migrate(legacy: LegacySlot[]): DashboardSlot[] {
  return legacy
    .slice()
    .sort((a, b) => a.rect.row - b.rect.row || a.rect.col - b.rect.col)
    .map((s) => ({
      ...s,
      size: { w: s.rect.w, h: s.rect.h },
      rect: undefined,  // dropped
    }))
}
```

The recipe seed already produces slots in semantic order (analytics/info first, then pinned launch tiles); after migration the sort by `(row, col)` reproduces the visible top-to-bottom-left-to-right order, which is the natural order for the new model.

---

## Files to touch

**Modified**
- `src/widgets/types.ts` — `DashboardSlot.size` instead of `rect`.
- `src/widgets/grid/canonicalGrid.ts` — `compact()` → `pack()`. Keep `firstFreeRect`, `clampToGrid`, `pointerToCell`, `rectsOverlap`, `overlapsAny`, `SIZE_TO_CELLS`, `rectToWidgetSize`.
- `src/stores/placementStore.ts` — drop `placeWidget`, add `reorderWidget(id, toIndex)`; `resizeWidget(id, size)`; migration in init; `validateRect` removed.
- `src/shell/CustomizeDnd.tsx` — `DragMeta` carries `currentIndex` instead of `originalRect` for moves; `handleDragMove` computes insertion index + preview order; `handleDragEnd` calls `reorderWidget` for moves, `resizeWidget` for resizes; cross-surface dock→dashboard inserts at index.
- `src/widgets/WidgetGrid.tsx` — pack from `previewOrder`; remove move-state `SnapGhost`; add slot transition (CSS or FLIP).
- `src/widgets/grid/ResizeHandles.tsx` — unchanged interface, but its `onDragEnd` consumer now produces a size, not a rect.

**Untouched**
- `src/widgets/grid/useGridGeometry.ts` — geometry observer is unchanged.
- `src/widgets/{LaunchTile,InfoWidget,AnalyticsWidget,NavWidget}.tsx` — render unchanged; `rectToWidgetSize` still derives the density token from the packed rect.
- `src/recipes/*` — recipe seed already declares `WidgetSize`; we just translate it to `{ w, h }` at seed time as today.
- `src/shell/Dock.tsx`, `src/shell/dockStore.ts` — dock-side reorder is already index-based.

---

## Implementation order

1. **Refactor without behavior change**. Add `size` to `DashboardSlot`. At seed time and in render, derive `rect` from `pack(order, cols)`. Keep `placeWidget` calling a temporary adapter that converts (id, rect) → (id, toIndex) using cursor-cell math. The grid renders identically; the move pipeline still uses ghost rects. Ship as a green diff.
2. **Add `reorderWidget` + index-based DnD pipeline**. New `DragInfo.insertionIndex` / `previewOrder`. Predictive insertion strategy. `onDragMove` publishes preview order. `onDragEnd` calls `reorderWidget`. Remove the temporary `placeWidget` adapter. Validation branches in the store deleted.
3. **Live displacement animation**. Try `transition: transform` first; if jittery, swap in FLIP via `useSortable`'s animation hook or a small custom hook. Tune duration / easing.
4. **Hysteresis**. Add the half-cell-past-boundary rule to the insertion-index calculation. Verify with two adjacent xl widgets that the index doesn't oscillate when the cursor sits on the seam.
5. **Cross-surface (dock → dashboard)** routes through insertion index instead of first-free.
6. **Resize**. Switch `resizeWidget` signature to `(id, size)`. Resize handles still produce a candidate rect for the ghost; on commit, derive `size = { w: rect.w, h: rect.h }` and call the new action. Verify that shrinking a widget doesn't cause neighbours to "snap" to weird positions (it shouldn't — order is unchanged).
7. **Migration** at store init. Drop `rect` from authored slots in code and in any persisted state.
8. **Polish**. Insertion affordance review (do users want a bar?), motion timing, mobile feel, keyboard reorder via `sortableKeyboardCoordinates`.

Each step is independently shippable; a partial rollout (steps 1–2) already gives users the iOS-flow experience without animation.

---

## Risks & open questions

- **Animation feel**: `grid-column` / `grid-row` are not animatable across all browsers — likely need FLIP. Adds complexity but dnd-kit's sortable already does this; we can lean on it.
- **Insertion index ambiguity for large widgets**: when the cursor is over an xl widget, it's not obvious whether "before" or "after" is intended. Hysteresis on the *centre* of the rect (not an edge) is the v1 answer; revisit if testing shows users expect quadrant-based detection.
- **Resize-then-shrink leaves holes**: by design — order is sticky. If users find this surprising, add a "compact upward" pass that re-packs slots whose authored order would now fit higher. Cheap to add later.
- **Predictive insertion is O(n²)**: fine for current scale (≤30 widgets), revisit if recipes grow.
- **Loss of "authored position is sticky"**: the only behaviour we explicitly drop. Worth flagging in release notes to anyone who'd manually positioned widgets to leave intentional gaps.

---

## Cleanup / follow-ups

- Delete `placeWidget` and the `validateRect` helper from `placementStore.ts` once step 2 ships.
- Delete `SnapGhost` move-state branch from `WidgetGrid.tsx` once step 2 ships.
- Consider a "compact upward" toggle for users who want denser layouts after resizes.
- Consider folder-style grouping (drag-on-top → group) as a future extension if the dashboard ever supports nested surfaces.
- Consider quadrant-based insertion (top-half vs bottom-half of an xl widget = before/after) if hysteresis proves insufficient.
