import { useMemo, type ReactNode } from "react"
import { useContexts } from "@/contexts/store"
import {
  scheduledArticles,
  scheduledDay,
  type Article,
  type ArticleSection,
} from "@/mocks/articles"

/**
 * The "current" month the editorial calendar paints. Hardcoded for
 * the prototype so a viewer always sees a populated grid (the
 * scheduled article dates in the mock all sit in May 2026). In a
 * real install this would track the system clock and the user's
 * timezone.
 */
const CALENDAR_YEAR = 2026
const CALENDAR_MONTH = 4 // 0-indexed → May

const MONTH_LABEL = new Date(CALENDAR_YEAR, CALENDAR_MONTH).toLocaleDateString(
  "en-GB",
  { month: "long", year: "numeric" },
)

/** Mon-first headings — matches the publication's UK editorial week. */
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

/** Tailwind classes that translate `SECTION_VARIANT` to a chip swatch. */
const SECTION_DOT: Record<ArticleSection, string> = {
  News: "bg-info/16 text-info-foreground",
  Culture: "bg-secondary text-secondary-foreground",
  Reviews: "bg-muted text-foreground",
  "Long reads": "bg-warning/16 text-warning-foreground",
  Interviews: "bg-success/16 text-success-foreground",
}

type CalendarCell = {
  /** Day-of-month, or `null` for cells outside the current month. */
  day: number | null
  /** Whether this cell represents the prototype's "today". */
  isToday: boolean
  /** Articles scheduled to publish on this day. */
  articles: Article[]
}

/**
 * Build the 6×7 (Mon-first) cell grid for the displayed month. Empty
 * leading cells precede day 1 to align it under the correct weekday;
 * trailing empty cells fill the final row so the grid stays
 * rectangular. Articles are bucketed onto cells via `scheduledDay`.
 */
function buildCalendarCells(today: number): CalendarCell[] {
  const firstOfMonth = new Date(CALENDAR_YEAR, CALENDAR_MONTH, 1)
  // Date.getDay returns Sunday=0..Saturday=6. Convert to Mon-first so
  // the leading-blank count aligns with `WEEKDAY_LABELS`.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(
    CALENDAR_YEAR,
    CALENDAR_MONTH + 1,
    0,
  ).getDate()

  const articlesByDay = new Map<number, Article[]>()
  for (const a of scheduledArticles()) {
    const day = scheduledDay(a)
    if (day === null) continue
    const list = articlesByDay.get(day) ?? []
    list.push(a)
    articlesByDay.set(day, list)
  }

  const cells: CalendarCell[] = []
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ day: null, isToday: false, articles: [] })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      isToday: day === today,
      articles: articlesByDay.get(day) ?? [],
    })
  }
  // Pad to a 6-row grid (42 cells) so the calendar's footprint never
  // jumps when the month boundary shifts. February with leading 0
  // blanks fits in 5 rows; everything else needs 6 to be safe.
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ day: null, isToday: false, articles: [] })
  }
  return cells
}

/**
 * Month-grid editorial calendar. Renders inside an `InfoWidget`'s
 * `render` slot (the host card supplies the title + chrome). Each
 * day cell shows up to two scheduled-article chips colour-coded by
 * section; overflow is truncated to "+N more". Clicking a chip opens
 * the article in the editor.
 *
 * Layout adapts to the cell footprint: with the recipe's authored
 * `{ w: 6, h: 4 }` the cells are large enough to fit the article
 * title; at smaller hand-resized footprints the chips collapse to
 * just their section indicator dot.
 */
export function EditorialCalendar() {
  const open = useContexts((s) => s.open)
  // The prototype pretends "today" is May 5 — a date that lands on a
  // workday and has a scheduled article on it, so the highlight reads
  // as both an action item and a calendar locator.
  const today = 5
  const cells = useMemo(() => buildCalendarCells(today), [today])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-baseline justify-between pb-2">
        <p className="text-base font-medium tabular-nums">{MONTH_LABEL}</p>
        <p className="text-[11px] text-muted-foreground">
          {scheduledArticles().length} scheduled
        </p>
      </div>
      <div
        role="grid"
        aria-label={`Editorial calendar for ${MONTH_LABEL}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div role="row" className="grid shrink-0 grid-cols-7 gap-px">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              role="columnheader"
              className="px-1.5 pb-1.5 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-md bg-border">
          {cells.map((cell, i) => (
            <CalendarDayCell
              key={i}
              cell={cell}
              onOpen={(article, rect) =>
                open(
                  {
                    type: "editor",
                    params: { kind: "post", id: article.id },
                    // Carry the article's actual headline so the opened
                    // editor's title (tile, dock, recents) matches the
                    // chip the user just clicked, instead of falling
                    // back to the slug-derived "Housing investigation".
                    title: article.title,
                  },
                  rect,
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarDayCell({
  cell,
  onOpen,
}: {
  cell: CalendarCell
  onOpen: (article: Article, rect: DOMRect) => void
}): ReactNode {
  const isOutside = cell.day === null
  const visible = cell.articles.slice(0, 2)
  const overflow = cell.articles.length - visible.length

  return (
    <div
      role="gridcell"
      aria-disabled={isOutside}
      className={`flex min-h-0 flex-col gap-1 px-1.5 py-1 ${
        isOutside ? "bg-muted/30" : "bg-card"
      }`}
    >
      {cell.day !== null ? (
        <span
          className={`shrink-0 text-[10px] font-medium tabular-nums leading-none ${
            cell.isToday
              ? "inline-flex size-4 items-center justify-center self-start rounded-full bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
          aria-label={cell.isToday ? `Today, ${cell.day}` : undefined}
        >
          {cell.day}
        </span>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {visible.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={(e) =>
              onOpen(article, e.currentTarget.getBoundingClientRect())
            }
            title={`${article.title} · ${article.author}`}
            className={`flex min-w-0 items-center gap-1 truncate rounded-sm px-1 py-0.5 text-left text-[10px] font-medium leading-tight outline-none transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-ring ${
              SECTION_DOT[article.section]
            }`}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-current opacity-72"
            />
            <span className="min-w-0 flex-1 truncate">{article.title}</span>
          </button>
        ))}
        {overflow > 0 ? (
          <span className="px-1 text-[10px] text-muted-foreground">
            +{overflow} more
          </span>
        ) : null}
      </div>
      {/*
        Section colour key is rendered globally beneath the calendar
        rather than once per cell to keep the cells legible at small
        sizes — the chip's bg colour itself doubles as the indicator.
      */}
    </div>
  )
}

/**
 * Recipe-friendly wrapper. Same rationale as `renderQuickDraft`:
 * keeps `recipes/editorial.ts` on the data side of Vite's Fast
 * Refresh boundary so HMR doesn't drop unrelated icon bindings
 * between edits.
 */
export function renderEditorialCalendar(): ReactNode {
  return <EditorialCalendar />
}
