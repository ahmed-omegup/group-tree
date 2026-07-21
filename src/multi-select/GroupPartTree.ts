import type { TaxonomyGroupPartCtxDom, UseTaxonomyItemState } from '../groups-tree/group-part'
import type { TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { GPRoot, GroupPartDataHooks } from '../groups-tree/GroupPartTree'
import { GroupPartTreeHOC } from '../groups-tree/GroupPartTree'
import { groupPartInitialState, isVisible } from '../internal'
import type { GroupPartExternalMulti } from './group-part.multi'
import { externExpandGroupPartMulti } from './group-part.multi'
import { selectableGroupPartReduce, type MultiSelectStates } from './multi'

export const MultiSelectGroupPartTreeHOC = <Filter, Items extends TaxonomyItemsDomain, Ctx>(
  dataHooks: GroupPartDataHooks<Filter, Items, MultiSelectStates>,
  useItemState: UseTaxonomyItemState<Filter, Items, MultiSelectStates, GPRoot<MultiSelectStates>>,
) =>
  GroupPartTreeHOC<Filter, Items, MultiSelectStates, GroupPartExternalMulti, Ctx>(
    externExpandGroupPartMulti,
    {
      initialState: groupPartInitialState<MultiSelectStates>(),
      reduce: selectableGroupPartReduce,
    },
    dataHooks,
    useItemState,
    isVisible,
  )
