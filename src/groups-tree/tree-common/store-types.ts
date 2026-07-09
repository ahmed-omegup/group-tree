import type { ReactNode } from 'react'
import type { Lens } from '../path'
import type { Data, ExternalBrand, InternalUpdater, StateKeys, StatesDomain, Update } from './types'
import type { ListItemDomain, Lists, NodeLayerDomain, SomeListOf } from './types'

export type StoreState<
  States extends StatesDomain,
  ItemKeys extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
> = {
  states: {
    internal: RootNode['IState']
    external: RootNode['EState']
    computed: RootNode['CState']
  }
  lists: Lists<ItemKeys, ListItems>
  data: Data<States>
}

export type UseTreeSelector<
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
  ItemKeys extends string,
  ListItems extends ListItemDomain<ItemKeys>,
> = <T>(selector: (state: StoreState<States, ItemKeys, RootNode, ListItems>) => T) => T

export type UseSetItemState<
  States extends StatesDomain,
  ItemKeys extends string,
  Levels extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
> = <L extends Levels, NodeL extends NodeLayerDomain<States, L>>(
  level: L,
  path: Lens<StateKeys, RootNode, NodeL>,
  item: unknown,
) => {
  update: Update<States, NodeL>
  updateWithList: (
    updater: InternalUpdater<States, NodeL>,
    list: SomeListOf<ItemKeys, ListItems>,
  ) => void
}

export type TreeProviderArgs<External, Context> = {
  children: ReactNode
  value: External
  onChange?: (value: External) => void
  context: Context
}

type Action<
  States extends StatesDomain,
  ItemKeys extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
  ChildNode extends Record<StateKeys, unknown>,
> = {
  path: Lens<StateKeys, RootNode, ChildNode>
  node: ChildNode['IState']
  data: States['IData']
  list?: SomeListOf<ItemKeys, ListItems>
}

export type StateContext<
  States extends StatesDomain,
  ItemKeys extends string,
  External extends ExternalBrand,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
  Context extends null | { brand: 'context' },
> = {
  state: StoreState<States, ItemKeys, RootNode, ListItems>
  dispatch: <ChildNode extends Record<StateKeys, unknown>>(
    action: (
      state: StoreState<States, ItemKeys, RootNode, ListItems>,
    ) => Action<States, ItemKeys, RootNode, ListItems, ChildNode> | undefined,
  ) => void
  changeRef: { current: ((value: External) => void) | undefined }
  context: Context
}


export type StoreCommonResult<
  States extends StatesDomain,
  ItemKeys extends string,
  Levels extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
> = {
  useTreeSelector: UseTreeSelector<States, RootNode, ItemKeys, ListItems>
  useSetItemState: UseSetItemState<States, ItemKeys, Levels, RootNode, ListItems>
}


export type StoreResult<
  States extends StatesDomain,
  ItemKeys extends string,
  External extends ExternalBrand,
  Levels extends string,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends ListItemDomain<ItemKeys>,
  Context extends null | { brand: 'context' },
> = StoreCommonResult<States, ItemKeys, Levels, RootNode, ListItems> & {
  TreeProvider: (args: TreeProviderArgs<External, Context>) => ReactNode
  useTreeContext: () => StateContext<States, ItemKeys, External, RootNode, ListItems, Context>
}
