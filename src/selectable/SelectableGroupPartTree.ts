import type { TaxonomyGroupPartCtxDom } from '../groups-tree/group-part'
import { TaxonomyItemsDomain } from '../groups-tree/group-part'
import { GroupPartDataHooks, GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState } from '../internal'
import { externExpandGroupPartMulti, GroupPartExternalMulti } from './group-part.multi'
import { selectableGroupPartReduce, SelectableStates } from './reduce'

export const SelectableGroupPartTreeHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  Ctx extends TaxonomyGroupPartCtxDom<SelectableStates, Items, Ctx>,
>(
  dataHooks: GroupPartDataHooks<Filter, Items, SelectableStates>,
) =>
  GroupPartTreeHOC<Filter, Items, SelectableStates, GroupPartExternalMulti, Ctx>(
    externExpandGroupPartMulti(),
    {
      initialState: groupPartInitialState<SelectableStates>(),
      reduce: selectableGroupPartReduce,
    },
    dataHooks,
  )
