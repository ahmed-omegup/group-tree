import type { TaxonomyGroupPartCtxDom, UseTaxonomyItemState } from '../groups-tree/group-part'
import { TaxonomyItemsDomain } from '../groups-tree/group-part'
import { GPRoot, GroupPartDataHooks, GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState, isVisible } from '../internal'
import { externExpandGroupPartSingle, type GroupPartExternalSingle } from './group-part.single'
import { selectableGroupPartSingleReduce, type SingleStates } from './single'

export const SelectableGroupPartTreeSingleHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  Ctx extends TaxonomyGroupPartCtxDom<SingleStates, Items, Ctx>,
>(
  dataHooks: GroupPartDataHooks<Filter, Items, SingleStates>,
  useItemState: UseTaxonomyItemState<Filter, Items, SingleStates, GPRoot<SingleStates>>,
) =>
  GroupPartTreeHOC<Filter, Items, SingleStates, GroupPartExternalSingle, Ctx>(
    externExpandGroupPartSingle(),
    {
      initialState: groupPartInitialState<SingleStates>(),
      reduce: selectableGroupPartSingleReduce,
    },
    dataHooks,
    useItemState,
    isVisible,
  )
