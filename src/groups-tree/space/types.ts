import type { ReactNode } from 'react'
import type {
  TaxonomyGroupPartCtxDom,
  TaxonomyItemsDomain,
  TaxonomyGroupPartExtras,
  TaxonomyListItem,
  TaxonomyShape,
  TaxonomyItemKeys,
  UseTaxonomyItemState,
  RenderItem,
  TaxonomyShapes,
} from '../group-part/types'
import type {
  ListItemBrand,
  Lists,
  SomeListOf,
  StateKeys,
  StatesDomain,
  TreeNodes,
  UseItemState,
} from '../tree-common'

// Re-export group-part types needed downstream
export type {
  RenderHideContainer,
  SomeItem,
  TaxonomyGroupPartComponents,
  TaxonomyGroupPartCtxDom,
  TaxonomyItemsDomain as TaxonomyGroupPartDomain,
  TaxonomyGroupPartExtras,
  TaxonomyNodeByLevel,
  TaxonomyNodeLayers,
  TaxonomyShape,
} from '../group-part/types'

// ---- Shapes --------------------------------------------------------------

export type SpacesShape = {
  type: 'root'
  child: { spaces: { type: 'space'; child: { taxonomies: TaxonomyShape } } }
}
export type SpaceShapes = TaxonomyShapes & {
  root: SpacesShape,
  space: SpacesShape['child']['spaces'],
}


// ---- Node-by-level (all four levels) -------------------------------------

export type SpacesNodeByLevel<T> = TreeNodes<T, SpacesTreeLevel, SpaceShapes>

export type SpacesTreeLevel = 'root' | 'space' | TaxonomyItemKeys

/**
 * NodeLayers<States, L>:
 * - For L extends TaxonomyTreeLevel ('taxonomy' | 'groupPart'): resolves to
 *   TaxonomyNodeLayers<States, L> so group-part code can share the exact type.
 * - For root / space levels: maps StateKeys through NodeByLevel as usual.
 */
export type SpacesNodes<States extends StatesDomain> = {
  [L in SpacesTreeLevel]: {
    [P in StateKeys]: SpacesNodeByLevel<States[P]>[L]
  }
}

// ---- Domain item types ---------------------------------------------------

export type SpacesItemsDomain = TaxonomyItemsDomain & {
  space: { _id: string; brand: 'space' }
}

export type SpacesListItem<Items extends SpacesItemsDomain> = TaxonomyListItem<Items> & {
  space: Items['space'] & ListItemBrand<'space'>
  root: ListItemBrand<'root'>
}

export type SpaceItemKeys = TaxonomyItemKeys | 'space'

export type SpaceLists<Items extends SpacesItemsDomain> = Lists<
  SpaceItemKeys,
  SpacesListItem<Items>
>

export type SomeList<Items extends SpacesItemsDomain> = SomeListOf<
  SpaceItemKeys,
  SpacesListItem<Items>
>

// ---- Extras (concrete for the full tree) ---------------------------------

export type Extras<
  States extends StatesDomain,
  Items extends SpacesItemsDomain,
> = TaxonomyGroupPartExtras<States, Items, SpacesNodes<States>['root']> & { space: {} }

// ---- Ctx domain ----------------------------------------------------------

export type RenderArgs<
  States extends StatesDomain,
  Items extends SpacesItemsDomain,
  Ctx,
  K extends keyof SpacesItemsDomain,
> = Parameters<RenderItem<States, K, Items, Ctx, SpacesNodes<States>>>[0]

export type CtxDom<
  States extends StatesDomain,
  Items extends SpacesItemsDomain,
  Ctx,
> = TaxonomyGroupPartCtxDom<States, Items, Ctx> & {
  renderItem: {
    [K in keyof SpacesItemsDomain]: RenderItem<States, K, Items, Ctx, SpacesNodes<States>>
  }
  renderContainer: (args: {
    ctx: Ctx
    state: States['CState'] | undefined
    children: ReactNode
  }) => ReactNode
}

// ---- SpaceDeps (lives here so space/components.tsx stays thin) -----------

import type { SetItemData, UseSetItemState, UseTreeSelector } from '../tree-common'

export type UseSpaceItemState<
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
> = UseTaxonomyItemState<Filter, Items, States, SpacesNodes<States>['root']> & {
  space: UseItemState<
    Filter,
    Extras<States, Items>['space'],
    Items['space'],
    States,
    SpacesNodes<States>['space']
  >
}

export type SpaceArgs<
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
  Ctx extends CtxDom<States, Items, Ctx>,
> = {
  useItemState: UseSpaceItemState<Filter, Items, States>
  isVisible: (state: States['CState'] | undefined) => boolean
  useTaxonomies: (
    space: Items['space'],
    setItemData: SetItemData<
      States,
      SpacesNodes<States>['space'],
      SpacesListItem<Items>['taxonomy']
    >,
    filter: Filter,
  ) => void
  useSpaces: (
    setItemData: SetItemData<States, SpacesNodes<States>['root'], SpacesListItem<Items>['space']>,
    filter: Filter,
  ) => void
}
