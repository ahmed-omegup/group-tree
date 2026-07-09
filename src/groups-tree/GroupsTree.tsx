import {
  makeTaxonomyGroupPartComponents,
  TaxonomyGroupPartArgs,
  TaxonomyItemKeys,
  TaxonomyItemsDomain,
  TaxonomyListItem,
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
  args: TaxonomyGroupPartArgs<Filter, Items, States, RootNode, ListItems>,
) => {
  const storeResult = makeStoreFns(store)

  const makeComponents = makeTaxonomyGroupPartComponents<
    Filter,
    Items,
    States,
    RootNode,
    ListItems
  >(args, storeResult)

  return { makeComponents, ...storeResult }
}
