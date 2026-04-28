import type { ReactNode } from "react"
import { ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react"
import { useContexts } from "@/contexts/store"
import type { ContextRef } from "@/contexts/types"

/**
 * Status panel for the Backups widget — visual companion to
 * `SiteHealthMeter`. Both widgets answer "is the site OK right now?",
 * so they share the same two-block composition (large status glyph at
 * top, status word + auxiliary line + link at the bottom). The seven
 * pulse dots underneath summarise the previous week of backups at a
 * glance — one per day, leftmost is oldest, so a recent failure shows
 * up on the right where the eye lands first.
 */
export type BackupDay = "ok" | "warn" | "fail" | "skipped"

type BackupStatusProps = {
  status: "healthy" | "warning" | "failed"
  /** Free-form line under the status, e.g. "Last backup 2h ago". */
  caption: string
  /** Oldest first; the rightmost dot is the most recent backup. */
  history?: BackupDay[]
  action?: ContextRef
  linkLabel?: string
}

const STATUS_LABEL: Record<BackupStatusProps["status"], string> = {
  healthy: "Healthy",
  warning: "At risk",
  failed: "Action needed",
}

const DOT_CLASS: Record<BackupDay, string> = {
  ok: "bg-success-foreground/64",
  warn: "bg-warning-foreground/72",
  fail: "bg-destructive-foreground/72",
  skipped: "bg-muted-foreground/24",
}

export function BackupStatus({
  status,
  caption,
  history = ["ok", "ok", "ok", "ok", "ok", "ok", "ok"],
  action = {
    type: "edit-page",
    params: { id: "backups" },
    title: "Backups",
  },
  linkLabel = "View backups",
}: BackupStatusProps) {
  const open = useContexts((s) => s.open)

  const Icon = status === "healthy" ? ShieldCheck : ShieldAlert
  const iconClass =
    status === "healthy"
      ? "text-success-foreground"
      : status === "warning"
        ? "text-warning-foreground"
        : "text-destructive-foreground"

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3">
      <Icon className={`size-16 ${iconClass}`} strokeWidth={1.5} />
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium">{STATUS_LABEL[status]}</span>
        <div
          className="flex items-center gap-1"
          role="img"
          aria-label={`${history.length}-day backup history`}
        >
          {history.map((day, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${DOT_CLASS[day]}`}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">{caption}</span>
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
 * Recipe-friendly wrapper. Same Fast Refresh rationale as
 * `renderSiteHealth` — keeps `recipes/admin.ts` on the data side of
 * Vite's HMR boundary so unrelated icon bindings don't drop between
 * edits.
 */
export function renderBackups(): ReactNode {
  return (
    <BackupStatus
      status="healthy"
      caption="Last backup 2h ago"
      history={["ok", "ok", "ok", "ok", "ok", "ok", "ok"]}
    />
  )
}
