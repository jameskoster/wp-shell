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
          <div className="px-6 py-8">
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

/* ------------------------------------------------------------------ *
 * Shared building blocks                                              *
 * ------------------------------------------------------------------ */

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-sm">{children}</div>
  )
}

function Card({
  title,
  action,
  children,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      {title || action ? (
        <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
          {title ? (
            <h3 className="text-base font-semibold">{title}</h3>
          ) : (
            <div />
          )}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  )
}

const ROW = "px-5 py-4"

/* ------------------------------------------------------------------ *
 * Panels                                                              *
 * ------------------------------------------------------------------ */

function GeneralPanel() {
  return (
    <PanelShell>
      <Card>
        <dl className="divide-y">
          {GENERAL_PLACEHOLDER.fields.map((field) => (
            <div
              key={field.label}
              className={`${ROW} grid gap-2 sm:grid-cols-[176px_1fr] sm:items-center sm:gap-6`}
            >
              <dt className="font-medium text-muted-foreground">{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </PanelShell>
  )
}

function ReadingPanel() {
  return (
    <PanelShell>
      <Card title={READING_PLACEHOLDER.title}>
        <div className="space-y-2 px-5 py-4">
          {READING_PLACEHOLDER.options.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-md border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <input
                type="radio"
                name="frontpage"
                defaultChecked={opt.key === READING_PLACEHOLDER.selected}
                className="size-4"
              />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>
    </PanelShell>
  )
}

function TaxPanel() {
  return (
    <PanelShell>
      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b [&>th]:px-5 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold">
              <th>Region</th>
              <th>Rate</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {TAX_PLACEHOLDER.rates.map((rate) => (
              <tr key={rate.region} className="[&>td]:px-5 [&>td]:py-4">
                <td className="font-medium">{rate.region}</td>
                <td className="tabular-nums text-muted-foreground">{rate.rate}</td>
                <td className="text-muted-foreground">{rate.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  )
}

function PaymentsPanel() {
  return (
    <PanelShell>
      <Card>
        <ul className="divide-y">
          {PAYMENTS_PLACEHOLDER.processors.map((p) => (
            <li
              key={p.name}
              className={`${ROW} flex items-center justify-between gap-4`}
            >
              <div className="min-w-0">
                <div className="font-medium">{p.name}</div>
                <div className="mt-1 text-muted-foreground">{p.note}</div>
              </div>
              <Badge
                variant={p.status === "Connected" ? "success" : "outline"}
                size="lg"
                className="px-2 leading-5"
              >
                {p.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </PanelShell>
  )
}

function ShippingZonesPanel({
  onOpenZone,
}: {
  onOpenZone: (id: string) => void
}) {
  return (
    <PanelShell>
      <Card>
        <ul className="divide-y">
          {SHIPPING_ZONES.map((zone) => (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => onOpenZone(zone.id)}
                className={`${ROW} group flex w-full items-center gap-4 text-start outline-none transition-colors hover:bg-accent/40 focus-visible:bg-accent/40`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{zone.name}</span>
                    <Badge variant="outline" size="lg" className="px-2 leading-5">
                      {zone.methods.length}{" "}
                      {zone.methods.length === 1 ? "method" : "methods"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="truncate">{zone.regions.join(", ")}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </PanelShell>
  )
}

function ShippingClassesPanel() {
  return (
    <PanelShell>
      <Card>
        <ul className="divide-y">
          {SHIPPING_CLASSES.map((c) => (
            <li key={c.id} className={ROW}>
              <div className="font-medium">{c.name}</div>
              <div className="mt-1 text-muted-foreground">{c.description}</div>
            </li>
          ))}
        </ul>
      </Card>
    </PanelShell>
  )
}

function ShippingMethodsPanel() {
  return (
    <PanelShell>
      <Card>
        <ul className="divide-y">
          {SHIPPING_METHODS_GLOBAL.map((m) => (
            <li
              key={m.id}
              className={`${ROW} flex items-center justify-between gap-4`}
            >
              <div className="min-w-0">
                <div className="font-medium">{m.name}</div>
                <div className="mt-1 text-muted-foreground">{m.note}</div>
              </div>
              <Switch defaultChecked={m.id !== "calculated"} />
            </li>
          ))}
        </ul>
      </Card>
    </PanelShell>
  )
}

function ZoneDetail({ zone }: { zone: ShippingZone }) {
  return (
    <PanelShell>
      <div>
        <h3 className="font-medium text-muted-foreground">Regions covered</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {zone.regions.map((r) => (
            <Badge
              key={r}
              variant="outline"
              size="lg"
              className="px-2 leading-5"
            >
              {r}
            </Badge>
          ))}
        </div>
      </div>

      <Card
        title="Shipping methods"
        action={
          <Button size="sm" variant="outline" disabled>
            <Plus />
            Add method
          </Button>
        }
      >
        <ul className="divide-y">
          {zone.methods.map((m) => (
            <li
              key={m.id}
              className={`${ROW} flex items-center justify-between gap-4`}
            >
              <div className="min-w-0">
                <div className="font-medium">{m.name}</div>
                <div className="mt-1 text-muted-foreground">{m.cost}</div>
              </div>
              <Switch defaultChecked={m.enabled} />
            </li>
          ))}
        </ul>
      </Card>
    </PanelShell>
  )
}
