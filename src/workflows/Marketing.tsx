import { useMemo } from "react"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContextHeader } from "@/shell/ContextHeader"
import { ContextHeaderTabs } from "@/shell/ContextHeaderTabs"
import { ContextLayout } from "@/shell/ContextLayout"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"

type MarketingTab = {
  key: string
  label: string
}

const TABS: MarketingTab[] = [
  { key: "campaigns", label: "Campaigns" },
  { key: "promotions", label: "Promotions" },
  { key: "email", label: "Email" },
]

const CAMPAIGNS = [
  { name: "Spring collection — launch", status: "Live", reach: "12.4k" },
  { name: "Studio sale follow-up", status: "Scheduled", reach: "—" },
  { name: "Press kit outreach", status: "Draft", reach: "—" },
]

const PROMOTIONS = [
  { name: "SPRING25", note: "25% off any order", uses: "318 / 1,000" },
  { name: "FREESHIP75", note: "Free shipping over $75", uses: "1,204 / ∞" },
  { name: "STUDIO10", note: "10% off — newsletter signup", uses: "542 / ∞" },
]

const EMAIL_TEMPLATES = [
  { name: "Welcome", note: "Sent on signup", status: "Active" },
  { name: "Order confirmation", note: "Transactional", status: "Active" },
  { name: "Abandoned cart", note: "Sent after 24h", status: "Paused" },
  { name: "Monthly newsletter", note: "First Tuesday of each month", status: "Active" },
]

export function Marketing({ ctx }: { ctx: Context }) {
  const open = useContexts((s) => s.open)

  const params = ctx.params ?? {}
  const rawTab = typeof params.tab === "string" ? params.tab : undefined
  const tabKey = TABS.some((t) => t.key === rawTab) ? rawTab! : TABS[0]!.key
  const activeTab = useMemo(
    () => TABS.find((t) => t.key === tabKey) ?? TABS[0]!,
    [tabKey]
  )

  function setTab(next: string) {
    open({ type: "marketing", params: { tab: next } })
  }

  return (
    // No <ContextSubnav> — Marketing has no primary navigation, so
    // the header title is the workspace name itself. The horizontal
    // tabs are sub-views; the active one is conveyed by the underline,
    // not by mutating the title.
    <ContextLayout>
      <ContextLayout.Main>
        <ContextHeader
          ctx={ctx}
          tabs={
            <ContextHeaderTabs label="Marketing">
              {TABS.map((t) => (
                <ContextHeaderTabs.Tab
                  key={t.key}
                  active={tabKey === t.key}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </ContextHeaderTabs.Tab>
              ))}
            </ContextHeaderTabs>
          }
          actions={
            <Button size="sm" disabled>
              <Plus />
              {actionLabel(activeTab.key)}
            </Button>
          }
        >
          <ContextHeader.Title subtitle="Campaigns, promotions, and email">
            Marketing
          </ContextHeader.Title>
        </ContextHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            <div className="mx-auto max-w-3xl">
              {activeTab.key === "campaigns" ? <CampaignsPanel /> : null}
              {activeTab.key === "promotions" ? <PromotionsPanel /> : null}
              {activeTab.key === "email" ? <EmailPanel /> : null}
            </div>
          </div>
        </ScrollArea>
      </ContextLayout.Main>
    </ContextLayout>
  )
}

function actionLabel(key: string) {
  if (key === "campaigns") return "New campaign"
  if (key === "promotions") return "New promotion"
  return "New template"
}

function statusVariant(status: string): "success" | "info" | "secondary" | "outline" {
  if (status === "Live" || status === "Active") return "success"
  if (status === "Scheduled") return "info"
  if (status === "Paused") return "outline"
  return "secondary"
}

function CampaignsPanel() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <ul className="divide-y">
        {CAMPAIGNS.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                Reach: <span className="tabular-nums">{c.reach}</span>
              </div>
            </div>
            <Badge size="sm" variant={statusVariant(c.status)}>
              {c.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromotionsPanel() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <ul className="divide-y">
        {PROMOTIONS.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <div className="font-mono text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.note}</div>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {p.uses}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmailPanel() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <ul className="divide-y">
        {EMAIL_TEMPLATES.map((t) => (
          <li
            key={t.name}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.note}</div>
            </div>
            <Badge size="sm" variant={statusVariant(t.status)}>
              {t.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
