# WordPress Shell — Prototype

A standalone web prototype of a reimagined WordPress admin **shell**: a persistent
structural layer (admin bar + workspace region) built around **role-based
dashboards**, **navigation as flow**, and a **context-switching** model that
treats every destination as a first-class, multitaskable surface.

This repo implements **slice 1** of the plan in `.cursor/plans/wordpress_shell_prototype_plan_4f145b46.plan.md`.
It proves the structural model — not the content. Real workflows, real role
recipes, AI features, and WordPress integration come in later slices.

## Run

```bash
npm install
npm run dev    # dev server
npm run build  # type-check + production build
```

## Concepts

### Home and contexts

The model has two layers, deliberately distinct (think iOS):

- **Home** — the dashboard. Always present. Singleton. The surface you return
  to between tasks. `Dashboard` (in `src/workflows/Dashboard.tsx`) is rendered
  as a permanent layer behind everything else.
- **Contexts** — task-shaped workflows like `add-product`, `edit-page`,
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
empty hash = home, `#edit-page?id=home` = a specific context. Deep links work
without a router library.

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

- **Admin bar** — brand (dual-purpose: returns home when ≤1 context is open,
  toggles the switcher when ≥2 are open; gets a small dot indicator in the
  latter state), site menu, global search / palette trigger, notifications,
  AI sheet, user menu. The admin bar fades out (and becomes inert) while the
  switcher is open; clicking anywhere in its region returns home and
  dismisses the switcher.
- **Command palette** (`⌘K` / `Ctrl+K`) — wraps coss `Command`. Two
  sections: *Recent* (recently closed contexts) and *Go to* (Home + all
  known destinations).
- **Context switcher** (`⌘\`` / `Ctrl+\``) — iOS-style horizontal stack.
  The active surface scales down to its slot at the right edge, and the
  other open contexts line up to its left in recency order (see "Context
  stage" below). Free horizontal scroll via wheel/trackpad; arrow keys
  snap to focused tile. Enter selects, Esc dismisses, tap on empty space
  (including the admin bar) returns home.

### Context stage

The workspace region (`src/shell/ContextStage.tsx`) renders three layers:

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
| `⌘\``          | Toggle context switcher             |
| `Alt+1…9`      | Jump to nth context (focus order)   |
| `Esc`          | Close any open overlay              |

(`⌘` / `Ctrl` is platform-aware via `useShortcuts.ts`.)

## Directory layout

```
src/
  shell/             — Shell.tsx, AdminBar, CommandPalette, ContextStage,
                       ContextTile, ContextSwitcher, stageLayout,
                       useShortcuts, uiStore
  contexts/          — store, types, registry (per-type metadata + destinations),
                       url (hash <-> ref)
  widgets/           — types + LaunchTile, Info, Analytics, Nav, WidgetGrid
  recipes/           — storeManager.ts (stub recipe)
  workflows/         — Dashboard (home), AddProduct, EditPage, Settings,
                       ContextSurface
  mocks/             — notifications, user
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

Per the plan, slice 1 explicitly excludes:

- Real WordPress integration / PHP
- Functional workflows (Add Product, Edit Page render placeholders)
- More than one role recipe
- Time-to-destination measurement harness
- Widget reordering / resizing UI
- Mobile layout (desktop-first)

## Notes from this build

- The plan referenced a "Cmd+Tab"-style switcher. macOS reserves `⌘+Tab`
  globally, so the binding is `⌘\`` (with `Alt+1…9` as a faster jump for the
  power user). The behaviour mirrors the macOS app switcher.
- The two design sync points in the plan (`Sync 1`, `Sync 2`) had no
  designer-provided mocks available, so the visual layer uses coss/ui defaults
  throughout. Swapping in design tokens later means editing
  `src/index.css` only.
