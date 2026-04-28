import { useMemo } from "react"
import { ChevronRight, MapPin, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ContextHeader } from "@/shell/ContextHeader"
import { ContextHeaderTabs } from "@/shell/ContextHeaderTabs"
import { ContextLayout } from "@/shell/ContextLayout"
import { ContextSubnav } from "@/shell/ContextSubnav"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"
import {
  GENERAL_PLACEHOLDER,
  PAYMENTS_PLACEHOLDER,
  READING_PLACEHOLDER,
  SECTIONS,
  SHIPPING_CLASSES,
  SHIPPING_METHODS_GLOBAL,
  SHIPPING_ZONES,
  TAX_PLACEHOLDER,
  getSection,
  getZone,
  isShippingTab,
  type SettingsSection,
  type ShippingZone,
} from "@/mocks/settings"

export function Settings({ ctx }: { ctx: Context }) {
  const open = useContexts((s) => s.open)

  const params = ctx.params ?? {}
  const sectionKey = typeof params.section === "string" ? params.section : "general"
  const section = useMemo(() => getSection(sectionKey), [sectionKey])

  // Tab is only meaningful inside a section that has tabs. Coerce to
  // the section default so a stray `?tab=` from a deep link doesn't
  // leave us in an indeterminate state.
  const rawTab = typeof params.tab === "string" ? params.tab : undefined
  const tabKey =
    section.tabs && section.tabs.some((t) => t.key === rawTab)
      ? rawTab!
      : section.defaultTab ?? section.tabs?.[0]?.key

  const itemId = typeof params.item === "string" ? params.item : undefined
  // `item` is only meaningful when paired with `tab`. If a deep link
  // arrives with `item` but no `tab`, ignore the drilldown.
  const drilldown =
    itemId && tabKey && section.key === "shipping" && isShippingTab(tabKey)
      ? resolveDrilldown(tabKey, itemId)
      : null

  function setSection(nextKey: string) {
    open({ type: "settings", params: { section: nextKey } })
  }

  function setTab(nextTab: string) {
    open({
      type: "settings",
      params: { section: section.key, tab: nextTab },
    })
  }

  function setItem(nextItem: string) {
    open({
      type: "settings",
      params: { section: section.key, tab: tabKey, item: nextItem },
    })
  }

  function clearItem() {
    open({
      type: "settings",
      params: { section: section.key, tab: tabKey },
    })
  }

  const showTabs = !drilldown && section.tabs && section.tabs.length > 0
  const activeTab = section.tabs?.find((t) => t.key === tabKey)

  return (
    <ContextLayout>
      <ContextSubnav>
        <ContextSubnav.Group>
          {SECTIONS.map((s) => (
            <ContextSubnav.Item
              key={s.key}
              icon={s.icon}
              active={section.key === s.key}
              onClick={() => setSection(s.key)}
            >
              {s.label}
            </ContextSubnav.Item>
          ))}
        </ContextSubnav.Group>
      </ContextSubnav>
      <ContextLayout.Main>
        <ContextHeader
          ctx={ctx}
          tabs={
            showTabs ? (
              <ContextHeaderTabs label={`${section.label} sections`}>
                {section.tabs!.map((t) => (
                  <ContextHeaderTabs.Tab
                    key={t.key}
                    active={tabKey === t.key}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </ContextHeaderTabs.Tab>
                ))}
              </ContextHeaderTabs>
            ) : undefined
          }
          actions={renderHeaderActions(section, drilldown)}
        >
          {drilldown ? (
            <ContextHeader.Breadcrumb
              parents={{
                label: activeTab?.label ?? section.label,
                onClick: clearItem,
              }}
              current={drilldown.title}
              subtitle={drilldown.description}
            />
          ) : (
            <ContextHeader.Title subtitle={section.description}>
              {section.label}
            </ContextHeader.Title>
          )}
        </ContextHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            {drilldown ? (
              <ZoneDetail zone={drilldown.zone} />
            ) : (
              <SectionContent
                section={section}
                tabKey={tabKey}
                onOpenZone={setItem}
              />
            )}
          </div>
        </ScrollArea>
      </ContextLayout.Main>
    </ContextLayout>
  )
}

type Drilldown = {
  zone: ShippingZone
  title: string
  description: string
}

function resolveDrilldown(
  tab: "zones" | "classes" | "methods",
  itemId: string
): Drilldown | null {
  if (tab !== "zones") return null
  const zone = getZone(itemId)
  if (!zone) return null
  return {
    zone,
    title: zone.name,
    description: zone.description,
  }
}

function renderHeaderActions(
  section: SettingsSection,
  drilldown: Drilldown | null
) {
  if (drilldown) {
    return (
      <>
        <Button size="sm" variant="ghost" disabled>
          Discard
        </Button>
        <Button size="sm" disabled>
          Save changes
        </Button>
      </>
    )
  }
  if (section.key === "shipping") {
    return (
      <Button size="sm" disabled>
        <Plus />
        Add zone
      </Button>
    )
  }
  return (
    <Button size="sm" disabled>
      Save changes
    </Button>
  )
}

function SectionContent({
  section,
  tabKey,
  onOpenZone,
}: {
  section: SettingsSection
  tabKey: string | undefined
  onOpenZone: (id: string) => void
}) {
  switch (section.key) {
    case "general":
      return <GeneralPanel />
    case "reading":
      return <ReadingPanel />
    case "tax":
      return <TaxPanel />
    case "payments":
      return <PaymentsPanel />
    case "shipping":
      if (tabKey === "classes") return <ShippingClassesPanel />
      if (tabKey === "methods") return <ShippingMethodsPanel />
      return <ShippingZonesPanel onOpenZone={onOpenZone} />
    default:
      return null
  }
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-6">{children}</div>
}

function GeneralPanel() {
  return (
    <PanelShell>
      <div className="rounded-lg border bg-card">
        <div className="divide-y">
          {GENERAL_PLACEHOLDER.fields.map((field) => (
            <div
              key={field.label}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="w-40 shrink-0 text-sm font-medium text-muted-foreground">
                {field.label}
              </div>
              <div className="text-sm">{field.value}</div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

function ReadingPanel() {
  return (
    <PanelShell>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">{READING_PLACEHOLDER.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          What visitors see at the root of your site.
        </p>
        <div className="mt-4 space-y-2">
          {READING_PLACEHOLDER.options.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent/40"
            >
              <input
                type="radio"
                name="frontpage"
                defaultChecked={opt.key === READING_PLACEHOLDER.selected}
                className="size-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

function TaxPanel() {
  return (
    <PanelShell>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Region</th>
              <th className="px-4 py-2 text-left font-medium">Rate</th>
              <th className="px-4 py-2 text-left font-medium">Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {TAX_PLACEHOLDER.rates.map((rate) => (
              <tr key={rate.region}>
                <td className="px-4 py-3 font-medium">{rate.region}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {rate.rate}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{rate.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  )
}

function PaymentsPanel() {
  return (
    <PanelShell>
      <div className="space-y-3">
        {PAYMENTS_PLACEHOLDER.processors.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.note}</div>
            </div>
            <Badge
              size="sm"
              variant={p.status === "Connected" ? "success" : "outline"}
            >
              {p.status}
            </Badge>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function ShippingZonesPanel({ onOpenZone }: { onOpenZone: (id: string) => void }) {
  return (
    <PanelShell>
      <div className="overflow-hidden rounded-lg border bg-card">
        <ul className="divide-y">
          {SHIPPING_ZONES.map((zone) => (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onOpenZone(zone.id)}
                className="group flex w-full items-center gap-4 px-4 py-3 text-start outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{zone.name}</span>
                    <Badge variant="outline" size="sm">
                      {zone.methods.length}{" "}
                      {zone.methods.length === 1 ? "method" : "methods"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">{zone.regions.join(", ")}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  )
}

function ShippingClassesPanel() {
  return (
    <PanelShell>
      <div className="overflow-hidden rounded-lg border bg-card">
        <ul className="divide-y">
          {SHIPPING_CLASSES.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.description}</div>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  )
}

function ShippingMethodsPanel() {
  return (
    <PanelShell>
      <div className="space-y-3">
        {SHIPPING_METHODS_GLOBAL.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.note}</div>
            </div>
            <Switch defaultChecked={m.id !== "calculated"} />
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function ZoneDetail({ zone }: { zone: ShippingZone }) {
  return (
    <PanelShell>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          <span>Regions covered</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {zone.regions.map((r) => (
            <Badge key={r} variant="outline" size="sm">
              {r}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Shipping methods</h3>
          <Button size="xs" variant="outline" disabled>
            <Plus />
            Add method
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <ul className="divide-y">
            {zone.methods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.cost}</div>
                </div>
                <Switch defaultChecked={m.enabled} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PanelShell>
  )
}
