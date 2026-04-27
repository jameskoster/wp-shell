import { useEffect } from "react"
import { useContexts, useFocusOrder } from "@/contexts/store"
import { useUI } from "./uiStore"

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

function modKey(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}

function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

export function useShortcuts() {
  const toggle = useUI((s) => s.toggle)
  const closeOverlay = useUI((s) => s.close)
  const focusOrder = useFocusOrder()
  const focus = useContexts((s) => s.focus)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modKey(e) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle("palette")
        return
      }

      if (e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.key === "`") {
        e.preventDefault()
        toggle("switcher")
        return
      }

      if (e.key === "Escape" && useUI.getState().overlay) {
        e.preventDefault()
        closeOverlay()
        return
      }

      if (e.altKey && !modKey(e) && /^Digit[1-9]$/.test(e.code) && !isEditableTarget(e)) {
        const idx = Number(e.code.slice(5)) - 1
        const target = focusOrder[idx]
        if (target) {
          e.preventDefault()
          focus(target.id)
        }
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle, closeOverlay, focusOrder, focus])
}

export const SHORTCUTS = {
  palette: { mac: "⌘K", other: "Ctrl+K" },
  switcher: { mac: "⌃`", other: "Ctrl+`" },
  jump: { mac: "⌥1–9", other: "Alt+1–9" },
} as const

export function shortcutLabel(s: keyof typeof SHORTCUTS): string {
  return isMac ? SHORTCUTS[s].mac : SHORTCUTS[s].other
}
