# Group Tree

A React and TypeScript engine for rendering and selecting nested spaces, taxonomies, and group parts. It can also combine that tree with a flat list of groups.

The package provides tree state, data-hook contracts, and render callbacks. Your application supplies the data access, item state, filters, and UI. It does not impose a storage layer, query system, or visual design.

## Tree model

```text
Spaces
└── Space
    └── Taxonomy
        └── Group part
            └── Taxonomy
                └── Group part
                    └── …
```

Taxonomies and group parts can nest recursively. A tree can start at the spaces root or at a single group part.

`GroupsTreeHOC` composes the spaces tree with a separate flat group list. This is useful when some groups do not belong in the hierarchy. The flat list is paginated by increasing a limit; its data hook receives the current filter and limit.

## Responsibilities

| Layer | Responsibility |
|---|---|
| Data hooks | Load spaces, taxonomies, and group parts; report results to the tree store. |
| Item-state hooks | Derive each item's state from the item, filter, and parent context. |
| Tree engine | Build nested state, compute visibility, and coordinate selection. |
| Render callbacks | Render items, hidden containers, and the tree's outer container. |

Data access and rendering are supplied by the consumer. This keeps the tree engine independent of any particular API, database, component library, or styling system.

## Public API

Import from the package entry point. The root barrel is `src/index.ts`.

| API | Purpose |
|---|---|
| `MultiSelectSpacesTreeHOC` / `SingleSelectSpacesTreeHOC` | Create selectable trees rooted at spaces. |
| `MultiSelectGroupPartTreeHOC` / `SingleSelectGroupPartTreeHOC` | Create selectable trees rooted at a group part. |
| `PerTaxonomySelectSpacesTreeHOC` / `PerTaxonomySelectGroupPartTreeHOC` | Create trees whose selection state is tracked per taxonomy. |
| `MultiSelectGroupsTreeHOC` / `SingleSelectGroupsTreeHOC` | Combine a spaces tree with a flat, selectable groups list. |
| `GroupsTreeHOC` | Compose a spaces tree with a flat groups list without adding a selection mode. |
| `emptySelectedGroups`, `hasGroupsSelection`, `setGroupPartIds`, `toggleGroupId` | Create and update multi-selection values for the combined tree and list. |
| `emptySelectedGroup`, `hasGroupSelection`, `fromGroupPartId`, `fromGroupId` | Create and inspect single-selection values. |

Each tree HOC returns components and store helpers suited to that tree. For example, the spaces-based variants expose `Spaces`, `TreeProvider`, and `useTreeSelector`; the combined groups variants also expose `Groups`.

## Connecting data

The spaces tree expects data hooks for:

- **Spaces** at the root.
- **Taxonomies** for a space.
- **Group parts** for a taxonomy and its optional parent group part.

The group-part-rooted tree expects taxonomy and group-part hooks, plus a hook to load taxonomies beneath its root. Hooks receive the current filter and a callback for publishing loaded items into the tree store. Implement data access in these hooks; the tree engine does not fetch or subscribe to data on its own.

The item domain uses objects with stable `_id` values and explicit `brand` fields:

```ts
type Space = { _id: string; brand: 'space' }
type Taxonomy = { _id: string; subid: string; brand: 'taxonomy' }
type GroupPart = { _id: string; brand: 'groupPart' }
```

Extend these shapes with the fields your application needs. Filters are generic: pass the same filter type to the data hooks and item-state hooks, and use it to decide what data to load and how to derive item state.

For combined trees, a flat group item needs an `id`; it may include additional display data. Its data hook receives the filter and current page limit.

## Rendering and visibility

Render callbacks are passed through the tree context. They receive the item, its computed state, an update function, and rendered children grouped by child type. Use them to provide labels, selection controls, and application-specific markup.

The consumer also supplies:

- An item-state hook for each node type.
- A visibility predicate that decides whether a computed node is visible.
- A hidden-container renderer for keeping or removing invisible nodes from the UI.
- An outer-container renderer for tree content and its loading, populated, or empty state.

This keeps presentation separate from tree behavior. The package does not provide application-specific labels, controls, or styles.

## Selection values

The combined multi-select API keeps hierarchical and flat-list selection separate:

```ts
type SelectedGroups = {
  groupPartIds: string[]
  groupIds: string[]
}
```

Use `emptySelectedGroups()` to create an empty value. Use `toggleGroupId(value, id)` to toggle an item from the flat groups list; tree selection is reflected in `groupPartIds`.

The combined single-select API uses a discriminated union:

```ts
type SelectedGroup =
  | { type: 'group'; groupId: string }
  | { type: 'groupPart'; groupPartId: string }
  | { type: 'none' }
```

Use `emptySelectedGroup()` for no selection. `fromGroupId` and `fromGroupPartId` convert nullable IDs into this representation.

## React requirement

React is a peer dependency. The package uses React hooks and returns React components; call its hooks only from React components or other hooks, and render returned components within the corresponding `TreeProvider` when the selected API requires it.
