# Tab Out Frontend Architecture, Storage Guardrails, and Component Reuse Design

## Scope

This design defines the next-step target architecture for Tab Out without rewriting the stack. It covers:

- Frontend design system documentation
- Frontend architecture documentation
- Storage management rules
- Component reuse rules
- ESLint and verification guardrails

This is a gradual architecture cleanup plan, not a large refactor. The project keeps the current React + Zustand + Chrome extension structure.

## Goals

1. Keep the current stack and file layout broadly intact.
2. Stop further architecture drift in `App.tsx`, storage writes, and component layering.
3. Define a target structure that future work must move toward.
4. Add lightweight, enforceable guardrails instead of relying on convention alone.
5. Produce documentation that explains both current state and target state.

## Non-Goals

- Replacing Zustand
- Replacing Tailwind or the current token system
- Reorganizing the whole repo into a new package structure
- Building a full internal component library in this phase
- Writing custom ESLint plugins in this phase

## Current State Summary

### Frontend structure

- `src/newtab/App.tsx` acts as the page orchestrator and currently owns page state, store wiring, several interaction flows, and some UI-level effects.
- `src/newtab/components/` contains a mix of page sections, reusable business components, and one-off UI pieces in a flat directory.
- `src/newtab/styles/global.css` already defines visual tokens and layout primitives, but usage rules are not documented.

### State and storage

- State is split across `tab-store`, `saved-store`, `settings-store`, and `workspace-store`.
- Storage safety improved with `updateStorage()` in `src/utils/storage.ts`, but there is no formal rule yet that all business writes must go through domain-safe storage adapters.
- `writeStorage()` still exists and needs explicit usage boundaries.

### Reuse and consistency

- Several UI patterns already repeat across components:
  - icon-only action buttons
  - text inputs
  - badges
  - surface cards and section headers
  - repeated focus-ring and hover treatment
- Reuse decisions are currently convention-based rather than documented and enforced.

## Approved Architecture Direction

### 1. Page Layer

`App.tsx` remains the page orchestrator, but its role is narrowed.

Allowed responsibilities:

- compose page sections
- hold transient page-only UI state
- wire stores and action handlers together
- coordinate page-level interaction flows

Disallowed responsibilities:

- direct storage access
- direct Chrome storage mutation logic
- direct low-level effect primitives such as raw sound/confetti calls
- embedding domain-specific transformation helpers that belong in `lib/`, `utils/`, or stores

Page-only UI state includes:

- search query
- dialog visibility
- toast visibility
- settings panel open state
- other ephemeral view state that does not persist

### 2. Store Layer

Each store owns one business domain:

- `tab-store`: open tab data, grouping, close/focus flows, reorder persistence trigger
- `saved-store`: save-for-later lifecycle and archive state
- `settings-store`: settings state and settings persistence entrypoints
- `workspace-store`: workspace CRUD and restore flows

Rules:

- stores may own domain state and domain actions
- stores must not directly call `chrome.storage.local`
- stores should not compose full `StorageSchema` snapshots themselves
- cross-domain orchestration belongs in the page layer, not inside stores

### 3. Storage Layer

`src/utils/storage.ts` is the only allowed adapter over `chrome.storage.local`.

Rules:

- `readStorage()` is the read entrypoint
- `updateStorage()` is the default write entrypoint for read-modify-write flows
- domain writers such as `writeSettings()` and `writeGroupOrder()` are preferred over raw full-schema writes
- `writeStorage()` is reserved for full replacement scenarios only:
  - migration
  - import/restore
  - controlled test setup

Target direction after this phase:

- keep the current file for now
- document a future split into `storage/core` plus domain-specific writers without requiring immediate migration

### 4. Effect Layer

Side effects should be routed through named effect entrypoints instead of scattered raw calls.

Examples:

- close feedback effects: `src/lib/close-effects.ts`
- theme application flow
- badge update flow
- storage change listeners

Rule:

- UI code should express intent, not call effect primitives directly

## Component Layering Model

Components are split conceptually into four layers, even if the directory is not fully migrated yet.

### Page orchestrators

- example: `App.tsx`
- owns page composition and flow wiring

### Page sections

- examples: `DomainCard`, `DeferredColumn`, `Header`
- own a complete product section with business-shaped props

### Composite components

- examples: `TabChip`, `DeferredItem`, `SettingsPanel`, `ConfirmationDialog`
- encapsulate a stable interaction pattern
- do not import stores or storage

### Primitives

This layer is mostly missing today and should be introduced gradually.

Target primitives for the next phase:

- `IconButton`
- `TextInput`
- `Badge`
- `ActionButton`
- `SectionHeader`
- `CardSurface`

Rules:

- primitives expose visual and interaction API only
- composites may carry business-friendly props
- sections may accept full domain objects
- components must not directly perform persistence or browser API work

## Reuse Rules

A new abstraction should be created only when at least two of the following are true:

- the pattern appears in two or more places
- visual structure and interaction states match
- the behavior model is the same even if labels differ
- the extracted API remains small and coherent

Do not abstract when:

- the components only look vaguely similar
- the extracted props become a loose generic bag
- abstraction hides important domain meaning
- abstraction would force low-level components to know about stores, storage, or Chrome APIs

## Frontend Design System Direction

The design documentation should define a stable product language rather than a file inventory.

It should cover:

- product visual principles
- typography roles
- color and tone roles
- card and chip surface language
- layout rules
- motion and reduced-motion behavior
- focus, hover, and feedback states
- accessibility and contrast expectations

The existing tokens in `src/newtab/styles/global.css` remain the base system. The new documentation should define how they are used, not replace them.

## Documentation Deliverables

### 1. Frontend design document

Purpose:

- explain the visual language of Tab Out
- define layout, token, and interaction rules
- help future UI changes stay consistent

Content:

- visual goals and tone
- typography rules
- color and status semantics
- spacing, radius, and surface rules
- interaction and motion rules
- accessibility expectations
- examples of what to preserve vs what to avoid

### 2. Architecture document

Purpose:

- define the operational boundaries of page, store, storage, and effect layers
- document allowed and forbidden dependencies
- explain storage management and concurrency rules

Content:

- system overview
- layer responsibilities
- data flow
- storage model and safety rules
- effect routing
- import boundary rules
- migration direction for future cleanup

### 3. Component reuse document

Purpose:

- define how to classify components
- define when to reuse, when to abstract, and when not to
- identify target primitive candidates

Content:

- component layering model
- naming and placement rules
- props design rules
- reuse criteria
- anti-patterns
- target primitive backlog

## Guardrail Plan

### ESLint guardrails to add now

1. Restrict direct `chrome.storage.local` access outside `src/utils/storage.ts`.
2. Restrict importing `writeStorage` outside approved storage internals and tests.
3. Restrict importing `playCloseSound` and `shootConfetti` from page/component code.
4. Restrict component files from importing stores directly.
5. Restrict component files from importing storage utilities directly.

### Documentation-enforced rules

1. Every new persistent feature must declare:
   - page state
   - store state
   - persisted state
2. Every new UI component must be classified as:
   - section
   - composite
   - primitive
3. Every new side effect must have a named entrypoint rather than ad hoc direct calls.

### Verification guardrails

- UI-only changes: `lint + build`
- store or storage changes: `test + lint + build`
- interaction/effect changes: regression coverage or explicit justification
- token or visual system changes: manual light/dark/focus/reduced-motion review

## Implementation Plan For This Phase

1. Write the three docs using the approved target architecture above.
2. Add the minimum viable ESLint guardrails.
3. Keep implementation incremental and avoid broad file reorganization.
4. Verify with `npm test`, `npm run lint`, and `npm run build`.

## Risks

### Over-documenting current flaws

If the docs only describe current implementation, they will fossilize accidental structure. The docs must separate:

- current state
- target state
- current phase constraints

### Over-enforcing too early

If lint rules are stronger than the codebase can support today, they will be ignored or bypassed. This phase should enforce the highest-signal restrictions only.

### Primitive explosion

If every repeated class string becomes a shared component immediately, the UI layer will become harder to work in. Primitive extraction should start with the most repeated, stable patterns only.

## Acceptance Criteria

- A design doc exists for this architecture direction.
- Three formal docs exist:
  - frontend design
  - architecture
  - component reuse
- ESLint includes minimum viable architectural guardrails.
- Existing test, lint, and build commands still pass.

