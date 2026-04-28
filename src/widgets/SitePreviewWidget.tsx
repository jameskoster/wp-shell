import { useLayoutEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { useContexts } from "@/contexts/store"
import { launchKey } from "@/contexts/registry"
import { cn } from "@/lib/utils"
import { Canvas, homepageDoc } from "@/workflows/editor/Canvas"
import type { SitePreviewWidget as SitePreviewWidgetDef } from "./types"
import { WidgetMenu } from "./WidgetMenu"

/**
 * The "site width" the homepage canvas is laid out for. Picked to
 * roughly match a desktop browser viewport, so the preview reads as
 * "this is what your site looks like" rather than a reflowed mobile
 * layout. The widget renders the canvas at this fixed pixel width and
 * scales the wrapper down to fit the actual cell — same trick the
 * shell uses for context tiles in the workspace switcher.
 */
const PREVIEW_SITE_WIDTH = 1280

/**
 * Live preview of the storefront homepage. Renders the same `Canvas`
 * the editor renders (with `doc.isFrontPage`, which routes to the
 * eCommerce homepage layout), scaled to whatever cell the dashboard
 * grid hands us.
 *
 * Behaves as a single click-target — clicking anywhere opens
 * `widget.action` (typically the Appearance / Editor workspace landed
 * on the homepage). The embedded canvas is `inert` + `pointer-events-
 * none` so its visual buttons / nav don't compete with the wrapper's
 * click.
 */
export function SitePreviewWidget({
  widget,
}: {
  widget: SitePreviewWidgetDef
}) {
  const open = useContexts((s) => s.open)
  const Icon = widget.icon
  const stageRef = useRef<HTMLDivElement | null>(null)
  const scale = useFitToWidth(stageRef, PREVIEW_SITE_WIDTH)

  return (
    <div className="group relative h-full">
      <Card
        render={
          <button
            type="button"
            data-launch-key={launchKey(widget.action)}
            onClick={(e) =>
              open(widget.action, e.currentTarget.getBoundingClientRect())
            }
            className="relative flex h-full w-full flex-col overflow-hidden p-0 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
        }
      >
        <div
          ref={stageRef}
          className={cn(
            "relative h-full w-full overflow-hidden bg-white dark:bg-neutral-950",
            // Subtle zoom on hover/focus to hint that the preview is a
            // single click-through; the chrome darkens in lockstep so
            // the title overlay stays legible at any zoom.
            "transition-transform duration-300 ease-out",
            "group-hover:scale-[1.02] group-focus-within:scale-[1.02]",
          )}
        >
          <div
            // Render the canvas at its design width and scale to fit.
            // `pointer-events-none` and `inert` together guarantee the
            // canvas's interactive-looking elements (nav links, "Add to
            // cart") never steal the wrapper button's click, even if
            // they grow real handlers later.
            inert
            aria-hidden
            className="pointer-events-none origin-top-left select-none"
            style={{
              width: PREVIEW_SITE_WIDTH,
              transform: `scale(${scale})`,
            }}
          >
            <Canvas doc={homepageDoc()} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-5 text-white">
            {Icon ? <Icon className="size-4 opacity-80" /> : null}
            <span className="truncate text-sm font-medium drop-shadow-sm">
              {widget.title}
            </span>
            {widget.caption ? (
              <span className="ml-auto truncate text-xs opacity-80 drop-shadow-sm">
                {widget.caption}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
      <WidgetMenu
        widgetId={widget.id}
        // White-on-dark variant — the menu sits over the photo, where
        // the standard muted-foreground icon would disappear into the
        // gradient.
        className="absolute top-3 right-3 z-20 text-white/90 hover:text-white"
      />
    </div>
  )
}

/**
 * Observe `ref`'s width and return the scale factor that fits a
 * `designWidth`-pixel-wide child inside it. Re-measures on every
 * container resize so the preview re-fits as the grid reflows
 * breakpoints / the user resizes the slot.
 *
 * Returns 1 until the first measurement lands, which keeps SSR /
 * first-paint stable — at most one frame at full pre-scale width.
 */
function useFitToWidth(
  ref: React.RefObject<HTMLElement | null>,
  designWidth: number,
): number {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    function measure() {
      const node = ref.current
      if (!node) return
      const w = node.clientWidth
      if (w <= 0) return
      setScale(w / designWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, designWidth])

  return scale
}
