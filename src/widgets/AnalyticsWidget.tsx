import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardPanel,
} from "@/components/ui/card"
import type { AnalyticsWidget as AnalyticsWidgetDef, WidgetSize } from "./types"
import { WidgetMenu } from "./WidgetMenu"

function Sparkline({ points, tall }: { points: number[]; tall?: boolean }) {
  if (points.length < 2) return null
  const w = 120
  const h = tall ? 64 : 32
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const path = points
    .map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`${tall ? "h-16" : "h-8"} w-full text-foreground/64`}
      role="presentation"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TREND_ICON = {
  up: ArrowUp,
  down: ArrowDown,
  flat: ArrowRight,
} as const

const TREND_COLOR = {
  up: "text-success-foreground",
  down: "text-destructive-foreground",
  flat: "text-muted-foreground",
} as const

export function AnalyticsWidget({
  widget,
  size = "md",
}: {
  widget: AnalyticsWidgetDef
  size?: WidgetSize
}) {
  const Icon = widget.icon
  const TrendIcon = widget.metric.delta ? TREND_ICON[widget.metric.delta.trend] : null
  const trendColor = widget.metric.delta ? TREND_COLOR[widget.metric.delta.trend] : ""

  const compact = size === "sm"
  const showSparkline = !compact && Boolean(widget.metric.sparkline)
  const showCaption = !compact && Boolean(widget.metric.caption)
  const tallSparkline = size === "lg" || size === "xl"

  return (
    <Card className="group h-full overflow-hidden">
      <WidgetMenu
        widgetId={widget.id}
        className="absolute top-3 right-3 z-10"
      />
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
          <span className="truncate">{widget.title}</span>
        </CardTitle>
      </CardHeader>
      <CardPanel className="pt-0 flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {widget.metric.value}
          </span>
          {widget.metric.delta ? (
            <span className={`inline-flex items-center gap-0.5 text-xs ${trendColor}`}>
              {TrendIcon ? <TrendIcon className="size-3" /> : null}
              {widget.metric.delta.value}
            </span>
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
