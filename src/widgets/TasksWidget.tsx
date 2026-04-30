import { useEffect, useMemo } from "react"
import { ChevronRight, CircleCheck } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationBadge } from "@/components/NotificationBadge"
import { useContexts } from "@/contexts/store"
import { useTasks } from "@/stores/tasksStore"
import { cn } from "@/lib/utils"
import type {
  TasksWidget as TasksWidgetDef,
  TaskItem,
  WidgetSize,
} from "./types"
import { WidgetMenu } from "./WidgetMenu"

/**
 * Task list widget — a checkable, progress-aware list. Recipes author
 * `tasks` declaratively (id, title, optional description, optional
 * `action` to open a workflow); per-task completion lives in
 * `useTasks`, namespaced by widget id so two recipes can share task
 * ids without colliding.
 *
 * Adapts to the slot's cell footprint via the same density token the
 * other widgets consume:
 *
 *  - `sm` collapses to a single "X of N done" summary line.
 *  - `md` / `tall` show a clipped list (no scroll) so the widget
 *    doesn't overflow before the scroll area kicks in.
 *  - `lg` / `wide` / `xl` / `hero` show the full list inside a
 *    `ScrollArea`, mirroring `InfoWidget`.
 *
 * Once every task is checked, the body switches to a celebratory
 * empty state instead of an empty list.
 */
export function TasksWidget({
  widget,
  size = "md",
}: {
  widget: TasksWidgetDef
  size?: WidgetSize
}) {
  const Icon = widget.icon
  const tasks = widget.tasks
  const seed = useTasks((s) => s.seed)
  const doneMap = useTasks((s) => s.done)

  // Seed initial completion state once per widget. `seed` is
  // idempotent (it skips keys it already tracks), so this is safe to
  // re-run on every recipe re-evaluation.
  useEffect(() => {
    seed(widget.id, tasks)
  }, [seed, widget.id, tasks])

  const { doneCount, allDone, remaining } = useMemo(() => {
    let count = 0
    for (const t of tasks) {
      if (doneMap[`${widget.id}:${t.id}`]) count++
    }
    return {
      doneCount: count,
      allDone: tasks.length > 0 && count === tasks.length,
      remaining: tasks.length - count,
    }
  }, [tasks, doneMap, widget.id])

  const compact = size === "sm"
  const useScroll =
    size === "lg" ||
    size === "wide" ||
    size === "xl" ||
    size === "hero"
  const visibleTasks =
    size === "md" || size === "tall" ? tasks.slice(0, 3) : tasks

  const pct = tasks.length === 0 ? 0 : doneCount / tasks.length
  // Header badge: show outstanding count when authored, else fall
  // back to the live remaining count so the widget always advertises
  // its own urgency without the recipe having to compute it.
  const headerBadge = widget.headerBadge ?? (remaining > 0 ? remaining : undefined)

  return (
    <Card className="group h-full overflow-hidden">
      <WidgetMenu
        widgetId={widget.id}
        className="absolute top-3 right-3 z-10"
      />
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2 pr-8">
          {Icon ? <Icon className="size-4 text-muted-foreground shrink-0" /> : null}
          <span className="truncate">{widget.title}</span>
          <NotificationBadge
            count={headerBadge}
            className="shrink-0"
            aria-label={
              headerBadge ? `${headerBadge} remaining` : undefined
            }
          />
        </CardTitle>
        {!compact ? (
          <CardDescription className="text-[11px] truncate">
            {tasks.length === 0
              ? "No tasks."
              : allDone
                ? "All done."
                : `${doneCount} of ${tasks.length} done`}
          </CardDescription>
        ) : null}
        {!compact && tasks.length > 0 ? (
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={tasks.length}
            aria-valuenow={doneCount}
            aria-label={`${doneCount} of ${tasks.length} tasks done`}
          >
            <div
              className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        ) : null}
      </CardHeader>
      <CardPanel className="pt-0 min-h-0 overflow-hidden">
        {compact ? (
          <p className="text-xs text-muted-foreground">
            {tasks.length === 0
              ? "No tasks."
              : allDone
                ? "All done."
                : `${doneCount} of ${tasks.length} done`}
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks.</p>
        ) : allDone ? (
          <AllDoneState message={widget.completeMessage} />
        ) : useScroll ? (
          <ScrollArea className="h-full" scrollFade>
            <TaskList widgetId={widget.id} tasks={tasks} />
          </ScrollArea>
        ) : (
          <TaskList widgetId={widget.id} tasks={visibleTasks} />
        )}
      </CardPanel>
    </Card>
  )
}

function TaskList({
  widgetId,
  tasks,
}: {
  widgetId: string
  tasks: TaskItem[]
}) {
  const open = useContexts((s) => s.open)
  const toggle = useTasks((s) => s.toggle)
  const doneMap = useTasks((s) => s.done)

  return (
    <ul role="list">
      {tasks.map((task) => {
        const done = Boolean(doneMap[`${widgetId}:${task.id}`])
        const checkboxId = `task-${widgetId}-${task.id}`
        return (
          <li key={task.id} className="flex items-start gap-3 py-1.5">
            <Checkbox
              id={checkboxId}
              className="mt-0.5"
              checked={done}
              onCheckedChange={() => toggle(widgetId, task.id)}
              aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
            />
            <TaskBody
              task={task}
              done={done}
              checkboxId={checkboxId}
              onOpen={(rect) => task.action && open(task.action, rect)}
            />
          </li>
        )
      })}
    </ul>
  )
}

function TaskBody({
  task,
  done,
  checkboxId,
  onOpen,
}: {
  task: TaskItem
  done: boolean
  checkboxId: string
  onOpen: (rect: DOMRect) => void
}) {
  const titleClass = cn(
    "block truncate text-sm font-medium leading-tight",
    done && "text-muted-foreground line-through",
  )
  const descriptionClass = cn(
    "mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2",
    done && "line-through",
  )

  // When the task carries an action, the body is a launcher button —
  // clicking opens the workflow that actually performs the task,
  // while the checkbox stays the affordance for "I've handled this".
  // Without an action, the body falls back to a passive label tied to
  // the checkbox so clicking the text toggles the state (the natural
  // <label> behaviour).
  if (task.action) {
    return (
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
        className="group/task min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-1">
          <span className={cn("min-w-0 flex-1", titleClass)}>{task.title}</span>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/task:opacity-100 group-focus-visible/task:opacity-100" />
        </div>
        {task.description ? (
          <p className={descriptionClass}>{task.description}</p>
        ) : null}
      </button>
    )
  }

  return (
    <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
      <span className={titleClass}>{task.title}</span>
      {task.description ? (
        <span className={descriptionClass}>{task.description}</span>
      ) : null}
    </label>
  )
}

function AllDoneState({ message }: { message?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-2 text-center">
      <CircleCheck
        className="size-8 text-success-foreground"
        strokeWidth={1.5}
      />
      <p className="text-xs text-muted-foreground">
        {message ?? "All done."}
      </p>
    </div>
  )
}
