# Dock — Plan

Promote the nav widget out of the dashboard `WidgetGrid` and into a standalone, viewport‑fixed dock that lives at the shell level (alongside `AdminBar`).

---

## Goals & non‑goals

**In scope**
- Lift the nav widget out of `WidgetGrid` into a viewport‑fixed dock that's part of the shell, not the dashboard.
- Three desktop position presets: `left-center`, `bottom-center`, `right-center`, plus a `hidden` state.
- Always `bottom-center` on mobile (≤ md, per `useIsMobile`) when not hidden.
- Persist the user's chosen position across reloads.
- Dock is visible across all contexts (dashboard + open workflows), like the AdminBar.

**Out of scope (for this pass)**
- Drag‑to‑reposition. Position changes via the AdminBar site menu only.
- Magnify / hover‑zoom (macOS‑style).
- Adding/removing dock items inline. Items still come from the recipe.
- Auto‑hide / show‑on‑hover.

---

## Locked decisions

| Decision | Choice |
|---|---|
| Visual style | Icon‑only at all positions (size‑9 buttons + tooltips). Notification badge sits in the same `-top-1 -right-1` slot already used by `NavWidget`'s icon‑only branch. |
| Surface | New shell component `Dock`, mounted as a sibling to `AdminBar` inside `Shell`. Floats over content (`fixed`). |
| Layout coordination | Dock publishes `--dock-inset-{left,right,bottom}` CSS variables on `<html>`. The Dashboard grid consumes them as padding so corner widgets aren't obscured. Workflow contexts continue to render full‑bleed. |
| Position store | New `useDock` Zustand store, persisted to `localStorage("wp-shell.dock-position")`. Default `bottom-center`. |
| Position picker | `Dock position` submenu in the AdminBar site menu (replaces the disabled "Customize dashboard" item). Radio items: `Left`, `Bottom`, `Right`, separator, `Hidden`. |
| Item source | Pull from the active recipe's `nav` widgets (`recipe.widgets.filter(kind === "nav").flatMap(items)`). |
| Removal behavior | Drop nav widgets from the grid entirely (`Dashboard` filters `kind !== "nav"`). The dock is the canonical surface. |
| Overflow | Static per‑orientation cap. Surplus items collapse into a trailing `…` button that opens a `Popover` listing the remainder. No scroll inside the dock. |
| Switcher dimming | Mirror `AdminBar`: `opacity-40 blur-sm` + `inert` when `useUI.overlay === "switcher"`. |
| Z‑order | Above dashboard / contexts, below overlays (palette, switcher, sheets, popovers). Roughly `z-30`. |
| Mobile | Keep all 4 options enabled. `Left` / `Right` are coerced to `bottom-center` at render time so the user's preference survives viewport changes. `hidden` stays hidden on mobile. |

---

## State shape

```ts
// src/shell/dockStore.ts
export type DockPosition =
  | "left-center"
  | "bottom-center"
  | "right-center"
  | "hidden"

type State = { position: DockPosition }
type Actions = { setPosition: (p: DockPosition) => void }

// Persisted to localStorage("wp-shell.dock-position"), default "bottom-center".
```

`hidden` is a real value of `DockPosition` rather than a separate flag, so the AdminBar radio group has a single source of truth.

---

## Layout coordination (dock ↔ dashboard)

`Dock` measures itself with a `ResizeObserver` and sets CSS variables on the document root:

```ts
document.documentElement.style.setProperty("--dock-inset-bottom", bottom)
document.documentElement.style.setProperty("--dock-inset-left",   left)
document.documentElement.style.setProperty("--dock-inset-right",  right)
```

Each is `0px` unless the dock is on that edge, in which case it's the dock's actual outer dimension + gap.

`Dashboard.tsx` consumes them:

```diff
- <div className="w-full px-6 py-8">
+ <div
+   className="w-full px-6 py-8"
+   style={{
+     paddingLeft:   "max(1.5rem, var(--dock-inset-left, 0px))",
+     paddingRight:  "max(1.5rem, var(--dock-inset-right, 0px))",
+     paddingBottom: "max(2rem,   var(--dock-inset-bottom, 0px))",
+   }}
+ >
```

Workflow contexts intentionally do not consume these vars in v1.

---

## Overflow with popover

Static cap per orientation:

```ts
const MAX_VISIBLE = {
  "bottom-center": 10,
  "left-center":   10,
  "right-center":  10,
}
```

```ts
const visible  = items.slice(0, MAX_VISIBLE[orientation])
const overflow = items.slice(MAX_VISIBLE[orientation])
```

If `overflow.length > 0`, append a trailing `MoreHorizontal` button that opens a `Popover` (we already have `@/components/ui/popover`). Popover content is a vertical list of icon + label rows (so users can scan by name). Popover `side` derives from dock position:

- `bottom-center` → `top`
- `left-center`   → `right`
- `right-center`  → `left`

Dynamic measurement of "what fits" is a possible follow‑up.

---

## Site menu integration

In `AdminBar.tsx`, replace the disabled "Customize dashboard" item with:

```tsx
<MenuSub>
  <MenuSubTrigger>Dock position</MenuSubTrigger>
  <MenuSubPopup className="min-w-44">
    <MenuRadioGroup value={position} onValueChange={setPosition}>
      <MenuRadioItem value="left-center">Left</MenuRadioItem>
      <MenuRadioItem value="bottom-center">Bottom</MenuRadioItem>
      <MenuRadioItem value="right-center">Right</MenuRadioItem>
      <MenuSeparator />
      <MenuRadioItem value="hidden">Hidden</MenuRadioItem>
    </MenuRadioGroup>
  </MenuSubPopup>
</MenuSub>
```

If `@/components/ui/menu` doesn't already wrap Base UI's radio primitives, add `MenuRadioGroup` / `MenuRadioItem` wrappers. Confirm during step 1.

---

## Responsive behavior

- **Desktop (`min-md`)**:
  - `left-center`:   `fixed left-3 top-1/2 -translate-y-1/2`, vertical stack.
  - `right-center`:  `fixed right-3 top-1/2 -translate-y-1/2`, vertical stack.
  - `bottom-center`: `fixed bottom-4 left-1/2 -translate-x-1/2`, horizontal stack.
- **Mobile (`max-md`)**: any non‑hidden position renders as `bottom-center`, with safe‑area inset (`pb-[env(safe-area-inset-bottom)]`).
- **Hidden**: not rendered. CSS inset variables reset to `0px`.
- Container styling: `bg-card/80 backdrop-blur border shadow-lg/10 rounded-2xl`.
- Tooltip `side` flips with orientation:
  - bottom dock → `top`
  - left dock   → `right`
  - right dock  → `left`

---

## Motion & a11y

- Position changes animate with the existing `--ease-glide` curve over ~280ms (`transform`, `opacity`). All wrapped in `motion-safe:` utilities.
- Mirror `AdminBar` switcher‑dim treatment: `opacity-40 blur-sm` + `inert` when `useUI.overlay === "switcher"`.
- Container: `role="toolbar"`, `aria-label="Dock"`. Items reuse the existing `aria-label` from `NavWidget`'s icon‑only branch.
- Dock is mounted after `<main>` in DOM order so it doesn't intercept Tab on every page; rely on the existing skip‑link for content.

---

## Files to touch

**New**
- `src/shell/dockStore.ts`
- `src/shell/Dock.tsx`
- (maybe) `src/shell/DockItem.tsx` — extracted icon‑only button so `NavWidget` can keep using it while it lives.

**Modified**
- `src/shell/Shell.tsx` — mount `<Dock />` after `<main>`.
- `src/workflows/Dashboard.tsx` — filter `kind === "nav"`; consume `--dock-inset-*` vars; drop `TODO: dock` comment.
- `src/widgets/NavWidget.tsx` — drop `TODO: dock` comment. Component stays as a no‑op renderer until removed in a follow‑up.
- `src/shell/AdminBar.tsx` — replace disabled "Customize dashboard" item with the `Dock position` radio submenu.
- `src/components/ui/menu.tsx` — only if we need to add `MenuRadioGroup` / `MenuRadioItem` wrappers.

**Untouched**
- `src/recipes/admin.ts`, `src/recipes/storeManager.ts` — recipes still describe nav as a `nav` widget; the dock just consumes those entries.

---

## Implementation order

1. Add `dockStore.ts`. Read `menu.tsx` to confirm radio primitives exist (or add wrappers).
2. Stub `Dock.tsx` rendering at `bottom-center` only, items pulled from `adminRecipe`, no overflow yet.
3. Mount in `Shell`, filter `nav` out of `Dashboard`.
4. Add positions: orientation switch (row vs column), tooltip side flip, fixed positioning per edge.
5. Mobile lock to `bottom-center` via `useIsMobile`.
6. CSS variable publishing + Dashboard padding consumption.
7. Overflow `…` popover.
8. Hidden state + AdminBar radio submenu.
9. Switcher dim/blur parity (`opacity-40 blur-sm` + `inert`).
10. Motion polish (`ease-glide`, ~280ms transform/opacity, `motion-safe` only).
11. Clean up `TODO: dock` markers in `NavWidget.tsx` and `Dashboard.tsx`.

---

## Cleanup / follow‑ups

- Delete `NavWidget.tsx` and remove its case from `WidgetGrid` once we're confident no recipe needs the in‑grid form.
- Consider dynamic overflow measurement (count what fits, push the rest into "more") instead of a static cap.
- Consider hover‑magnify on icons for the macOS Dock metaphor.
- Optionally extend the dock‑inset CSS vars to workflow contexts if overlap turns out to be a real problem.
