# WordPress Shell — Prototype

A standalone web prototype of a reimagined WordPress admin **shell**: a persistent
structural layer (admin bar + stage region) built around **role-based
dashboards**, **navigation as flow**, and a **Workspaces** model that
treats every destination as a first-class, multitaskable surface.

This repo implements **slice 1** of the plan in
`.cursor/plans/wordpress_shell_prototype_plan_4f145b46.plan.md` (the shell
chrome and switching model) and **slice 2** in
`.cursor/plans/manage_edit_relationship_plan.plan.md` (the manage ↔ Editor
relationship + a canonical intra-context navigation primitive). It proves
the structural model — not the content. Real workflows, real role recipes,
AI features, and WordPress integration come in later slices.

## Run

```bash
npm install
npm run dev    # dev server
npm run build  # type-check + production build
```

## Concepts

### Dashboard and contexts

> **Note on vocabulary:** "context" is the internal data model name used
> throughout the codebase. Users see it as **Workspaces** in the chrome
> (admin bar button, tooltip, AI copy, menus). Architecture docs below use
> "context"; product copy uses "workspace".

The model has two layers, deliberately distinct (think iOS):

- **Home** — the dashboard. Always present. Singleton. The surface you return
  to between tasks. `Dashboard` (in `src/workflows/Dashboard.tsx`) is rendered
  as a permanent layer behind everything else.
- **Contexts** — task-shaped workflows like `add-product`, `pages`, `editor`,
  `settings`. Each can be open, focused, or closed. The shape:

```ts
type Context = {
  id: string
  type: ContextType
  title: string
  params?: Record<string, string | number>
  openedAt: number
  lastFocusedAt: number
}
```

The contexts store (`src/contexts/store.ts`) is the source of truth:

- `open(ref)` — open or focus a context
- `close(id)` — close, falling back to the most recently focused remaining
  context, or to home if none remain
- `focus(id)` — make a context active
- `goHome()` — leave all contexts open but make home the active surface
  (`activeId = null`)
- `closedRecents` — last 5 closed contexts (powers the palette's Recent
  section)

`activeId === null` means "home is showing". The URL hash mirrors this:
empty hash = home, `#pages?view=draft` = a specific context with state.
Deep links work without a router library.

#### Singletons, hybrid singletons, and pinned instances

Each context type declares its dedupe behaviour in `src/contexts/registry.ts`
through one of two fields on its meta:

- `singleton: true` — at most one context of this type. Reopening focuses
  the existing one and merges any new params (used by `pages`, `settings`,
  `orders`, …).
- `singletonKey(params)` — returns the dedupe key for a given params object.
  `undefined` means "always create a new one"; a string means "find or
  create the context with this key". Lets one type be a *default singleton*
  with optional *pinned instances*. Used by `editor`:

  ```ts
  singletonKey: (params) =>
    params?.instanceId ? String(params.instanceId) : 'default'
  ```

  In practice: clicking a page row opens (or focuses) the default editor
  and swaps its document. Cmd/Ctrl-click — or "Open in new context" from
  the row's action menu — opens a *pinned* editor for parallel editing.

A type can also declare `resolveDefaultParams()` to fill in params when
`open()` is called bare. The Editor uses this to land on the homepage when
reached via the destinations list or a stale URL.

### Manage ↔ Editor

Two roles, one verb between them — WordPress's most-repeated loop made
first-class:

- **Manage contexts** are dataview-shaped (table, filters, bulk actions).
  `pages` is the first one; `posts`, `templates`, `patterns`, `navigation`,
  `products` follow the same shape in later slices.
- The **Editor context** is a single multi-kind editing surface. Its params
  are `{ kind, id, instanceId? }`, where `kind` is `'page' | 'post' |
  'template' | 'template-part' | 'pattern' | 'navigation'`. Same chrome,
  same loop, regardless of `kind`.

Clicking a row in Pages dispatches `open({ type: 'editor', params: { kind:
'page', id } })`. The Pages context **stays open**, the Editor swaps its
document (default-singleton behaviour above), and Cmd-` cycles between
them. Closing the Editor falls back to Pages via the LRU stack.

#### Adding a new manage → Editor pair

1. Add a mock dataset in `src/mocks/<thing>.ts`.
2. Register a singleton context type in `src/contexts/{types,registry,url}.ts`.
3. Build `src/workflows/<Thing>.tsx`, composing `<ContextLayout>` +
   `<ContextSubnav>` for the primary intra-context navigation, with the
   dataview in `<ContextLayout.Main>`. Row clicks dispatch
   `open({ type: 'editor', params: { kind: '<thing>', id } })`.
4. Register the workflow in `src/workflows/index.tsx`.
5. Wire it up wherever it should be reached (recipe nav widget, destination
   list, etc.).

The Editor doesn't need to be touched to support a new kind in the
prototype — its mockup canvas just renders whatever document the params
point at. In a real implementation, kind-specific document settings would
live in the left rail.

### Intra-context navigation

Three composable layers, any of which a workspace may opt into:

1. **Primary navigation — sidebar** (`<ContextSubnav>`). A static rail
   on the left. `Pages` uses it for status views; `Settings` uses it
   for sections (General, Reading, Shipping, …).
2. **Secondary navigation — horizontal nav** (`<ContextHeaderTabs>`).
   Renders as a second row inside `<ContextHeader>`. Used for
   sub-sections within a sidebar item (e.g. Shipping → Zones / Classes
   / Methods), or as the *primary* nav when a workspace doesn't use a
   sidebar at all (e.g. Marketing).
3. **Drilldown.** Clicking an item in the content area enters a deeper
   context — the horizontal nav disappears, the title becomes a
   breadcrumb (`Zones / Zone name`), and the description can change.
   The sidebar stays put with its current selection. Settings → Shipping
   → Zones → click a zone is the canonical example.

**Header title rule.** When the workspace has a sidebar, the header
title reflects the **active sidebar item** (e.g. "Shipping"). When the
workspace has no sidebar, the header title is just the workspace name
(e.g. "Marketing"); the active horizontal tab is conveyed by the
underline in the tabs row, *not* by mutating the title. The header
title never carries an icon in either case — the workspace icon already
appears in the switcher tile and admin bar, and a sidebar's selected
item carries its own icon. `Context.title` (used by the switcher tile,
palette, and admin bar) always stays as the workspace name.

The Editor is the explicit exception to all of this — its chrome owns
both rails for document/inspector and uses the breadcrumb directly.

```tsx
<ContextLayout>
  <ContextSubnav>
    <ContextSubnav.Group>
      <ContextSubnav.Item icon={Truck} active onClick={() => setSection("shipping")}>
        Shipping
      </ContextSubnav.Item>
      {/* … */}
    </ContextSubnav.Group>
  </ContextSubnav>
  <ContextLayout.Main>
    <ContextHeader
      ctx={ctx}
      tabs={
        !drilldown ? (
          <ContextHeaderTabs label="Shipping sections">
            <ContextHeaderTabs.Tab active={tab === "zones"} onClick={() => setTab("zones")}>
              Zones
            </ContextHeaderTabs.Tab>
            {/* … */}
          </ContextHeaderTabs>
        ) : undefined
      }
    >
      {drilldown ? (
        <ContextHeader.Breadcrumb
          parents={{ label: "Zones", onClick: clearItem }}
          current={zone.name}
          subtitle={zone.description}
        />
      ) : (
        <ContextHeader.Title subtitle={section.description}>
          {section.label}
        </ContextHeader.Title>
      )}
    </ContextHeader>
    {/* content */}
  </ContextLayout.Main>
</ContextLayout>
```

`<ContextHeaderTabs>` is a semantic `<nav>` with `aria-current="page"`
on the active item — *not* an ARIA tablist. Activating a tab changes
URL params and the workspace state, not just a panel within the same
view.

State persists in the context's URL params (Settings uses
`section` / `tab` / `item`; Marketing uses `tab`), so Cmd-` away and
back, deep links, and switcher tiles all restore the same view. `item`
is only meaningful when paired with `tab`. Switching sidebar sections
clears `tab` and `item` — predictable beats clever.

Future deeper drilldowns (Zone → Method → Rate) will replace the flat
`item` param with a `path` (slash-separated or array). The
`<ContextHeader.Breadcrumb>` `parents` array already accepts the shape.

#### Mobile drawer

Below `md` (≥768px), the sidebar is hidden by default and revealed via
a hamburger button rendered to the left of the title in
`<ContextHeader>`. The hamburger appears automatically when the
workspace's `<ContextLayout>` contains a `<ContextSubnav>` — no per-
workspace wiring. The drawer slides in from the left with a backdrop;
closes on backdrop click, Esc, or any item click. Workspaces without a
sidebar (e.g. Marketing) don't get a hamburger.

This is the only mobile pattern in the prototype — the rest of the
shell chrome (admin bar, workspace switcher, dashboard) is still
desktop-first.

### Widgets

The dashboard renders a recipe — a list of typed widget definitions. Four
kinds, sharing a `WidgetBase` shape:

- `LaunchTile` — one-click entry to a context (`action: ContextRef`)
- `InfoWidget` — a list of items, optionally each with their own action
- `AnalyticsWidget` — a metric (value + delta + sparkline)
- `NavWidget` — a small list of navigation items, like the classic admin sidebar

`WidgetGrid` switches on `kind` to render. Adding a new widget kind means
adding a type, a component, and a case — nothing in the recipe layer or the
shell needs to change. This is the contract that future plugin- or
AI-contributed widgets would target.

A single stub recipe lives in `src/recipes/storeManager.ts` and demonstrates
all four kinds.

### Shell chrome

- **Admin bar** — brand (always goes to Dashboard), Workspaces button
  (only visible when ≥2 workspaces are open; opens the Workspaces overlay),
  site menu, global search / palette trigger, notifications, AI sheet,
  user menu. The admin bar fades out (and becomes inert) while Workspaces
  is open; clicking anywhere in its region returns to Dashboard and
  dismisses the overlay.
- **Command palette** (`⌘K` / `Ctrl+K`) — wraps coss `Command`. Two
  sections: *Recent* (recently closed workspaces) and *Go to* (Dashboard +
  all known destinations).
- **Workspaces** (`⌘\`` / `Ctrl+\``) — iOS-style horizontal stack.
  The active surface scales down to its slot at the right edge, and the
  other open workspaces line up to its left in recency order (see "Context
  stage" below). Free horizontal scroll via wheel/trackpad; arrow keys
  snap to focused tile. Enter selects, Esc dismisses, tap on empty space
  (including the admin bar) returns to Dashboard.

### Context stage

The stage region (`src/shell/ContextStage.tsx`) renders three layers:

1. **Home plane** — the `Dashboard` component, always mounted at the back,
   visible whenever no context is active and glimpsed (faded + slightly
   blurred) behind the stack in switcher mode.
2. **Open context tiles** — one `ContextTile` per open context, absolutely
   positioned over home. A single `switcherOpen` boolean derives every tile's
   transform:
   - **Off** — active tile is identity-transformed and covers home;
     inactive tiles are held at `opacity: 0` behind it.
   - **On** — every tile translates and scales into a slot in a horizontal
     stack (`stageLayout.ts`). Tiles are uniform size (40% scale, preserving
     stage aspect ratio) and ordered left → right = oldest → newest, so the
     most recent sits at the right edge. With ≥3 contexts, the rightmost
     two are fully visible at rest and the third peeks from the left. The
     stage scrolls horizontally (free scroll via wheel/trackpad; arrow
     keys snap and scroll the focused tile into view). A chrome layer
     with a click-catcher button and an overlaid close affordance fades
     in over each tile.
3. **Tap-empty catcher** — only present in switcher mode; sits between the
   home plane and the tiles. Clicking anywhere outside a tile calls
   `goHome()` and dismisses the switcher.

Because we transform live DOM (not snapshots), tile previews are pixel-perfect
and stay live. Trade-offs:

- Every open context is mounted at full size. Fine for stub workflows;
  real editors will need lazy mount + keep-alive in a later slice.
- It's not a `<Dialog>`. Tab order is the natural DOM order through the tile
  buttons, an `aria-live` region announces mode changes, and `Esc` dismisses —
  but focus is not strictly trapped. Accepted for the iOS-style "the
  workspace itself is the switcher" feel.

### Shortcuts

| Shortcut       | Action                              |
| -------------- | ----------------------------------- |
| `⌘K`           | Toggle command palette              |
| `⌃\``          | Toggle Workspaces                   |
| `Alt+1…9`      | Jump to nth workspace (focus order) |
| `Esc`          | Close any open overlay              |

(`⌘` / `Ctrl` is platform-aware via `useShortcuts.ts`.)

## Directory layout

```
src/
  shell/             — Shell.tsx, AdminBar, CommandPalette, ContextStage,
                       ContextTile, ContextSwitcher, ContextLayout,
                       ContextSubnav, ContextHeader, ContextHeaderTabs,
                       stageLayout, useShortcuts, uiStore
  contexts/          — store, types, registry (per-type metadata + destinations
                       + singletonKey + resolveDefaultParams),
                       url (hash <-> ref)
  widgets/           — types + LaunchTile, Info, Analytics, Nav, WidgetGrid
  recipes/           — storeManager.ts, admin.ts (stub recipes)
  workflows/         — Dashboard (home), Pages (dataview), Editor (mockup),
                       AddProduct, EditPage, Settings, Orders, Marketing,
                       Analytics, ProductReviews, ContextSurface
  mocks/             — notifications, user, pages, settings
  components/ui/     — coss/ui (shadcn-compatible) primitives
  lib/utils.ts       — cn helper
```

## Tech stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + [coss/ui](https://coss.com/ui) (Base UI primitives + cmdk-style
  Autocomplete) — initialized via `npx shadcn@latest init @coss/style`
- Zustand for the contexts and UI stores
- `lucide-react` for icons
- No router library — the contexts store + URL hash sync is the source of truth

## Port-readiness

The data-driven widget definitions and the `Recipe` schema in
`src/widgets/types.ts` are the seam. In a later slice, `recipes/` would be
generated from PHP/JSON on the WordPress side, and the Shell would render as
a React island inside wp-admin. The contexts model maps onto WP's existing
URL-driven pages (each page becomes a context).

## What's deferred

Per the plans, the current build still excludes:

- Real WordPress integration / PHP
- Functional workflows beyond the static Pages dataview and Editor mockup
- A real block editor inside the Editor surface (or any unsaved-changes
  handling)
- Posts / Templates / Patterns / Navigation as their own dataviews — the
  model is shaped to absorb them; future slices ship them
- A site-preview dashboard widget that opens the Editor on the homepage
- Unbundling Appearance into `Templates` / `Patterns` / `Styles` /
  `Navigation` siblings in the classic-admin nav widget
- Time-to-destination measurement harness
- Widget reordering / resizing UI
- A full mobile pass on the shell chrome (admin bar, workspace
  switcher, dashboard, command palette). Workspace sidebars do get a
  mobile drawer — see "Intra-context navigation" — but the rest is
  still desktop-first.

## Notes from this build

- The plan referenced a "Cmd+Tab"-style switcher. macOS reserves `⌘+Tab`
  globally, so the binding is `⌘\`` (with `Alt+1…9` as a faster jump for the
  power user). The behaviour mirrors the macOS app switcher.
- The two design sync points in the plan (`Sync 1`, `Sync 2`) had no
  designer-provided mocks available, so the visual layer uses coss/ui defaults
  throughout. Swapping in design tokens later means editing
  `src/index.css` only.
