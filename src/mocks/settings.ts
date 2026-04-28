import {
  CreditCard,
  Globe,
  MapPin,
  Receipt,
  ScrollText,
  Sliders,
  Truck,
  type LucideIcon,
} from "lucide-react"

export type SectionTab = {
  key: string
  label: string
}

export type SettingsSection = {
  key: string
  label: string
  icon: LucideIcon
  description: string
  tabs?: SectionTab[]
  /** Default tab key when entering this section. */
  defaultTab?: string
}

export const SECTIONS: SettingsSection[] = [
  {
    key: "general",
    label: "General",
    icon: Sliders,
    description: "Site identity, language, and time zone",
  },
  {
    key: "reading",
    label: "Reading",
    icon: ScrollText,
    description: "How visitors see your front page and feeds",
  },
  {
    key: "shipping",
    label: "Shipping",
    icon: Truck,
    description: "Where you ship, how you charge for it",
    defaultTab: "zones",
    tabs: [
      { key: "zones", label: "Zones" },
      { key: "classes", label: "Classes" },
      { key: "methods", label: "Methods" },
    ],
  },
  {
    key: "tax",
    label: "Tax",
    icon: Receipt,
    description: "Rates, regions, and rounding",
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
    description: "Connected processors and checkout options",
  },
]

export function getSection(key: string | undefined): SettingsSection {
  return SECTIONS.find((s) => s.key === key) ?? SECTIONS[0]!
}

export type ShippingZone = {
  id: string
  name: string
  regions: string[]
  /** Plain-language description of what this zone covers. */
  description: string
  methods: ShippingMethod[]
}

export type ShippingMethod = {
  id: string
  name: string
  // Display-only — the prototype doesn't compute totals, it just shows
  // a representative line ("From $4.50") that reads correctly in the UI.
  cost: string
  enabled: boolean
}

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: "domestic",
    name: "Domestic",
    regions: ["United States"],
    description: "Orders shipped within the United States.",
    methods: [
      { id: "usps-ground", name: "USPS Ground Advantage", cost: "From $4.50", enabled: true },
      { id: "usps-priority", name: "USPS Priority Mail", cost: "From $9.20", enabled: true },
      { id: "ups-2day", name: "UPS 2-Day Air", cost: "From $18.00", enabled: false },
      { id: "local-pickup", name: "Local pickup", cost: "Free", enabled: true },
    ],
  },
  {
    id: "north-america",
    name: "North America",
    regions: ["Canada", "Mexico"],
    description: "Cross-border orders to Canada and Mexico.",
    methods: [
      { id: "intl-economy", name: "International Economy", cost: "From $14.00", enabled: true },
      { id: "intl-priority", name: "International Priority", cost: "From $24.50", enabled: true },
    ],
  },
  {
    id: "europe",
    name: "Europe",
    regions: ["European Union", "United Kingdom", "Switzerland", "Norway"],
    description: "EU and adjacent European countries.",
    methods: [
      { id: "dhl-eu", name: "DHL Express", cost: "From $32.00", enabled: true },
      { id: "post-eu", name: "Postal economy", cost: "From $18.00", enabled: true },
    ],
  },
  {
    id: "rest-of-world",
    name: "Rest of world",
    regions: ["Everywhere else"],
    description: "Catch-all for destinations not covered by another zone.",
    methods: [
      { id: "intl-tracked", name: "International tracked", cost: "From $28.00", enabled: true },
    ],
  },
]

export function getZone(id: string | undefined): ShippingZone | undefined {
  if (!id) return undefined
  return SHIPPING_ZONES.find((z) => z.id === id)
}

export const SHIPPING_CLASSES = [
  { id: "standard", name: "Standard", description: "Default class for most products." },
  { id: "fragile", name: "Fragile", description: "Glass, ceramics — extra packaging surcharge." },
  { id: "oversized", name: "Oversized", description: "Items over 24\" on the longest side." },
]

export const SHIPPING_METHODS_GLOBAL = [
  { id: "free-shipping", name: "Free shipping", note: "Available on orders over $75" },
  { id: "flat-rate", name: "Flat rate", note: "Single price per order" },
  { id: "calculated", name: "Calculated", note: "Live rates from carrier" },
  { id: "local-pickup", name: "Local pickup", note: "In-person pickup at the studio" },
]

export const READING_PLACEHOLDER = {
  title: "Front page displays",
  options: [
    { key: "latest", label: "Your latest posts" },
    { key: "static", label: "A static page" },
  ],
  selected: "static",
}

export const GENERAL_PLACEHOLDER = {
  fields: [
    { label: "Site title", value: "Anya & Marco Studio" },
    { label: "Tagline", value: "Small-batch ceramics from Brooklyn" },
    { label: "Site URL", value: "https://anyamarco.studio" },
    { label: "Time zone", value: "America/New_York (UTC-5)" },
  ],
}

export const TAX_PLACEHOLDER = {
  rates: [
    { region: "New York", rate: "8.875%", scope: "All taxable goods" },
    { region: "California", rate: "7.25% +", scope: "Plus local district taxes" },
    { region: "European Union", rate: "VAT", scope: "Calculated per member state" },
  ],
}

export const PAYMENTS_PLACEHOLDER = {
  processors: [
    { name: "Stripe", status: "Connected", note: "Cards, Apple Pay, Google Pay" },
    { name: "PayPal", status: "Connected", note: "Express checkout" },
    { name: "Bank transfer", status: "Disabled", note: "Manual reconciliation" },
  ],
}

export type SectionContentMap = {
  general: typeof GENERAL_PLACEHOLDER
  reading: typeof READING_PLACEHOLDER
  tax: typeof TAX_PLACEHOLDER
  payments: typeof PAYMENTS_PLACEHOLDER
}

export type ShippingTabKey = "zones" | "classes" | "methods"

export function isShippingTab(value: unknown): value is ShippingTabKey {
  return value === "zones" || value === "classes" || value === "methods"
}

export const ZONE_REGION_PIN: LucideIcon = MapPin
export const SITE_GLOBE: LucideIcon = Globe
