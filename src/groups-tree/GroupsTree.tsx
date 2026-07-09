import {
  makeTaxonomyGroupPartComponents,
  TaxonomyGroupPartHooks,
  TaxonomyItemKeys,
  TaxonomyItemsDomain,
  TaxonomyListItem,
  UseTaxonomyItemState,
} from './group-part'
import type { ListItemDomain, NodeLayerDomain, StatesDomain, StoreArgs } from './tree-common'
import { makeStoreFns } from './tree-common'

export const GroupsTreeHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  ExtraKeyRoot extends string,
  RootNode extends NodeLayerDomain<States, TaxonomyItemKeys | ExtraKeyRoot>,
  ExtraKeys extends string,
  ListItems extends ListItemDomain<ExtraKeys | TaxonomyItemKeys> & TaxonomyListItem<Items>,
  Context extends null | { brand: 'context' },
>(
  store: StoreArgs<States, ExtraKeys | TaxonomyItemKeys, External, RootNode, ListItems, Context>,
  args: TaxonomyGroupPartHooks<Filter, Items, States, ListItems>,
  useItemState: UseTaxonomyItemState<Filter, Items, States, RootNode>,
  isVisible: (state: States['CState'] | undefined) => boolean,
) => {
  const storeResult = makeStoreFns(store)

  const makeComponents = makeTaxonomyGroupPartComponents<
    Filter,
    Items,
    States,
    RootNode,
    ListItems
  >(args, storeResult, useItemState, isVisible)

  return { makeComponents, storeResult }
}
