import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardPanel,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useContexts } from "@/contexts/store"
import type { AnalyticsWidget as AnalyticsWidgetDef, WidgetSize } from "./types"
import { WidgetMenu } from "./WidgetMenu"

function Sparkline({ points, tall }: { points: number[]; tall?: boolean }) {
  if (points.length < 2) return null
  const w = 120
  const h = tall ? 64 : 32
  // Inset the curve so rounded caps and the peaks/troughs aren't clipped
  // by the viewBox edges; the area fill still extends to the bottom.
  const pad = 1.5
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const coords = points.map((v, i) => ({
    x: i * step,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }))

  // Catmull-Rom through the points, expressed as cubic Bezier segments.
  // Tension 0.5 reads as a relaxed, organic curve without overshoot.
  const tension = 0.5
  const linePath = coords
    .map((p, i, arr) => {
      if (i === 0) return `M${p.x.toFixed(2)},${p.y.toFixed(2)}`
      const p0 = arr[i - 2] ?? arr[i - 1]
      const p1 = arr[i - 1]
      const p2 = p
      const p3 = arr[i + 1] ?? p
      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3
      return `C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
    })
    .join(" ")
  const areaPath = `${linePath} L${w.toFixed(2)},${h.toFixed(2)} L0,${h.toFixed(2)} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`${tall ? "h-16" : "h-8"} w-full text-foreground/64`}
      role="presentation"
    >
      <path
        d={areaPath}
        fill="currentColor"
        fillOpacity="0.08"
        stroke="none"
      />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

const TREND_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  flat: ArrowRight,
} as const

const TREND_VARIANT = {
  up: "success",
  down: "error",
  flat: "secondary",
} as const

export function AnalyticsWidget({
  widget,
  size = "md",
}: {
  widget: AnalyticsWidgetDef
  size?: WidgetSize
}) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon
  const TrendIcon = widget.metric.delta ? TREND_ICON[widget.metric.delta.trend] : null
  const trendVariant = widget.metric.delta
    ? TREND_VARIANT[widget.metric.delta.trend]
    : "secondary"

  const compact = size === "sm"
  const showSparkline = !compact && Boolean(widget.metric.sparkline)
  const showCaption = !compact && Boolean(widget.metric.caption)
  const tallSparkline =
    size === "lg" ||
    size === "wide" ||
    size === "xl" ||
    size === "hero"
  const valueClass =
    size === "lg" ||
    size === "wide" ||
    size === "xl" ||
    size === "hero"
      ? "text-4xl"
      : "text-3xl"

  return (
    <Card className="group h-full overflow-hidden">
      <WidgetMenu
        widgetId={widget.id}
        widgetTitle={widget.title}
        showSettings
        className="absolute top-3 right-3 z-10"
      />
      <CardHeader>
        {/*
          The title doubles as a launcher into the Analytics workspace —
          the metric on display is a teaser of what's there in full.
          Hover/focus styling is restrained so it reads as a label with
          a click affordance, not a call-to-action button.
        */}
        <CardTitle
          className="text-sm font-medium"
          render={
            <button
              type="button"
              onClick={(e) =>
                open(
                  { type: "analytics" },
                  e.currentTarget.getBoundingClientRect(),
                )
              }
              className="-mx-1 -my-0.5 flex max-w-full items-center gap-2 rounded-sm px-1 py-0.5 text-start outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
              <span className="truncate">{widget.title}</span>
            </button>
          }
        />
      </CardHeader>
      <CardPanel className="pt-0 flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-heading ${valueClass} font-semibold tabular-nums tracking-tight leading-none`}
          >
            {widget.metric.value}
          </span>
          {widget.metric.delta ? (
            <Badge variant={trendVariant} size="sm" className="gap-0.5">
              {TrendIcon ? <TrendIcon className="size-3" /> : null}
              {widget.metric.delta.value}
            </Badge>
          ) : null}
        </div>
        {showCaption ? (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {widget.metric.caption}
          </p>
        ) : null}
        {showSparkline ? (
          <div className="mt-auto pt-3">
            <Sparkline points={widget.metric.sparkline!} tall={tallSparkline} />
          </div>
        ) : null}
      </CardPanel>
    </Card>
  )
}
