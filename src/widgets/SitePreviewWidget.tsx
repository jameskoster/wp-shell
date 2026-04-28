import { useLayoutEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useContexts } from "@/contexts/store"
import { launchKey } from "@/contexts/registry"
import type { SitePreviewWidget as SitePreviewWidgetDef } from "./types"
import { Canvas, homepageDoc } from "@/workflows/editor/Canvas"
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
 * Layout — two stacked rows inside one Card:
 *  1. Address-bar row — browser-chrome themed strip with a URL pill
 *     and the widget menu. Sits OUTSIDE the click-target so future
 *     iterations can make the URL itself editable (the user's eventual
 *     intent: change the page being previewed) without nesting buttons.
 *  2. Canvas stage — the scaled homepage `Canvas`, overlaid with an
 *     invisible click-catcher `<button>` that opens `widget.action`
 *     (typically the Appearance / Editor workspace landed on the
 *     homepage). The canvas itself is `inert` + `pointer-events-none`
 *     so its visual buttons / nav can't compete with the catcher.
 */
export function SitePreviewWidget({
  widget,
}: {
  widget: SitePreviewWidgetDef
}) {
  const open = useContexts((s) => s.open)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const scale = useFitToWidth(stageRef, PREVIEW_SITE_WIDTH)
  const url = widget.url ?? "studiopark.example/"

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-0">
      <AddressBar url={url} widgetId={widget.id} />
      <div
        ref={stageRef}
        // Warm cream matches the eCommerce homepage's page bg so a
        // sub-frame paint never flashes admin-white through the gaps;
        // the canvas itself paints its own background once the scale
        // lands.
        className="relative flex-1 overflow-hidden bg-[#f4ede0] transition-transform duration-300 ease-out group-hover:scale-[1.02] group-focus-within:scale-[1.02] dark:bg-[#1c1813]"
      >
        <button
          type="button"
          aria-label={`Open ${widget.title}`}
          data-launch-key={launchKey(widget.action)}
          onClick={(e) =>
            open(widget.action, e.currentTarget.getBoundingClientRect())
          }
          // Click-catcher overlaid on the scaled canvas. No background
          // — the canvas underneath is the visual; this just turns the
          // whole stage into one click-target.
          className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        />
        <div
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
      </div>
    </Card>
  )
}

/**
 * Browser-chrome strip at the top of the widget. The URL pill is
 * non-functional today — it'll grow into an editable field that lets
 * the user swap the page being previewed (Posts / About / a specific
 * product). The widget menu (Remove) is anchored at the right; sitting
 * inside the chrome row keeps it visually separated from the canvas
 * (where it would otherwise overlap homepage content).
 */
function AddressBar({ url, widgetId }: { url: string; widgetId: string }) {
  return (
    <div className="relative z-20 flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/40 px-2.5 py-2 backdrop-blur">
      <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-full border border-border/60 bg-background px-3 text-xs text-muted-foreground shadow-xs/5">
        <Lock className="size-3 shrink-0" aria-hidden />
        <span className="truncate text-foreground/80">{url}</span>
      </div>
      <WidgetMenu widgetId={widgetId} alwaysVisible />
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
