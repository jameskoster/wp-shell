import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  PackageOpen,
  PauseCircle,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContextHeader } from "@/shell/ContextHeader"
import { ContextLayout } from "@/shell/ContextLayout"
import { ContextSubnav } from "@/shell/ContextSubnav"
import { useContexts } from "@/contexts/store"
import type { Context } from "@/contexts/types"
import {
  ORDERS,
  STATUS_LABEL,
  STATUS_VARIANT,
  getOrder,
  ordersByView,
  statusCounts,
  type Order,
  type OrderStatus,
  type OrdersView,
} from "@/mocks/orders"

const VIEWS: Array<{ key: OrdersView; label: string; icon: LucideIcon }> = [
  { key: "all", label: "All orders", icon: ShoppingBag },
  { key: "pending", label: "Pending payment", icon: Clock },
  { key: "processing", label: "Processing", icon: PackageOpen },
  { key: "on-hold", label: "On hold", icon: PauseCircle },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "refunded", label: "Refunded", icon: RotateCcw },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
  { key: "failed", label: "Failed", icon: AlertTriangle },
]

function isView(value: unknown): value is OrdersView {
  return VIEWS.some((v) => v.key === value)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function Orders({ ctx }: { ctx: Context }) {
  const open = useContexts((s) => s.open)
  const params = ctx.params ?? {}
  const rawView = params.view
  const view: OrdersView = isView(rawView) ? rawView : "all"
  const itemId = typeof params.id === "string" ? params.id : undefined
  const drilldown = itemId ? getOrder(itemId) : undefined
  const counts = useMemo(() => statusCounts(), [])

  const activeView = VIEWS.find((v) => v.key === view) ?? VIEWS[0]!

  function setView(next: OrdersView) {
    open({ type: "orders", params: { view: next } })
  }

  function setOrder(id: string) {
    open({ type: "orders", params: { view, id } })
  }

  function clearOrder() {
    open({ type: "orders", params: { view } })
  }

  return (
    <ContextLayout>
      <ContextSubnav>
        <ContextSubnav.Group>
          {VIEWS.map((v) => (
            <ContextSubnav.Item
              key={v.key}
              icon={v.icon}
              active={view === v.key}
              count={counts[v.key]}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </ContextSubnav.Item>
          ))}
        </ContextSubnav.Group>
      </ContextSubnav>
      <ContextLayout.Main>
        {drilldown ? (
          <OrderDetail
            order={drilldown}
            parentLabel={activeView.label}
            onBack={clearOrder}
            ctx={ctx}
          />
        ) : (
          <OrdersList
            view={view}
            label={activeView.label}
            ctx={ctx}
            onOpenOrder={setOrder}
          />
        )}
      </ContextLayout.Main>
    </ContextLayout>
  )
}

function OrdersList({
  view,
  label,
  ctx,
  onOpenOrder,
}: {
  view: OrdersView
  label: string
  ctx: Context
  onOpenOrder: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const visible = useMemo<Order[]>(() => {
    const base = ordersByView(view)
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
    )
  }, [view, query])

  const allSelected = visible.length > 0 && visible.every((o) => selected.has(o.id))
  const someSelected = visible.some((o) => selected.has(o.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const o of visible) next.delete(o.id)
      } else {
        for (const o of visible) next.add(o.id)
      }
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <ContextHeader
        ctx={ctx}
        actions={
          <Button size="sm" disabled>
            <Plus />
            Add order
          </Button>
        }
      >
        <ContextHeader.Title
          subtitle={`${visible.length} ${visible.length === 1 ? "order" : "orders"}${
            view === "all" ? "" : ` in ${label.toLowerCase()}`
          }`}
        >
          {label}
        </ContextHeader.Title>
      </ContextHeader>

      <div className="flex items-center gap-2 border-b px-6 py-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="pl-7"
            size="sm"
          />
        </div>
        {someSelected ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selected.size} selected</span>
            <Button size="sm" variant="outline" disabled>
              Bulk update
            </Button>
            <Button size="sm" variant="destructive-outline" disabled>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3.5">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:h-12">
                <TableHead className="w-px">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead className="w-28 font-semibold text-foreground">Order</TableHead>
                <TableHead className="font-semibold text-foreground">Customer</TableHead>
                <TableHead className="w-32 font-semibold text-foreground">Date</TableHead>
                <TableHead className="w-36 font-semibold text-foreground">Status</TableHead>
                <TableHead className="w-24 text-right font-semibold text-foreground">
                  Total
                </TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => {
                const isSelected = selected.has(order.id)
                return (
                  <TableRow
                    key={order.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell className="py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(order.id)}
                        aria-label={`Select ${order.number}`}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <button
                        type="button"
                        onClick={() => onOpenOrder(order.id)}
                        className="font-medium tabular-nums outline-none transition-colors hover:text-primary focus-visible:text-primary"
                      >
                        {order.number}
                      </button>
                    </TableCell>
                    <TableCell className="py-3">
                      <button
                        type="button"
                        onClick={() => onOpenOrder(order.id)}
                        className="flex items-center gap-3 text-start leading-snug outline-none transition-colors hover:text-primary focus-visible:text-primary"
                      >
                        <Avatar className="size-9" aria-hidden="true">
                          <AvatarFallback className="text-sm font-medium text-muted-foreground">
                            {initials(order.customer)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="font-medium">{order.customer}</span>
                          <span className="mt-1 block text-muted-foreground">
                            {order.email}
                          </span>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {order.date}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant={STATUS_VARIANT[order.status]}
                        size="lg"
                        className="px-2 leading-5"
                      >
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium tabular-nums">
                      {order.total}
                    </TableCell>
                    <TableCell className="py-3">
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Actions for ${order.number}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <MenuPopup align="end">
                          <MenuItem onClick={() => onOpenOrder(order.id)}>
                            View details
                          </MenuItem>
                          <MenuItem disabled>Mark as completed</MenuItem>
                          <MenuItem disabled>Email customer</MenuItem>
                          <MenuSeparator />
                          <MenuItem variant="destructive" disabled>
                            Refund
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No orders match this view.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </>
  )
}

function OrderDetail({
  order,
  parentLabel,
  onBack,
  ctx,
}: {
  order: Order
  parentLabel: string
  onBack: () => void
  ctx: Context
}) {
  return (
    <>
      <ContextHeader
        ctx={ctx}
        actions={
          <>
            <Button size="sm" variant="ghost" disabled>
              Email
            </Button>
            <Button size="sm" variant="outline" disabled>
              Refund
            </Button>
            <Button size="sm" disabled>
              Edit
            </Button>
          </>
        }
      >
        <ContextHeader.Breadcrumb
          parents={{ label: parentLabel, onClick: onBack }}
          current={`Order ${order.number}`}
          subtitle={`${order.customer} · ${order.date}`}
          badges={
            <Badge
              variant={STATUS_VARIANT[order.status]}
              size="lg"
              className="px-2 leading-5"
            >
              {STATUS_LABEL[order.status]}
            </Badge>
          }
        />
      </ContextHeader>

      <ScrollArea className="flex-1 bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] dark:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)]">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <LineItemsCard order={order} />
            {order.notes ? (
              <Card title="Notes">
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </Card>
            ) : null}
          </div>
          <div className="space-y-6">
            <Card title="Customer">
              <div className="text-sm font-medium">{order.customer}</div>
              <div className="text-xs text-muted-foreground">{order.email}</div>
            </Card>
            <Card title="Shipping">
              <Address lines={order.shippingAddress} />
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                {order.shippingMethod}
              </div>
            </Card>
            <Card title="Billing">
              <Address lines={order.billingAddress} />
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                {order.paymentMethod}
              </div>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-background">
      <header className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Address({ lines }: { lines: string[] }) {
  return (
    <address className="text-sm not-italic leading-relaxed text-foreground/90">
      {lines.map((line, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i}>{line}</div>
      ))}
    </address>
  )
}

function LineItemsCard({ order }: { order: Order }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <header className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Items
      </header>
      {order.items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No items in this order.
        </div>
      ) : (
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xs text-muted-foreground">
                {item.quantity}×
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                {item.variant ? (
                  <div className="text-xs text-muted-foreground">{item.variant}</div>
                ) : null}
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      )}
      <footer className="border-t bg-muted/20 px-4 py-3 text-sm">
        <Totals
          rows={[
            { label: "Subtotal", value: order.subtotal },
            { label: "Shipping", value: order.shipping },
            { label: "Tax", value: order.tax },
          ]}
          total={{ label: "Total", value: order.total }}
        />
      </footer>
    </section>
  )
}

function Totals({
  rows,
  total,
}: {
  rows: Array<{ label: string; value: string }>
  total: { label: string; value: string }
}) {
  return (
    <dl className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="tabular-nums">{r.value}</dd>
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-1.5 font-semibold">
        <dt>{total.label}</dt>
        <dd className="tabular-nums">{total.value}</dd>
      </div>
    </dl>
  )
}

export const ORDERS_DATA = ORDERS
export type { OrderStatus }
