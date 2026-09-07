export type { Lens } from '../path'

// ---- Generic tree data structure -----------------------------------------

/** A recursive item tree as produced by list hooks and back-end responses. */
export type Tree<T, Brand> = { item: T; children: Tree<T, Brand>[] } & Brand

// ---- Tree shape constraints -----------------------------------------------
// A TreeShape describes the recursive nesting structure (which node types nest
// inside which).  It is only used as a constraint, never instantiated.

export type TreeShape<Shape extends TreeShape<Shape>> = {
  type: string
  child: { [K in keyof Shape['child']]: TreeShape<Shape['child'][K]> }
}

export type TreeShapes<Levels extends string, Shapes extends TreeShapes<Levels, Shapes>> = {
  [L in Levels]: TreeShape<Shapes[L]>
}

// ---- Tree node -----------------------------------------------------------

export type TreeNodeDomain<T, L extends string> = { item: T & { type: L }; child: unknown }
/** A single node in the typed tree at a given shape level. */
export type TreeNode<T, Shape extends TreeShape<Shape>> = {
  child: { [K in keyof Shape['child']]: Record<string, TreeNode<T, Shape['child'][K]>> }
} & TreeNodeDomain<T, Shape['type']>
export type TreeNodes<T, Levels extends string, Shapes extends TreeShapes<Levels, Shapes>> = {
  [L in Levels]: TreeNode<T, Shapes[L]>
}

// ---- State layer phantom brands ------------------------------------------
// Optional brand properties that keep the three state kinds from being mixed up.

export type IStateBrand = { brand: 'IState' }
export type EStateBrand = { brand: 'EState' }
export type CStateBrand = { brand: 'CState' }
export type IDataBrand = { brand: 'IData' }
export type EDataBrand = { brand: 'EData' }
export type ListItemBrand<Key> = { listItem: Key }
export type ExternalBrand = { brand: 'external' }
export type ListItemDomain<Keys extends string> = {
  [Key in Keys]: ListItemBrand<Key>
}

export type StateKeys = 'IState' | 'EState' | 'CState'

type TreeStatesDomain = {
  IState: IStateBrand
  EState: EStateBrand
  CState: CStateBrand
}
export type StatesDomain = TreeStatesDomain & {
  brand: 'state'
  IData: IDataBrand
  EData: EDataBrand
}

export type NodeLayerDomain<States extends TreeStatesDomain, L extends string = string> = {
  [K in keyof TreeStatesDomain]: TreeNodeDomain<States[K], L>
}

export type NodesDomain<States extends TreeStatesDomain, Levels extends string> = {
  [L in Levels]: NodeLayerDomain<States, L>
}

// ---- State update types --------------------------------------------------

export type UpdateState<States extends StatesDomain, NodeLayer extends NodeLayerDomain<States>> = {
  state: {
    internal: NodeLayer['IState']
    external: NodeLayer['EState']
    computed: NodeLayer['CState']
  }
  data: {
    internal: States['IData']
    external: States['EData']
  }
}

export type InternalUpdater<
  States extends StatesDomain,
  NodeLayer extends NodeLayerDomain<States>,
> = (args: UpdateState<States, NodeLayer>) => [NodeLayer['IState'], States['IData']]

export type ExternalUpdater<
  States extends StatesDomain,
  NodeLayer extends NodeLayerDomain<States>,
> = (args: UpdateState<States, NodeLayer>) => [NodeLayer['EState'], States['EData']]

export type Update<States extends StatesDomain, NodeLayer extends NodeLayerDomain<States>> = {
  internal: (updater: InternalUpdater<States, NodeLayer>) => void
  external: (updater: ExternalUpdater<States, NodeLayer>) => void
}

export type SetItemData<
  States extends StatesDomain,
  NodeLayer extends NodeLayerDomain<States>,
  T extends ListItemBrand<string>,
> = (updater: InternalUpdater<States, NodeLayer>, list: T[]) => void

export type UseItemState<
  Filter,
  Extra,
  Item,
  States extends StatesDomain,
  NodeLayers extends NodeLayerDomain<States>,
> = (args: { filter: Filter; item: Item; extra: Extra; update: Update<States, NodeLayers> }) => void

// ---- Reduce function type ------------------------------------------------

export type ReduceArgs<
  States extends StatesDomain,
  ItemKeys extends string,
  ListItems extends ListItemDomain<ItemKeys>,
  L extends string,
  Nodes extends NodesDomain<States, L>,
> = {
  iState: States['IState'] & { type: L }
  eState: (States['EState'] & { type: L }) | undefined
  lists: Lists<ItemKeys, ListItems>
  data: Data<States>
  child: Nodes[L]['CState']['child']
}

export type Reduce<
  States extends StatesDomain,
  Levels extends string,
  ItemKeys extends string,
  in ListItems extends ListItemDomain<ItemKeys>,
  Nodes extends NodesDomain<States, Levels>,
> = {
  [L in Levels]: (
    args: ReduceArgs<States, ItemKeys, ListItems, L, Nodes>,
  ) => Nodes[L]['CState']['item'] & { type: L }
}

export type Data<States extends StatesDomain> = {
  internal: States['IData']
  external: States['EData']
}

export type Lists<ItemKeys extends string, ListItems extends ListItemDomain<ItemKeys>> = {
  [ItemKey in ItemKeys]: Record<string, ListItems[ItemKey][]>
}

export type Expand<
  States extends StatesDomain,
  External extends ExternalBrand,
  RootNode extends NodeLayerDomain<States>,
  out ItemKeys extends string,
  in ListItems extends ListItemDomain<ItemKeys>,
> = (
  external: External,
  data: InternalData<States, ItemKeys, RootNode, ListItems>,
) => [RootNode['EState'], States['EData']]

export type Extern<
  States extends StatesDomain,
  External extends ExternalBrand,
  RootNode extends NodeLayerDomain<States>,
> = (computed: RootNode['CState'], oldExternalData: States['EData']) => External

export type ExternExpand<
  States extends StatesDomain,
  External extends ExternalBrand,
  RootNode extends NodeLayerDomain<States>,
  ItemKeys extends string,
  ListItems extends ListItemDomain<ItemKeys>,
> = {
  expand: Expand<States, External, RootNode, ItemKeys, ListItems>
  /**
   * extern is used to transform the computed state into the external state that will be returned in the onChange callback.
   * It should garantee this invariant:
   * ```
   * forall i, e. equals(
   *  compute(i, e),
   *  compute(i,
   *    expand(extern(compute(i, e), e.data), i)
   *  ),
   * )
   * ```
   */
  extern: Extern<States, External, RootNode>
}

export type InternalData<
  States extends StatesDomain,
  ItemKeys extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
> = {
  state: RootNode['IState']
  data: States['IData']
  lists: Lists<ItemKeys, ListItems>
}
export type ExternalData<
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
  U = never,
> = {
  state: RootNode['EState'] | U
  data: States['EData']
}

export type StoreArgs<
  States extends StatesDomain,
  ItemKeys extends string,
  External extends ExternalBrand,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
  Context extends null | { brand: 'context' },
> = ExternExpand<States, External, RootNode, ItemKeys, ListItems> & {
  compute: (
    internal: InternalData<States, ItemKeys, RootNode, ListItems>,
    external: ExternalData<States, RootNode>,
  ) => RootNode['CState']
  listsToInternalState: (
    tree: RootNode['IState'],
    old: RootNode['CState'] | undefined,
    lists: Lists<ItemKeys, ListItems>,
    context: Context,
  ) => RootNode['IState']
  initialRootState: (context: Context) => RootNode['IState']
  initialLists: Lists<ItemKeys, ListItems>
  initialData: States['IData']
}

export type InitialState<
  in States extends TreeStatesDomain,
  Levels extends string,
  in Items extends ListItemDomain<Levels>,
  out Nodes extends NodesDomain<States, Levels>,
> = {
  [L in Levels]: (
    id: string,
    item?: Items[L],
    newParent?: States['IState'],
    oldParent?: States['CState'],
  ) => Nodes[L]['IState']
}
/** Discriminated union: one tuple per list key in Lists. */
export type SomeListOf<Keys extends string, ListItems extends ListItemDomain<Keys>> = {
  [K in Keys]: [key: K, path: string, items: ListItems[K][]]
}[Keys]
