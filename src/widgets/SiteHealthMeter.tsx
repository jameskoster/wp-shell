import type { ReactNode } from "react"
import { ChevronRight, Plug } from "lucide-react"
import { useContexts } from "@/contexts/store"
import type { ContextRef } from "@/contexts/types"

/**
 * Score meter for the WordPress Site Health widget.
 *
 * Renders a large central score + SVG circular progress ring, plus a
 * link that opens a dedicated Site Health context. Designed to slot
 * into `InfoWidget`'s `render` escape hatch — the host card supplies
 * its own header (title + "WordPress" source).
 *
 * The score → color mapping mirrors the WordPress core convention:
 * good (≥80), should-be-improved (≥50), critical (<50).
 */
type SiteHealthMeterProps = {
  score: number
  total?: number
  status?: string
  action?: ContextRef
  linkLabel?: string
  /**
   * Optional pending-update count rolled into the same widget. When > 0,
   * a separate clickable line surfaces the count and routes to the
   * Plugins workspace, where the user can apply the updates. Updates
   * intentionally share real estate with Site Health because the JTBD
   * is the same — "is there site maintenance I should do right now?".
   */
  updates?: number
  updatesAction?: ContextRef
}

export function SiteHealthMeter({
  score,
  total = 100,
  status,
  action = {
    type: "edit-page",
    params: { id: "site-health" },
    title: "Site Health",
  },
  linkLabel = "View details",
  updates,
  updatesAction = {
    type: "edit-page",
    params: { id: "plugins" },
    title: "Plugins",
  },
}: SiteHealthMeterProps) {
  const open = useContexts((s) => s.open)
  const pct = Math.max(0, Math.min(1, score / total))

  // Mirror Site Health's red/amber/green status semantics. Token names
  // align with the rest of the shell (success/warning/destructive).
  const tone =
    pct >= 0.8 ? "success" : pct >= 0.5 ? "warning" : "destructive"
  const ringClass =
    tone === "success"
      ? "text-success-foreground"
      : tone === "warning"
        ? "text-warning-foreground"
        : "text-destructive-foreground"
  const resolvedStatus =
    status ??
    (tone === "success"
      ? "Good"
      : tone === "warning"
        ? "Should be improved"
        : "Needs attention")

  const radius = 32
  const stroke = 6
  const size = (radius + stroke) * 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3">
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="presentation"
          className={ringClass}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.16}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums leading-none">
            {Math.round(pct * 100)}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            / {total}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium">{resolvedStatus}</span>
        {updates && updates > 0 ? (
          <button
            type="button"
            onClick={(e) =>
              open(updatesAction, e.currentTarget.getBoundingClientRect())
            }
            className="inline-flex items-center gap-1 rounded-sm text-xs text-warning-foreground outline-none transition-colors hover:underline focus-visible:underline"
          >
            <Plug className="size-3" />
            {updates} update{updates === 1 ? "" : "s"} available
          </button>
        ) : null}
        <button
          type="button"
          onClick={(e) =>
            open(action, e.currentTarget.getBoundingClientRect())
          }
          className="inline-flex items-center gap-0.5 rounded-sm text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          {linkLabel}
          <ChevronRight className="size-3" />
        </button>
      </div>
    </div>
  )
}

/**
 * Recipe-friendly wrapper for the meter. Lives next to the component
 * so `recipes/admin.ts` stays free of React imports / `createElement`
 * calls — that keeps the recipe on the data side of Vite's Fast
 * Refresh boundary, so HMR doesn't drop its lucide-react bindings
 * between edits (which manifested as runtime `ReferenceError` for
 * unrelated icons like `Globe`).
 */
export function renderSiteHealth(): ReactNode {
  return (
    <SiteHealthMeter score={78} status="Should be improved" updates={2} />
  )
}
