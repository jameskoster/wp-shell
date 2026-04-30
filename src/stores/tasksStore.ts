import { create } from "zustand"
import type { TaskItem } from "@/widgets/types"

/**
 * Per-task completion state for every `TasksWidget` on the dashboard.
 * Keys are namespaced as `${widgetId}:${taskId}` so two recipes can
 * declare a task with the same id without colliding (each widget
 * owns its own list).
 *
 * Recipes seed initial state via `done` on each `TaskItem`; the store
 * is the source of truth after first render. Like the other prototype
 * stores it lives in memory only — a real implementation would persist
 * per-user, but checking a task off and back on across a session is
 * enough to demonstrate the interaction.
 */
type TasksState = {
  done: Record<string, boolean>
  /**
   * Seed completion state for a widget's tasks. Idempotent: only
   * fills in keys that aren't already tracked, so user toggles
   * survive recipe re-evaluation (HMR, site switches that keep the
   * same widget id, etc.).
   */
  seed: (widgetId: string, tasks: TaskItem[]) => void
  toggle: (widgetId: string, taskId: string) => void
  /** True iff the namespaced key is recorded as complete. */
  isDone: (widgetId: string, taskId: string) => boolean
}

const keyOf = (widgetId: string, taskId: string) => `${widgetId}:${taskId}`

export const useTasks = create<TasksState>((set, get) => ({
  done: {},

  seed: (widgetId, tasks) => {
    const current = get().done
    let next: Record<string, boolean> | null = null
    for (const t of tasks) {
      const k = keyOf(widgetId, t.id)
      if (k in current) continue
      if (next === null) next = { ...current }
      next[k] = Boolean(t.done)
    }
    if (next !== null) set({ done: next })
  },

  toggle: (widgetId, taskId) => {
    const k = keyOf(widgetId, taskId)
    set((state) => ({ done: { ...state.done, [k]: !state.done[k] } }))
  },

  isDone: (widgetId, taskId) => Boolean(get().done[keyOf(widgetId, taskId)]),
}))
