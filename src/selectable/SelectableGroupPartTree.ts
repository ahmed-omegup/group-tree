import type { TaxonomyGroupPartCtxDom, UseTaxonomyItemState } from '../groups-tree/group-part'
import type { TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { GPRoot, GroupPartDataHooks } from '../groups-tree/GroupPartTree'
import { GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState, isVisible } from '../internal'
import type { GroupPartExternalMulti } from './group-part.multi'
import { externExpandGroupPartMulti } from './group-part.multi'
import { selectableGroupPartReduce, type SelectableStates } from './multi'

export const SelectableGroupPartTreeHOC = <Filter, Items extends TaxonomyItemsDomain, Ctx>(
  dataHooks: GroupPartDataHooks<Filter, Items, SelectableStates>,
  useItemState: UseTaxonomyItemState<Filter, Items, SelectableStates, GPRoot<SelectableStates>>,
) =>
  GroupPartTreeHOC<Filter, Items, SelectableStates, GroupPartExternalMulti, Ctx>(
    externExpandGroupPartMulti,
    {
      initialState: groupPartInitialState<SelectableStates>(),
      reduce: selectableGroupPartReduce,
    },
    dataHooks,
    useItemState,
    isVisible,
  )
