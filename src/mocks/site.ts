export type SiteSummary = {
  id: string
  name: string
  url: string
  initial: string
  iconClass: string
}

export const SITE: SiteSummary = {
  id: "primary",
  name: "Site name",
  url: "https://example.com",
  initial: "S",
  iconClass: "bg-gradient-to-br from-indigo-500 to-slate-900 text-white",
}

export const OTHER_SITES: SiteSummary[] = [
  {
    id: "store",
    name: "Acme Store",
    url: "https://acme.example",
    initial: "A",
    iconClass: "bg-gradient-to-br from-emerald-500 to-emerald-800 text-white",
  },
  {
    id: "blog",
    name: "Field Notes",
    url: "https://notes.example",
    initial: "F",
    iconClass: "bg-gradient-to-br from-amber-400 to-rose-600 text-white",
  },
  {
    id: "agency",
    name: "Studio Park",
    url: "https://studio.example",
    initial: "P",
    iconClass: "bg-gradient-to-br from-sky-500 to-violet-700 text-white",
  },
]
