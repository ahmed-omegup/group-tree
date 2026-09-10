import type { TaxonomyListItem, UseTaxonomyItemState } from '../groups-tree/group-part'
import { TaxonomyItemsDomain } from '../groups-tree/group-part'
import { GPRoot, GroupPartDataHooks, GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState, isVisible } from '../internal'
import {
  externExpandGroupPartPerTaxonomy,
  type GroupPartExternalPerTaxonomy,
} from './group-part.per-taxonomy'
import { selectableGroupPartPerTaxonomyReduce, type PerTaxonomySelectStates } from './per-taxonomy'

export const PerTaxonomySelectGroupPartTreeHOC = <Filter, Items extends TaxonomyItemsDomain, Ctx>(
  dataHooks: GroupPartDataHooks<Filter, Items, PerTaxonomySelectStates>,
  useItemState: UseTaxonomyItemState<
    Filter,
    Items,
    PerTaxonomySelectStates,
    GPRoot<PerTaxonomySelectStates>
  >,
) =>
  GroupPartTreeHOC<Filter, Items, PerTaxonomySelectStates, GroupPartExternalPerTaxonomy, Ctx>(
    externExpandGroupPartPerTaxonomy,
    {
      initialState: groupPartInitialState<TaxonomyListItem<Items>, PerTaxonomySelectStates>(),
      reduce: selectableGroupPartPerTaxonomyReduce,
    },
    dataHooks,
    useItemState,
    isVisible,
  )
