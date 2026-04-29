export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed"

export type OrderLineItem = {
  id: string
  name: string
  variant?: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  /** Order number as displayed (e.g. "#1042"). */
  number: string
  customer: string
  email: string
  status: OrderStatus
  /** Display string for the order date column. */
  date: string
  /** Pre-formatted total ("$148.50") so the prototype doesn't deal with currency. */
  total: string
  itemCount: number
  paymentMethod: string
  shippingMethod: string
  shippingAddress: string[]
  billingAddress: string[]
  items: OrderLineItem[]
  subtotal: string
  shipping: string
  tax: string
  notes?: string
}

export const ORDERS: Order[] = [
  {
    id: "1042",
    number: "#1042",
    customer: "Anya Petrov",
    email: "anya@example.com",
    status: "processing",
    date: "12 minutes ago",
    total: "$148.50",
    itemCount: 3,
    paymentMethod: "Visa •••• 4242",
    shippingMethod: "USPS Priority Mail",
    shippingAddress: [
      "Anya Petrov",
      "342 Berry St, Apt 4B",
      "Brooklyn, NY 11211",
      "United States",
    ],
    billingAddress: [
      "Anya Petrov",
      "342 Berry St, Apt 4B",
      "Brooklyn, NY 11211",
      "United States",
    ],
    items: [
      { id: "mug-cobalt", name: "Cobalt mug", variant: "12oz", quantity: 2, unitPrice: 38 },
      { id: "saucer-cream", name: "Cream saucer", quantity: 1, unitPrice: 22 },
    ],
    subtotal: "$98.00",
    shipping: "$9.20",
    tax: "$8.70",
    notes: "Gift wrap requested.",
  },
  {
    id: "1041",
    number: "#1041",
    customer: "Marco Davila",
    email: "marco.d@example.com",
    status: "processing",
    date: "1 hour ago",
    total: "$72.00",
    itemCount: 2,
    paymentMethod: "PayPal",
    shippingMethod: "USPS Ground Advantage",
    shippingAddress: [
      "Marco Davila",
      "1100 Mission St",
      "San Francisco, CA 94103",
      "United States",
    ],
    billingAddress: [
      "Marco Davila",
      "1100 Mission St",
      "San Francisco, CA 94103",
      "United States",
    ],
    items: [
      { id: "vase-tall", name: "Tall vase", variant: "matte white", quantity: 1, unitPrice: 64 },
    ],
    subtotal: "$64.00",
    shipping: "$4.50",
    tax: "$3.50",
  },
  {
    id: "1040",
    number: "#1040",
    customer: "Sarah Kim",
    email: "sarah.kim@example.com",
    status: "on-hold",
    date: "3 hours ago",
    total: "$214.00",
    itemCount: 5,
    paymentMethod: "Bank transfer (pending)",
    shippingMethod: "Local pickup",
    shippingAddress: ["Sarah Kim", "Pickup at the studio"],
    billingAddress: [
      "Sarah Kim",
      "82 Carroll Gardens",
      "Brooklyn, NY 11231",
      "United States",
    ],
    items: [
      { id: "bowl-set", name: "Bowl set of 4", quantity: 1, unitPrice: 120 },
      { id: "mug-cobalt", name: "Cobalt mug", variant: "12oz", quantity: 2, unitPrice: 38 },
    ],
    subtotal: "$196.00",
    shipping: "$0.00",
    tax: "$18.00",
    notes: "Awaiting bank transfer confirmation.",
  },
  {
    id: "1039",
    number: "#1039",
    customer: "Liang Chen",
    email: "liang.c@example.com",
    status: "completed",
    date: "Yesterday",
    total: "$48.50",
    itemCount: 1,
    paymentMethod: "Apple Pay",
    shippingMethod: "USPS Ground Advantage",
    shippingAddress: [
      "Liang Chen",
      "55 Valencia St",
      "San Francisco, CA 94103",
      "United States",
    ],
    billingAddress: [
      "Liang Chen",
      "55 Valencia St",
      "San Francisco, CA 94103",
      "United States",
    ],
    items: [
      { id: "saucer-cream", name: "Cream saucer", quantity: 2, unitPrice: 22 },
    ],
    subtotal: "$44.00",
    shipping: "$4.50",
    tax: "$0.00",
  },
  {
    id: "1038",
    number: "#1038",
    customer: "Priya Raman",
    email: "priya.r@example.com",
    status: "completed",
    date: "Yesterday",
    total: "$86.40",
    itemCount: 2,
    paymentMethod: "Visa •••• 0119",
    shippingMethod: "USPS Priority Mail",
    shippingAddress: [
      "Priya Raman",
      "201 Lakeside Dr",
      "Oakland, CA 94612",
      "United States",
    ],
    billingAddress: [
      "Priya Raman",
      "201 Lakeside Dr",
      "Oakland, CA 94612",
      "United States",
    ],
    items: [
      { id: "mug-cobalt", name: "Cobalt mug", variant: "8oz", quantity: 2, unitPrice: 32 },
    ],
    subtotal: "$64.00",
    shipping: "$9.20",
    tax: "$13.20",
  },
  {
    id: "1037",
    number: "#1037",
    customer: "Jonas Reuter",
    email: "jonas@example.com",
    status: "completed",
    date: "2 days ago",
    total: "$312.00",
    itemCount: 6,
    paymentMethod: "Mastercard •••• 8842",
    shippingMethod: "DHL Express",
    shippingAddress: [
      "Jonas Reuter",
      "Schönhauser Allee 12",
      "10119 Berlin",
      "Germany",
    ],
    billingAddress: [
      "Jonas Reuter",
      "Schönhauser Allee 12",
      "10119 Berlin",
      "Germany",
    ],
    items: [
      { id: "bowl-set", name: "Bowl set of 4", quantity: 2, unitPrice: 120 },
      { id: "vase-tall", name: "Tall vase", variant: "matte white", quantity: 1, unitPrice: 64 },
    ],
    subtotal: "$304.00",
    shipping: "$32.00",
    tax: "$0.00",
    notes: "EU import VAT collected at checkout.",
  },
  {
    id: "1036",
    number: "#1036",
    customer: "Nina Whitford",
    email: "nina.w@example.com",
    status: "refunded",
    date: "3 days ago",
    total: "$22.00",
    itemCount: 1,
    paymentMethod: "Stripe (refunded)",
    shippingMethod: "USPS Ground Advantage",
    shippingAddress: [
      "Nina Whitford",
      "12 Front St",
      "Portland, ME 04101",
      "United States",
    ],
    billingAddress: [
      "Nina Whitford",
      "12 Front St",
      "Portland, ME 04101",
      "United States",
    ],
    items: [
      { id: "saucer-cream", name: "Cream saucer", quantity: 1, unitPrice: 22 },
    ],
    subtotal: "$22.00",
    shipping: "$4.50",
    tax: "$0.00",
    notes: "Refunded — arrived damaged. Replacement sent under #1043.",
  },
  {
    id: "1035",
    number: "#1035",
    customer: "Camille Roux",
    email: "camille.r@example.com",
    status: "completed",
    date: "4 days ago",
    total: "$96.00",
    itemCount: 2,
    paymentMethod: "Visa •••• 5512",
    shippingMethod: "International Priority",
    shippingAddress: [
      "Camille Roux",
      "14 rue de Rivoli",
      "75004 Paris",
      "France",
    ],
    billingAddress: [
      "Camille Roux",
      "14 rue de Rivoli",
      "75004 Paris",
      "France",
    ],
    items: [
      { id: "mug-cobalt", name: "Cobalt mug", variant: "12oz", quantity: 2, unitPrice: 38 },
    ],
    subtotal: "$76.00",
    shipping: "$24.50",
    tax: "$0.00",
  },
  {
    id: "1034",
    number: "#1034",
    customer: "Devon Bryant",
    email: "devon.b@example.com",
    status: "cancelled",
    date: "5 days ago",
    total: "$0.00",
    itemCount: 0,
    paymentMethod: "—",
    shippingMethod: "—",
    shippingAddress: [
      "Devon Bryant",
      "501 Granville St",
      "Vancouver, BC V6C 1T6",
      "Canada",
    ],
    billingAddress: [
      "Devon Bryant",
      "501 Granville St",
      "Vancouver, BC V6C 1T6",
      "Canada",
    ],
    items: [],
    subtotal: "$0.00",
    shipping: "$0.00",
    tax: "$0.00",
    notes: "Cancelled by customer before payment.",
  },
  {
    id: "1033",
    number: "#1033",
    customer: "Aoife O'Brien",
    email: "aoife@example.com",
    status: "pending",
    date: "5 days ago",
    total: "$58.00",
    itemCount: 1,
    paymentMethod: "Awaiting bank transfer",
    shippingMethod: "International tracked",
    shippingAddress: [
      "Aoife O'Brien",
      "8 Merrion Square",
      "Dublin D02 NY56",
      "Ireland",
    ],
    billingAddress: [
      "Aoife O'Brien",
      "8 Merrion Square",
      "Dublin D02 NY56",
      "Ireland",
    ],
    items: [
      { id: "vase-short", name: "Short vase", variant: "speckled", quantity: 1, unitPrice: 30 },
    ],
    subtotal: "$30.00",
    shipping: "$28.00",
    tax: "$0.00",
  },
  {
    id: "1032",
    number: "#1032",
    customer: "Yuki Tanaka",
    email: "yuki.t@example.com",
    status: "failed",
    date: "1 week ago",
    total: "$112.00",
    itemCount: 3,
    paymentMethod: "Visa •••• 9000 (declined)",
    shippingMethod: "International Economy",
    shippingAddress: [
      "Yuki Tanaka",
      "2-4-1 Shibuya",
      "Tokyo 150-0002",
      "Japan",
    ],
    billingAddress: [
      "Yuki Tanaka",
      "2-4-1 Shibuya",
      "Tokyo 150-0002",
      "Japan",
    ],
    items: [
      { id: "mug-cobalt", name: "Cobalt mug", variant: "12oz", quantity: 3, unitPrice: 38 },
    ],
    subtotal: "$114.00",
    shipping: "$28.00",
    tax: "$0.00",
    notes: "Card declined twice. Cart held for 48h before expiring.",
  },
  {
    id: "1031",
    number: "#1031",
    customer: "Hassan Karimi",
    email: "hassan.k@example.com",
    status: "completed",
    date: "1 week ago",
    total: "$54.20",
    itemCount: 1,
    paymentMethod: "Apple Pay",
    shippingMethod: "USPS Priority Mail",
    shippingAddress: [
      "Hassan Karimi",
      "240 W 35th St",
      "New York, NY 10001",
      "United States",
    ],
    billingAddress: [
      "Hassan Karimi",
      "240 W 35th St",
      "New York, NY 10001",
      "United States",
    ],
    items: [
      { id: "vase-short", name: "Short vase", variant: "speckled", quantity: 1, unitPrice: 42 },
    ],
    subtotal: "$42.00",
    shipping: "$9.20",
    tax: "$3.00",
  },
  {
    id: "1030",
    number: "#1030",
    customer: "Lena Brooks",
    email: "lena.b@example.com",
    status: "completed",
    date: "2 weeks ago",
    total: "$188.00",
    itemCount: 4,
    paymentMethod: "Visa •••• 4242",
    shippingMethod: "USPS Ground Advantage",
    shippingAddress: [
      "Lena Brooks",
      "1812 N Damen Ave",
      "Chicago, IL 60647",
      "United States",
    ],
    billingAddress: [
      "Lena Brooks",
      "1812 N Damen Ave",
      "Chicago, IL 60647",
      "United States",
    ],
    items: [
      { id: "bowl-set", name: "Bowl set of 4", quantity: 1, unitPrice: 120 },
      { id: "saucer-cream", name: "Cream saucer", quantity: 3, unitPrice: 22 },
    ],
    subtotal: "$186.00",
    shipping: "$4.50",
    tax: "$0.00",
  },
]

export type OrdersView = OrderStatus | "all"

export function getOrder(id: string | undefined): Order | undefined {
  if (!id) return undefined
  return ORDERS.find((o) => o.id === id)
}

export function ordersByView(view: OrdersView): Order[] {
  if (view === "all") return ORDERS
  return ORDERS.filter((o) => o.status === view)
}

/**
 * Statuses that demand merchant attention: `processing` (needs to be
 * fulfilled), `on-hold` (needs a decision), `failed` (payment problem
 * to investigate). `pending` is intentionally excluded — it's waiting
 * on the customer, not the merchant — and the terminal states
 * (`completed`, `refunded`, `cancelled`) are done.
 */
export const ACTION_REQUIRED_STATUSES: ReadonlySet<OrderStatus> = new Set<
  OrderStatus
>(["processing", "on-hold", "failed"])

export function isActionRequired(status: OrderStatus): boolean {
  return ACTION_REQUIRED_STATUSES.has(status)
}

export function ordersNeedingAction(): Order[] {
  return ORDERS.filter((o) => isActionRequired(o.status))
}

export function statusCounts(): Record<OrdersView, number> {
  return {
    all: ORDERS.length,
    pending: ORDERS.filter((o) => o.status === "pending").length,
    processing: ORDERS.filter((o) => o.status === "processing").length,
    "on-hold": ORDERS.filter((o) => o.status === "on-hold").length,
    completed: ORDERS.filter((o) => o.status === "completed").length,
    cancelled: ORDERS.filter((o) => o.status === "cancelled").length,
    refunded: ORDERS.filter((o) => o.status === "refunded").length,
    failed: ORDERS.filter((o) => o.status === "failed").length,
  }
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending payment",
  processing: "Processing",
  "on-hold": "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
}

export const STATUS_VARIANT: Record<
  OrderStatus,
  "success" | "info" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  processing: "info",
  "on-hold": "outline",
  completed: "success",
  cancelled: "outline",
  refunded: "outline",
  failed: "destructive",
}
