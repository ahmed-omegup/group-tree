import type { TaxonomyListItem, UseTaxonomyItemState } from '../groups-tree/group-part'
import { TaxonomyItemsDomain } from '../groups-tree/group-part'
import { GPRoot, GroupPartDataHooks, GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState, isVisible } from '../internal'
import { externExpandGroupPartSingle, type GroupPartExternalSingle } from './group-part.single'
import { selectableGroupPartSingleReduce, type SingleSelectStates } from './single'

export const SingleSelectGroupPartTreeHOC = <Filter, Items extends TaxonomyItemsDomain, Ctx>(
  dataHooks: GroupPartDataHooks<Filter, Items, SingleSelectStates>,
  useItemState: UseTaxonomyItemState<Filter, Items, SingleSelectStates, GPRoot<SingleSelectStates>>,
) =>
  GroupPartTreeHOC<Filter, Items, SingleSelectStates, GroupPartExternalSingle, Ctx>(
    externExpandGroupPartSingle,
    {
      initialState: groupPartInitialState<TaxonomyListItem<Items>, SingleSelectStates>(),
      reduce: selectableGroupPartSingleReduce,
    },
    dataHooks,
    useItemState,
    isVisible,
  )
