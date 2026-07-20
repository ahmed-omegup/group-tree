import type { ReactNode } from 'react'
import type {
  Lens,
  ListItemBrand,
  NodeLayerDomain,
  SetItemData,
  StateKeys,
  StatesDomain,
  Tree,
  TreeNodes,
  Update,
  UseItemState,
  UseSetItemState,
  UseTreeSelector,
} from '../tree-common'

// ---- Shape ---------------------------------------------------------------

export type TaxonomyShape = {
  type: 'taxonomy'
  child: { groupParts: { type: 'groupPart'; child: { taxonomies: TaxonomyShape } } }
}

// ---- Node-by-level helpers (taxonomy / groupPart only) -------------------

export type TaxonomyItemKeys = 'groupPart' | 'taxonomy'

export type TaxonomyShapes = {
  taxonomy: TaxonomyShape
  groupPart: TaxonomyShape['child']['groupParts']
}
export type TaxonomyNodeByLevel<T> = TreeNodes<T, TaxonomyItemKeys, TaxonomyShapes>

export type TaxonomyNodeLayers<States extends StatesDomain> = {
  [L in TaxonomyItemKeys]: {
    [P in StateKeys]: TaxonomyNodeByLevel<States[P]>[L]
  }
}
// ---- Domain item types ---------------------------------------------------

export type TaxonomyItemsDomain = {
  taxonomy: { _id: string; subid: string; brand: 'taxonomy' }
  groupPart: { _id: string; brand: 'groupPart' }
}

// ---- Extras (generic over RootNode so group-part stays space-agnostic) ---

/**
 * Extra props passed to GroupPart and Taxonomy components.
 * RootNode defaults to the abstract NodeLayerDomain so that this type is
 * usable in group-part without importing from space.  In practice space
 * instantiates it with NodeLayers<States, 'root'> which gives full type safety.
 */
export type TaxonomyGroupPartExtras<
  States extends StatesDomain,
  Items extends TaxonomyItemsDomain,
  RootNode extends NodeLayerDomain<States> = NodeLayerDomain<States>,
> = {
  groupPart: {
    path: Lens<StateKeys, RootNode, TaxonomyNodeLayers<States>['groupPart']>
  }
  taxonomy: {
    groupPart: Items['groupPart'] | null
    taxonomy: TaxonomyListItem<Items>['taxonomy']
    path: Lens<StateKeys, RootNode, TaxonomyNodeLayers<States>['taxonomy']>
  }
}

// ---- Ctx domain ----------------------------------------------------------

export type RenderHideContainer<Ctx> = (args: {
  visible: boolean
  ctx: Ctx
  children: ReactNode
}) => ReactNode

export type SomeItem<Items, Kinds extends keyof Items> = {
  [K in Kinds]: { type: K; item: Items[K] }
}[Kinds]

export type RenderItem<
  States extends StatesDomain,
  K extends string,
  Items extends Record<K, unknown>,
  Ctx,
  NodeLayers extends Record<K, NodeLayerDomain<States>>,
> = (args: {
  ctx: Ctx
  item: SomeItem<Items, K>
  state: States['CState'] | undefined
  update: Update<States, NodeLayers[K]>
  child: Record<keyof NodeLayers[K]['CState']['child'], ReactNode[]>
}) => ReactNode

export type TaxonomyGroupPartCtx<
  States extends StatesDomain,
  ExtraKey extends string,
  Items extends TaxonomyItemsDomain & Record<ExtraKey, unknown>,
  Ctx,
  NodeLayers extends TaxonomyNodeLayers<States> & Record<ExtraKey, NodeLayerDomain<States>>,
> = Ctx & {
  renderItem: {
    [K in keyof TaxonomyItemsDomain | ExtraKey]: RenderItem<States, K, Items, Ctx, NodeLayers>
  }
  renderHideContainer: RenderHideContainer<Ctx>
}

export type TaxonomyGroupPartCtxDom<
  States extends StatesDomain,
  Items extends TaxonomyItemsDomain,
  Ctx,
> = TaxonomyGroupPartCtx<States, never, Items, Ctx, TaxonomyNodeLayers<States>>
// ---- Component type (exported for makeSpaceComponents) -------------------

type Component<
  K extends keyof TaxonomyItemsDomain,
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  Ctx,
  RootNode extends NodeLayerDomain<States>,
> = (props: {
  item: Items[K]
  ctx: Ctx
  filter: Filter
  extra: TaxonomyGroupPartExtras<States, Items, RootNode>[K]
}) => React.ReactNode

export type TaxonomyGroupPartComponents<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  Ctx,
  RootNode extends NodeLayerDomain<States> = NodeLayerDomain<States>,
  CtxAug = TaxonomyGroupPartCtxDom<States, Items, Ctx>,
> = {
  Taxonomy: Component<'taxonomy', Filter, Items, States, CtxAug, RootNode>
  GroupPart: Component<'groupPart', Filter, Items, States, CtxAug, RootNode>
}

export type TaxonomyGroupPartMakeComponents<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States> = NodeLayerDomain<States>,
> = <Ctx>() => TaxonomyGroupPartComponents<Filter, Items, States, Ctx, RootNode>

// ---- List item types (owned here so group-part does not import from space) --

export type TaxonomyListItem<Items extends TaxonomyItemsDomain> = {
  taxonomy: Tree<Items['taxonomy'], ListItemBrand<'taxonomy'>>
  groupPart: Items['groupPart'] & ListItemBrand<'groupPart'>
}

export type UseTaxonomyItemState<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
> = {
  [K in TaxonomyItemKeys]: UseItemState<
    Filter,
    TaxonomyGroupPartExtras<States, Items, RootNode>[K],
    Items[K],
    States,
    TaxonomyNodeLayers<States>[K]
  >
}

export type UseGroupParts<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  ListItems extends TaxonomyListItem<Items>,
> = (
  taxonomy: Items['taxonomy'],
  parent: Items['groupPart'] | null,
  filter: Filter,
  setItemData: SetItemData<States, TaxonomyNodeLayers<States>['taxonomy'], ListItems['groupPart']>,
) => void

export type TaxonomyGroupPartHooks<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  ListItems extends TaxonomyListItem<Items>,
> = {
  useGroupParts: UseGroupParts<Filter, Items, States, ListItems>
}

export type TaxonomyGroupPartStore<
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends TaxonomyListItem<Items>,
> = {
  useTreeSelector: UseTreeSelector<States, RootNode, TaxonomyItemKeys, ListItems>
  useSetItemState: UseSetItemState<States, TaxonomyItemKeys, TaxonomyItemKeys, RootNode, ListItems>
}
