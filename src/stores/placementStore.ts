import { create } from "zustand"
import type { ContextRef } from "@/contexts/types"
import { refKey } from "@/contexts/url"
import { DEFAULT_RECIPE_ID, recipeFor, type RecipeId } from "@/recipes"
import { useRecipe } from "@/stores/recipeStore"
import {
  CANONICAL_COLS,
  reorderArray,
  resolveWidgetSize,
} from "@/widgets/grid/canonicalGrid"
import type {
  CellSize,
  DashboardSlot,
  NavItem,
  NavWidget,
  PinnedItem,
  Recipe,
  WidgetDef,
} from "@/widgets/types"
import { slotToWidget } from "@/widgets/slotToWidget"

export type { PinnedItem, DashboardSlot } from "@/widgets/types"

export type Placement = "dashboard" | "dock" | "none"

type PlacementMeta = {
  title: string
  icon: PinnedItem["icon"]
  badge?: string
  description?: string
}

type PlacementState = {
  /**
   * Single list covering every dashboard slot — pinned launch tiles
   * AND recipe widgets (info, analytics). Each slot owns a canonical
   * `size` (cell footprint); position falls out of array order via
   * `pack()`. Free-form moves and resizes mutate `dashboardOrder` in
   * place via `placeWidget` / `resizeWidget`.
   */
  dashboardOrder: DashboardSlot[]
  dock: PinnedItem[]
  /**
   * Recipe-sourced widgets the user has dismissed from the grid. The
   * Add widgets menu reads this list (alongside placement === "none"
   * pinned items) to decide what's offerable.
   */
  hiddenWidgetIds: string[]
  placementOf: (action: ContextRef) => Placement
  /**
   * Move an item between surfaces. `meta` is required when the item
   * isn't already pinned anywhere so we have something to render; when
   * the item already exists on either surface, the existing record is
   * moved verbatim and `meta` is ignored.
   *
   * `insertAt` (optional, dashboard-only) splices the new slot into
   * `dashboardOrder` at the given index instead of appending. Used by
   * cross-surface dock → dashboard drags that already resolved a live
   * insertion index from the cursor; menu-driven adds (Add widget,
   * etc.) omit it and get the default append-then-pack behaviour.
   */
  setPlacement: (
    action: ContextRef,
    next: Placement,
    meta?: PlacementMeta,
    insertAt?: number,
  ) => void
  /**
   * Remove any widget from the dashboard by id. Pinned launch tile ids
   * are dropped from `dashboardOrder`; recipe widget ids are added to
   * `hiddenWidgetIds` (and dropped from `dashboardOrder` if present),
   * so the Add widgets menu can surface them again.
   */
  removeWidget: (id: string) => void
  isHidden: (id: string) => boolean
  /**
   * Move an existing slot to a new index in `dashboardOrder`. Pure
   * splice — the packer handles the resulting layout. No-op if `id`
   * isn't on the dashboard or the move would be a no-op.
   */
  reorderWidget: (id: string, toIndex: number) => void
  /**
   * Resize an existing slot to a new authored cell footprint. Position
   * is order-derived, so resize never moves a widget — pack() reflows
   * neighbours around the new size on the next render. Launch tile
   * sizes are pinned at 1×1; calls against them are silent no-ops.
   */
  resizeWidget: (id: string, size: CellSize) => void
  /**
   * Re-add a recipe widget that was previously dismissed via
   * `removeWidget`. Appends a fresh `recipe` slot at the end of the
   * order; the packer places it in the first free cell.
   */
  unhideWidget: (id: string) => void
  /**
   * Re-seed dashboard, dock, and hidden state from the recipe defaults.
   * Used by the Customize bar's "Reset to default" command.
   */
  resetToDefault: () => void
  /**
   * Switch the placement store over to a different recipe. Discards
   * any per-slot customization the user made on the previous recipe
   * (the prototype's "switching sites = different universe" mental
   * model). Called by the recipe-store subscription below whenever
   * `activeRecipeId` changes.
   */
  reseed: (recipeId: RecipeId) => void
}

function pinnedIdFor(action: ContextRef): string {
  return `tile:${refKey(action)}`
}

function pinnedFromNavItem(item: NavItem): PinnedItem | null {
  if (!item.icon) return null
  return {
    id: pinnedIdFor(item.action),
    action: item.action,
    title: item.title,
    icon: item.icon,
    badge: item.badge,
  }
}

function allNavItems(recipe: Recipe): NavItem[] {
  return recipe.widgets
    .filter((w): w is NavWidget => w.kind === "nav")
    .flatMap((w) => w.items)
}

/**
 * Look up a nav item whose action resolves to the same key as `action`.
 * Lets manually-added pins inherit any badge defined on the matching
 * nav item, so they look the same as seeded defaults.
 */
function navItemFor(recipe: Recipe, action: ContextRef): NavItem | undefined {
  const key = refKey(action)
  return allNavItems(recipe).find((i) => refKey(i.action) === key)
}

/** Resolve the active recipe via the recipe store. */
function activeRecipe(): Recipe {
  return recipeFor(useRecipe.getState().activeRecipeId)
}

/**
 * Lower-bound floor for the slot's footprint. Mirrors `applyResizeDelta`'s
 * default — widgets without a declared `minSize` collapse to 1×1.
 */
function minSizeFor(widget: WidgetDef | null): CellSize {
  if (!widget?.minSize) return { w: 1, h: 1 }
  return { w: widget.minSize.w, h: widget.minSize.h }
}

/**
 * Identifier shared by both slot kinds — used by the DnD layer (which
 * sees only ids over the wire) to look up a slot in `dashboardOrder`.
 */
export function slotId(slot: DashboardSlot): string {
  return slot.kind === "pinned" ? slot.pinned.id : slot.widgetId
}

/** True when the slot's id is a pinned launch tile (always 1×1). */
function isLaunchSlot(slot: DashboardSlot): boolean {
  return slot.kind === "pinned"
}

function seedFromRecipe(recipe: Recipe): {
  dashboardOrder: DashboardSlot[]
  dock: PinnedItem[]
} {
  // Walk the recipe in declared order so the recipe's *position* of
  // the nav widget controls where its dashboard launch tiles seed
  // (e.g. blogger puts nav between stats and the Recently info widget
  // to get a stats → tiles → list stack). Recipes whose nav widget
  // is the last entry — like admin and editorial — keep their
  // existing behaviour where launch tiles flow underneath all the
  // info/analytics widgets.
  const dashboardOrder: DashboardSlot[] = []
  const dock: PinnedItem[] = []

  for (const w of recipe.widgets) {
    if (
      w.kind === "info" ||
      w.kind === "analytics" ||
      w.kind === "site-preview" ||
      w.kind === "tasks"
    ) {
      dashboardOrder.push({
        kind: "recipe",
        widgetId: w.id,
        size: resolveWidgetSize(w.size),
      })
    } else if (w.kind === "nav") {
      for (const item of w.items) {
        const pinned = pinnedFromNavItem(item)
        if (!pinned) continue
        if (item.defaultPlacement === "dashboard") {
          dashboardOrder.push({ kind: "pinned", pinned, size: { w: 1, h: 1 } })
        } else {
          dock.push(pinned)
        }
      }
    }
  }

  return { dashboardOrder, dock }
}

/** True when `slot` is a pinned launch tile with the given `pinnedId`. */
function isPinnedSlot(slot: DashboardSlot, pinnedId: string): boolean {
  return slot.kind === "pinned" && slot.pinned.id === pinnedId
}

/** True when `slot` is a recipe widget with the given `widgetId`. */
function isRecipeSlot(slot: DashboardSlot, widgetId: string): boolean {
  return slot.kind === "recipe" && slot.widgetId === widgetId
}

/**
 * Apply `transform` to the slot in `order` whose id is `id`, returning
 * the new array (or the original reference if `id` isn't found, so
 * Zustand can short-circuit). Used by `resizeWidget`.
 */
function updateSlotById(
  order: DashboardSlot[],
  id: string,
  transform: (s: DashboardSlot) => DashboardSlot,
): DashboardSlot[] {
  const idx = order.findIndex((s) => slotId(s) === id)
  if (idx < 0) return order
  const next = order.slice()
  next[idx] = transform(order[idx])
  return next
}

export const usePlacement = create<PlacementState>((set, get) => {
  const seed = seedFromRecipe(recipeFor(DEFAULT_RECIPE_ID))
  return {
    dashboardOrder: seed.dashboardOrder,
    dock: seed.dock,
    hiddenWidgetIds: [],

    placementOf: (action) => {
      const id = pinnedIdFor(action)
      const state = get()
      if (state.dashboardOrder.some((s) => isPinnedSlot(s, id))) {
        return "dashboard"
      }
      if (state.dock.some((p) => p.id === id)) return "dock"
      return "none"
    },

    setPlacement: (action, next, meta, insertAt) => {
      const id = pinnedIdFor(action)
      const state = get()

      const existingDashboardSlot = state.dashboardOrder.find((s) =>
        isPinnedSlot(s, id),
      )
      const existingPinned: PinnedItem | undefined =
        existingDashboardSlot?.kind === "pinned"
          ? existingDashboardSlot.pinned
          : state.dock.find((p) => p.id === id)

      const nextOrder = state.dashboardOrder.filter(
        (s) => !isPinnedSlot(s, id),
      )
      const nextDock = state.dock.filter((p) => p.id !== id)

      if (next === "none") {
        const noChange =
          nextOrder.length === state.dashboardOrder.length &&
          nextDock.length === state.dock.length
        if (noChange) return
        set({ dashboardOrder: nextOrder, dock: nextDock })
        return
      }

      let item: PinnedItem | null = existingPinned ?? null
      if (!item) {
        if (!meta) return
        const navMatch = navItemFor(activeRecipe(), action)
        item = {
          id,
          action,
          title: meta.title,
          icon: meta.icon,
          badge: meta.badge ?? navMatch?.badge,
          description: meta.description,
        }
      }

      if (next === "dashboard") {
        const newSlot: DashboardSlot = {
          kind: "pinned",
          pinned: item,
          size: { w: 1, h: 1 },
        }
        // `insertAt` lets cross-surface drags drop at the cursor's
        // resolved insertion index. Omitted by menu-driven adds, which
        // append and let pack() drop the slot in the first free cell.
        const targetIndex =
          insertAt === undefined
            ? nextOrder.length
            : Math.max(0, Math.min(nextOrder.length, insertAt))
        const dashboardOrderNext = [
          ...nextOrder.slice(0, targetIndex),
          newSlot,
          ...nextOrder.slice(targetIndex),
        ]
        set({
          dashboardOrder: dashboardOrderNext,
          dock: nextDock,
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      } else {
        set({
          dashboardOrder: nextOrder,
          dock: [...nextDock, item],
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
      }
    },

    removeWidget: (id) => {
      const state = get()

      const pinnedSlot = state.dashboardOrder.find((s) => isPinnedSlot(s, id))
      if (pinnedSlot) {
        set({
          dashboardOrder: state.dashboardOrder.filter(
            (s) => !isPinnedSlot(s, id),
          ),
        })
        return
      }

      const recipeSlot = state.dashboardOrder.find((s) => isRecipeSlot(s, id))
      const alreadyHidden = state.hiddenWidgetIds.includes(id)
      if (!recipeSlot && alreadyHidden) return
      set({
        dashboardOrder: recipeSlot
          ? state.dashboardOrder.filter((s) => !isRecipeSlot(s, id))
          : state.dashboardOrder,
        hiddenWidgetIds: alreadyHidden
          ? state.hiddenWidgetIds
          : [...state.hiddenWidgetIds, id],
      })
    },

    isHidden: (id) => get().hiddenWidgetIds.includes(id),

    reorderWidget: (id, toIndex) => {
      const state = get()
      const fromIndex = state.dashboardOrder.findIndex(
        (s) => slotId(s) === id,
      )
      if (fromIndex < 0) return
      const clampedTo = Math.max(
        0,
        Math.min(state.dashboardOrder.length - 1, toIndex),
      )
      const next = reorderArray(state.dashboardOrder, fromIndex, clampedTo)
      if (next === state.dashboardOrder) return
      set({ dashboardOrder: next })
    },

    resizeWidget: (id, size) => {
      const state = get()
      const slot = state.dashboardOrder.find((s) => slotId(s) === id)
      if (!slot) return
      // Launch tiles can't resize — silently ignore so the DnD layer
      // doesn't have to special-case the affordance.
      if (isLaunchSlot(slot)) return
      const min = minSizeFor(slotToWidget(slot))
      const nextSize: CellSize = {
        w: Math.max(min.w, Math.min(size.w, CANONICAL_COLS)),
        h: Math.max(min.h, size.h),
      }
      if (slot.size.w === nextSize.w && slot.size.h === nextSize.h) return
      const next = updateSlotById(state.dashboardOrder, id, (s) => ({
        ...s,
        size: nextSize,
      }))
      if (next === state.dashboardOrder) return
      set({ dashboardOrder: next })
    },

    unhideWidget: (id) => {
      const state = get()
      if (!state.hiddenWidgetIds.includes(id)) return
      const recipeWidget = activeRecipe().widgets.find((w) => w.id === id)
      const isRecipeWidget =
        recipeWidget?.kind === "info" ||
        recipeWidget?.kind === "analytics" ||
        recipeWidget?.kind === "site-preview" ||
        recipeWidget?.kind === "tasks"
      if (!isRecipeWidget) {
        // Defensive — only recipe widgets land in hiddenWidgetIds, but
        // if something stale is in there, clear it without trying to
        // re-add a slot for an unknown id.
        set({
          hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        })
        return
      }
      set({
        hiddenWidgetIds: state.hiddenWidgetIds.filter((hid) => hid !== id),
        dashboardOrder: [
          ...state.dashboardOrder,
          {
            kind: "recipe",
            widgetId: id,
            size: resolveWidgetSize(recipeWidget.size),
          },
        ],
      })
    },

    resetToDefault: () => {
      const fresh = seedFromRecipe(activeRecipe())
      set({
        dashboardOrder: fresh.dashboardOrder,
        dock: fresh.dock,
        hiddenWidgetIds: [],
      })
    },

    reseed: (recipeId) => {
      const fresh = seedFromRecipe(recipeFor(recipeId))
      set({
        dashboardOrder: fresh.dashboardOrder,
        dock: fresh.dock,
        hiddenWidgetIds: [],
      })
    },
  }
})

// Whenever the active recipe changes (slice 2 wires the site switcher
// to `setActiveRecipeId`), reseed dashboard + dock + hidden state from
// the new recipe's defaults. Keeping this subscription here — rather
// than calling `reseed` from the recipe store's setter — preserves the
// store dependency direction (placement → recipe) and avoids any
// circular-import surface.
useRecipe.subscribe((state, prev) => {
  if (state.activeRecipeId === prev.activeRecipeId) return
  usePlacement.getState().reseed(state.activeRecipeId)
})
