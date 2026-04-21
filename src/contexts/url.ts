import type { ContextRef, ContextType } from "./types"

const VALID_TYPES: ContextType[] = [
  "add-product",
  "edit-page",
  "settings",
]

export function refToHash(ref: ContextRef): string {
  const params = ref.params
    ? "?" +
      Object.entries(ref.params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : ""
  return `#${ref.type}${params}`
}

export function hashToRef(hash: string): ContextRef | null {
  const raw = hash.replace(/^#/, "")
  if (!raw) return null
  const [typeStr, query] = raw.split("?")
  if (!VALID_TYPES.includes(typeStr as ContextType)) return null
  const params: Record<string, string> = {}
  if (query) {
    for (const pair of query.split("&")) {
      const [k, v] = pair.split("=")
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "")
    }
  }
  return {
    type: typeStr as ContextType,
    params: Object.keys(params).length ? params : undefined,
  }
}

export function refKey(ref: ContextRef): string {
  if (!ref.params || Object.keys(ref.params).length === 0) return ref.type
  const p = Object.entries(ref.params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
  return `${ref.type}?${p}`
}
