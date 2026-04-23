import { useMemo } from "react"
import { Compass, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { adminRecipe } from "@/recipes/admin"
import { iconFor } from "@/contexts/registry"
import { refKey } from "@/contexts/url"
import { usePlacement } from "@/stores/placementStore"
import type {
  AnalyticsWidget,
  InfoWidget,
  NavItem,
  NavWidget,
} from "@/widgets/types"

type AddableLaunch = {
  kind: "launch"
  navItem: NavItem
}

type AddableRecipe = {
  kind: "info" | "analytics"
  widget: InfoWidget | AnalyticsWidget
}

type AddableSection = {
  label: string
  items: (AddableLaunch | AddableRecipe)[]
}

/**
 * Compute the "what can the user add right now?" lists from current
 * placement state. The three groups intentionally mirror the visual
 * grouping: launch tiles (re-pinnable nav items), informational, and
 * analytics widgets that have been removed via the per-widget menu.
 */
function useAddable(): {
  sections: AddableSection[]
  totalCount: number
} {
  const dashboardOrder = usePlacement((s) => s.dashboardOrder)
  const dock = usePlacement((s) => s.dock)
  const hiddenWidgetIds = usePlacement((s) => s.hiddenWidgetIds)

  return useMemo(() => {
    const navItems = adminRecipe.widgets
      .filter((w): w is NavWidget => w.kind === "nav")
      .flatMap((w) => w.items)

    const pinnedActionKeys = new Set<string>()
    for (const slot of dashboardOrder) {
      if (slot.kind === "pinned") pinnedActionKeys.add(refKey(slot.pinned.action))
    }
    for (const item of dock) pinnedActionKeys.add(refKey(item.action))

    const launchAddables: AddableLaunch[] = navItems
      .filter((item) => !pinnedActionKeys.has(refKey(item.action)))
      .map((navItem) => ({ kind: "launch" as const, navItem }))

    const hiddenSet = new Set(hiddenWidgetIds)
    const infoAddables: AddableRecipe[] = adminRecipe.widgets
      .filter(
        (w): w is InfoWidget => w.kind === "info" && hiddenSet.has(w.id),
      )
      .map((widget) => ({ kind: "info" as const, widget }))

    const analyticsAddables: AddableRecipe[] = adminRecipe.widgets
      .filter(
        (w): w is AnalyticsWidget =>
          w.kind === "analytics" && hiddenSet.has(w.id),
      )
      .map((widget) => ({ kind: "analytics" as const, widget }))

    const sections: AddableSection[] = []
    if (launchAddables.length > 0) {
      sections.push({ label: "Launch tiles", items: launchAddables })
    }
    if (infoAddables.length > 0) {
      sections.push({ label: "Information", items: infoAddables })
    }
    if (analyticsAddables.length > 0) {
      sections.push({ label: "Analytics", items: analyticsAddables })
    }

    const totalCount =
      launchAddables.length + infoAddables.length + analyticsAddables.length
    return { sections, totalCount }
  }, [dashboardOrder, dock, hiddenWidgetIds])
}

/**
 * "Add widgets" entry on the customize bar. A single menu containing:
 *   - one MenuGroup per widget kind that has at least one addable item
 *   - a separator + "Discover more widgets…" link to the plugin repo
 *
 * The trigger and the menu are split out from the customize bar so the
 * `useDroppable` and Menu state coexist cleanly.
 */
export function AddWidgetMenu({
  onDiscoverPlugins,
}: {
  onDiscoverPlugins: () => void
}) {
  const { sections, totalCount } = useAddable()
  const setPlacement = usePlacement((s) => s.setPlacement)
  const unhideWidget = usePlacement((s) => s.unhideWidget)

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="sm">
            <Plus className="size-4" />
            Add widgets
          </Button>
        }
      />
      <MenuPopup align="start" className="min-w-56">
        {totalCount === 0 ? (
          <MenuItem disabled>Nothing to add</MenuItem>
        ) : (
          sections.map((section, i) => (
            <SectionGroup
              key={section.label}
              section={section}
              showSeparatorAbove={i > 0}
              onAddLaunch={(navItem) => {
                const Icon = navItem.icon ?? iconFor(navItem.action)
                setPlacement(navItem.action, "dashboard", {
                  title: navItem.title,
                  icon: Icon,
                  badge: navItem.badge,
                })
              }}
              onAddRecipe={(widget) => unhideWidget(widget.id)}
            />
          ))
        )}
        <MenuSeparator />
        <MenuItem onClick={onDiscoverPlugins}>
          <Compass className="size-4" />
          Discover more widgets…
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

function SectionGroup({
  section,
  showSeparatorAbove,
  onAddLaunch,
  onAddRecipe,
}: {
  section: AddableSection
  showSeparatorAbove: boolean
  onAddLaunch: (navItem: NavItem) => void
  onAddRecipe: (widget: InfoWidget | AnalyticsWidget) => void
}) {
  return (
    <>
      {showSeparatorAbove ? <MenuSeparator /> : null}
      <MenuGroup>
        <MenuGroupLabel>{section.label}</MenuGroupLabel>
        {section.items.map((item) => {
          if (item.kind === "launch") {
            const Icon = item.navItem.icon ?? iconFor(item.navItem.action)
            return (
              <MenuItem
                key={`launch-${item.navItem.id}`}
                onClick={() => onAddLaunch(item.navItem)}
              >
                <Icon className="size-4" />
                {item.navItem.title}
              </MenuItem>
            )
          }
          const Icon = item.widget.icon
          return (
            <MenuItem
              key={`recipe-${item.widget.id}`}
              onClick={() => onAddRecipe(item.widget)}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {item.widget.title}
            </MenuItem>
          )
        })}
      </MenuGroup>
    </>
  )
}
