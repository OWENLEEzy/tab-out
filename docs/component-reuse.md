# Component Reuse Reference

This document defines the component layering model, naming conventions, props design rules, and reuse criteria for the Tab Out Chrome extension. It is a decision-making reference for when to extract a new component, where to place it, and what its interface should look like.

All 17 components live in `src/newtab/components/` in a flat structure. The page orchestrator lives at `src/newtab/App.tsx`.

---

## Component Layering Model

The directory is flat, but components fall into four conceptual layers. Each layer has distinct responsibilities and constraints.

### Layer 1: Page Orchestrator

**File:** `src/newtab/App.tsx` (not in `components/`)

**Responsibilities:**
- Owns page composition and render order
- Wires stores to component props (reads store state, passes data and handlers down)
- Manages ephemeral UI state (toast, search query, dialog state, settings panel visibility)
- Coordinates cross-cutting side effects (dark mode, keyboard shortcuts, Chrome storage sync)

**Current state:** App.tsx is the sole orchestrator. It reads from `useTabStore`, `useSavedStore`, and `useSettingsStore`, and passes extracted data plus handler callbacks to every child component.

**Rules:**
- This is the only file that imports stores directly
- No component in `components/` should import a Zustand store or the `useChromeStorage` hook
- Handlers defined here wrap store actions with side effects (toast, sound, confetti) before passing them down

### Layer 2: Page Sections

**Components:** `DomainCard`, `DeferredColumn`, `Header`, `Footer`, `SettingsPanel`

**Responsibilities:**
- Own a complete product section with a visual boundary
- Accept business-shaped props (domain objects, not primitives when a group of related fields travels together)
- May compose composite components internally
- May manage local UI state (expanded/collapsed, open/closed)

| Component | Key Props | Local State |
|---|---|---|
| `DomainCard` | `group: TabGroup`, close/save/focus callbacks | `expanded: boolean` (show-more toggle) |
| `DeferredColumn` | `active: SavedTab[]`, `archived: SavedTab[]`, checkoff/dismiss/search callbacks | `archiveOpen: boolean` |
| `Header` | `totalTabs: number`, `totalDupes: number`, `totalDomains: number` | None (pure display) |
| `Footer` | `tabCount: number` | None |
| `SettingsPanel` | Theme/flags + setters, `open`/`onClose` | None (Escape handler via useEffect) |

**Rules:**
- Sections accept full domain objects (`TabGroup`, `SavedTab[]`). They do not import types from `../../types` for primitives that should be passed as individual props.
- Sections may import utility functions for display logic (e.g., `getFaviconUrl`, `getHostname`). They must not import stores or storage utilities.
- Sections may contain inline SVG icons when the icon is specific to that section and unlikely to be reused.

### Layer 3: Composite Components

**Components:** `TabChip`, `DeferredItem`, `ConfirmationDialog`, `SearchBar`, `Toast`, `DupeBanner`, `NudgeBanner`, `UpdateBanner`, `EmptyState`, `LoadingState`, `ErrorBoundary`

**Responsibilities:**
- Encapsulate a stable interaction pattern (a chip with hover actions, a dismissible banner, a modal dialog)
- Accept business-friendly props: strings, numbers, booleans, and callbacks
- Must NOT import stores, storage utilities, or Chrome APIs
- May manage local interaction state (focus, hover)

| Component | Key Props | Pattern |
|---|---|---|
| `TabChip` | `url`, `title`, `duplicateCount`, `onFocus`/`onClose`/`onSave` | Interactive list item with hover actions |
| `DeferredItem` | `item: SavedTab`, `onCheckOff`/`onDismiss` | Checklist row with favicon and dismiss |
| `ConfirmationDialog` | `open`, `title`, `message`, `confirmLabel`, `onConfirm`/`onCancel` | Modal overlay with focus trap and Escape dismiss |
| `SearchBar` | `value`, `onChange`, `resultCount`, `totalCount` | Text input with search icon, result counter, clear button, keyboard hint |
| `Toast` | `message`, `visible` | Fixed-position status notification |
| `DupeBanner` | `count`, `onClose` | Dismissible warning banner with action button |
| `NudgeBanner` | `tabCount`, `threshold?`, `onDismiss` | Conditional alert banner (renders null below threshold) |
| `UpdateBanner` | `version`, `onDismiss` | Dismissible info banner |
| `EmptyState` | None | Static celebratory illustration |
| `LoadingState` | None | Skeleton pulse animation |
| `ErrorBoundary` | `children` | Class-based React error boundary |

**Rules:**
- Composites import nothing from `stores/` or `utils/storage.ts`.
- Composites may import pure utility functions from `utils/url.ts` or `lib/title-cleaner.ts` for display formatting (as `TabChip` does).
- Composites may contain inline SVG icons when the icon is integral to the component's visual identity.

### Layer 4: Primitives (Not Yet Extracted)

The codebase currently has no primitive layer. Visual treatments like focus rings, button hover states, card surfaces, and badge styling are duplicated inline across components. These should be extracted gradually as the need arises, following the reuse criteria below.

**Candidate primitives for next phase:**

| Primitive | Duplicated Pattern | Current Locations |
|---|---|---|
| `IconButton` | Square button with icon, rounded-chip, hover color shift, focus-visible ring | DomainCard (close all, dedup), Header, SettingsPanel (close), Footer, DeferredItem (dismiss), DupeBanner, NudgeBanner, UpdateBanner, SearchBar (clear) |
| `Badge` | Inline-flex pill with rounded-chip, background tint, count text | DomainCard (tab count, duplicate count), DeferredColumn (item count), DeferredColumn archive count |
| `ActionButton` | Styled button with icon + label, rounded-chip, themed hover | DomainCard footer actions, DupeBanner "Close extras" |
| `SectionHeader` | Heading + horizontal rule + count pill in flex row | DeferredColumn ("Saved for later"), App.tsx ("Right now") |
| `CardSurface` | Rounded-card, shadow-card, hover:shadow-card-hover, hover:-translate-y-0.5 | DomainCard, LoadingState skeletons |
| `TextInput` | Border, rounded-chip, focus ring, placeholder styling | SearchBar, DeferredColumn archive search |

---

## Naming and Placement Rules

1. **File naming:** PascalCase matching the default or named export. Example: `ConfirmationDialog.tsx` exports `ConfirmationDialog`.
2. **Directory:** All components in `src/newtab/components/`. Flat structure. No subdirectories.
3. **Page orchestrator:** Lives at `src/newtab/App.tsx`, never in `components/`.
4. **DnD wrapper:** `SortableDomainCard` wraps `DomainCard` with `@dnd-kit` concern. This is a section-level component, not a primitive. It passes through all DomainCard props and adds drag transform/opacity.

---

## Props Design Rules

### Sections (Layer 2)

- Accept full domain objects: `group: TabGroup`, `active: SavedTab[]`, `archived: SavedTab[]`
- Accept callback handlers for user actions: `onCloseDomain`, `onCheckOff`, `onDismiss`
- Accept configuration: `maxChipsVisible?`, `open`, `onClose`
- Do not accept primitives that should travel together. If `url` + `title` + `savedAt` always arrive as a unit, accept the `SavedTab` object.

### Composites (Layer 3)

- Accept business-friendly primitives: `url: string`, `title: string`, `count: number`, `visible: boolean`
- Accept callbacks: `onFocus`, `onClose`, `onDismiss`, `onChange`
- Avoid accepting domain objects when only 1-2 fields are needed. Prefer `url: string` over `tab: Tab` when the component only uses `tab.url`.
- May accept `threshold?` with sensible defaults (e.g., `NudgeBanner` defaults to 15).

### Primitives (Layer 4, future)

- Expose visual and interaction API only: `variant`, `size`, `disabled`, `onClick`, `aria-label`
- Do not accept domain-specific data. A `Badge` accepts `count: number` and `tone: 'neutral' | 'warning'`, not `tabCount: number`.
- No callbacks beyond DOM-level events (`onClick`, `onFocus`).

### Data Flow Direction

- **Callbacks flow down:** App.tsx defines handlers, passes them as props. Components invoke them.
- **Events flow up:** When a user clicks "Close all", DomainCard calls `onCloseDomain(group)`. The handler in App.tsx decides what happens (close tabs, show toast, play sound).
- **Never pass store objects as props.** Pass specific data slices and handler functions. Example: `<SettingsPanel theme={settings.theme} onSetTheme={settingsStore.setTheme} />`, not `<SettingsPanel store={settingsStore} />`.

---

## Reuse Criteria

Create a new component abstraction ONLY when at least 2 of these 4 conditions are true:

1. The pattern appears in 2 or more separate locations
2. The visual structure and interaction states match (hover, focus, active, disabled)
3. The behavior model is the same even if labels differ
4. The extracted API remains small and coherent (no more than 6-8 props)

### When NOT to Abstract

Do NOT create a shared component when:

- Components only look vaguely similar (e.g., a settings toggle and a checkbox -- similar visual but different interaction semantics)
- The extracted props become a loose generic bag (e.g., `variant?: string` with 10 possible values, each triggering different rendering)
- Abstraction hides important domain meaning (e.g., a `DupeBanner` and `NudgeBanner` share structure but express fundamentally different user scenarios -- keep them separate)
- The abstraction would force a low-level component to know about stores, storage, or Chrome APIs

### Worked Example: Why the Three Banners Stay Separate

`DupeBanner`, `NudgeBanner`, and `UpdateBanner` share visual DNA (icon circle + message + dismiss button). They could be merged into a single `Banner` with `variant: 'warning' | 'alert' | 'info'`. The reasons to keep them separate:

- Each has unique conditional render logic (`DupeBanner` hides when count <= 1, `NudgeBanner` hides below threshold, `UpdateBanner` is always shown when mounted)
- Each carries different domain meaning (tab-out duplicates vs. total tab count vs. version update)
- `DupeBanner` has an inline action button ("Close extras"); the others only have dismiss
- Merging would require a generic `actions?: React.ReactNode` slot, turning the component into a shell

The correct primitive to extract from them is `IconButton` (the dismiss/close X button), not a unified banner.

---

## Anti-Patterns

### Components importing stores directly

No component in `src/newtab/components/` should import from `../stores/`. All store data and actions flow through props from App.tsx.

```
// WRONG
import { useTabStore } from '../../stores/tab-store';
const tabs = useTabStore((s) => s.tabs);

// CORRECT
// In App.tsx:
const { tabs } = useTabStore();
<DomainCard tabs={tabs} onCloseTab={handleCloseTab} />
```

### Components importing storage utilities

No component should import from `utils/storage.ts`. Storage is a store-level concern. Components receive data through props.

### Passing entire store objects as props

```
// WRONG
<SettingsPanel store={settingsStore} />

// CORRECT
<SettingsPanel
  theme={settings.theme}
  soundEnabled={settings.soundEnabled}
  onSetTheme={settingsStore.setTheme}
/>
```

### Inline complex logic in JSX

When a component's render method contains computation (filtering, sorting, deduplication), extract it to a helper function or `useMemo` hook. Example: DomainCard's duplicate detection logic is properly extracted into a `useMemo` block.

### Duplicated focus-ring and hover treatments

The following CSS pattern appears in 10+ locations:

```
focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none
```

This should eventually become a shared class or primitive component. Until primitives are extracted, keep the pattern consistent by copy-pasting the exact same token sequence.

---

## Target Primitive Backlog

Prioritized by duplication count and impact. Each entry includes the extraction contract.

### 1. IconButton

**Duplication:** 9+ locations (DomainCard close-all/dedup buttons, Header settings gear in App.tsx, SettingsPanel close, DeferredItem dismiss, DupeBanner dismiss, NudgeBanner dismiss, UpdateBanner dismiss, SearchBar clear)

**Contract:**
```typescript
interface IconButtonProps {
  icon: React.ReactElement;
  onClick: () => void;
  'aria-label': string;
  size?: 'sm' | 'md';        // sm = h-5 w-5, md = h-7 w-7 (default)
  tone?: 'neutral' | 'blue' | 'red' | 'amber' | 'sage';
  className?: string;
}
```

**Visual contract:** Rounded container, icon centered, hover applies tone-colored background at 10% opacity, focus-visible ring, transition-colors.

### 2. Badge

**Duplication:** DomainCard tab count badge, DomainCard duplicate badge, DeferredColumn item count, DeferredColumn archive count

**Contract:**
```typescript
interface BadgeProps {
  count: number;
  label?: string;             // e.g., "tabs open", "duplicates"
  tone?: 'neutral' | 'warning';
  icon?: React.ReactElement;  // optional leading icon
}
```

**Visual contract:** Inline-flex, rounded-chip, padded, small text, background tint matching tone.

### 3. ActionButton

**Duplication:** DomainCard "Close all N tabs", DomainCard "Close N duplicates", DupeBanner "Close extras"

**Contract:**
```typescript
interface ActionButtonProps {
  icon?: React.ReactElement;
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'red' | 'amber';
  size?: 'sm' | 'md';
}
```

**Visual contract:** Inline-flex with gap, rounded-chip, icon + text, hover applies tone-colored background, focus-visible ring.

### 4. SectionHeader

**Duplication:** DeferredColumn ("Saved for later" + divider + count), App.tsx ("Right now" + divider + count + close-all button)

**Contract:**
```typescript
interface SectionHeaderProps {
  title: string;
  count?: number;
  countLabel?: string;        // e.g., "items", "tabs"
  actions?: React.ReactNode;  // optional trailing actions (close-all button)
}
```

**Visual contract:** Flex row, heading text, flex-1 horizontal rule, optional count pill, optional action slot.

### 5. CardSurface

**Duplication:** DomainCard main wrapper, LoadingState skeleton cards

**Contract:**
```typescript
interface CardSurfaceProps {
  children: React.ReactNode;
  accentColor?: string;       // top status bar color
  hoverable?: boolean;        // adds shadow-card-hover and -translate-y-0.5
  className?: string;
}
```

**Visual contract:** Rounded-card, shadow-card, optional 3px top accent bar, optional hover lift animation, overflow-hidden.

### 6. TextInput

**Duplication:** SearchBar main input, DeferredColumn archive search input

**Contract:**
```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label': string;
  leadingIcon?: React.ReactElement;
  trailingContent?: React.ReactNode;
  className?: string;
}
```

**Visual contract:** Full-width border input, rounded-chip, focus ring and border color change, placeholder styling, optional leading icon, optional trailing slot (result count, clear button, keyboard hint).

---

## Component Inventory

Quick reference for all 17 components and the page orchestrator.

| Component | Layer | Imports Stores | Imports Storage | Props Count | Has Local State |
|---|---|---|---|---|---|
| App.tsx | Orchestrator | Yes | Yes (via hook) | 0 (top-level) | Yes (toast, search, dialog, settings) |
| DomainCard | Section | No | No | 7 | Yes (expanded) |
| DeferredColumn | Section | No | No | 6 | Yes (archiveOpen) |
| Header | Section | No | No | 0 | No |
| Footer | Section | No | No | 1 | No |
| SettingsPanel | Section | No | No | 7 | No (uses useEffect for Escape) |
| SortableDomainCard | Section | No | No | 6 | No (delegates to DomainCard) |
| TabChip | Composite | No | No | 6 | No |
| DeferredItem | Composite | No | No | 3 | No |
| ArchiveItem | Composite | No | No | 1 | No | (co-located in DeferredItem.tsx) |
| ConfirmationDialog | Composite | No | No | 6 | No (uses useEffect for focus trap) |
| SearchBar | Composite | No | No | 4 | Yes (focused) |
| Toast | Composite | No | No | 2 | No |
| DupeBanner | Composite | No | No | 2 | No |
| NudgeBanner | Composite | No | No | 3 | No |
| UpdateBanner | Composite | No | No | 2 | No |
| EmptyState | Composite | No | No | 0 | No |
| LoadingState | Composite | No | No | 0 | No |
| ErrorBoundary | Composite | No | No | 1 (children) | Yes (hasError) |

All 17 component files in `components/` are store-free and storage-free. `ArchiveItem` is co-located in `DeferredItem.tsx` and follows the same rules. The current architecture maintains clean separation.

---

## Decision Flowchart

When adding a new visual element to the codebase:

1. **Is it a full page section with business data?** -> Layer 2 (Section). Accept domain objects. Place in `components/`.
2. **Is it a reusable interaction pattern?** -> Layer 3 (Composite). Accept primitives and callbacks. Place in `components/`.
3. **Is it a low-level visual building block used in 2+ composites?** -> Layer 4 (Primitive). Accept visual/interaction props only. Place in `components/`. Verify against the reuse criteria (2 of 4 conditions must hold).
4. **Does it only appear once and is unlikely to repeat?** -> Keep it inline in the parent component. Do not extract prematurely.

When in doubt, leave the code inline. Premature abstraction is more harmful than mild duplication. Extract when the pattern has proven itself across at least two concrete use cases.
