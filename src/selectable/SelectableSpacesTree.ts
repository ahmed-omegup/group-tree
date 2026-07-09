import { SpacesTreeHOC } from '../groups-tree'
import type { TaxonomyGroupPartHooks } from '../groups-tree/group-part'
import type { CtxDom, SpacesItemsDomain, SpacesListItem, SpacesNodes } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import { isVisible } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { StatesDomain } from '../groups-tree/tree-common'
import type { SelectableStates } from './multi'
import { externExpandSpacesMulti, type SpacesExternalMulti } from './space.multi'
import { selectableSpaceReduce } from './space.reduce'

export type SelectableSpacesDataHooks<
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain = SelectableStates,
> = SpacesDataHooks<Filter, Items, States> &
  TaxonomyGroupPartHooks<Filter, Items, States, SpacesListItem<Items>>

export const SelectableSpacesTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx extends CtxDom<SelectableStates, Items, Ctx>,
>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SelectableStates>,
  useItemState: UseSpaceItemState<Filter, Items, SelectableStates>
) => {
  return SpacesTreeHOC<Filter, Items, SelectableStates, SpacesExternalMulti, Ctx>(
    externExpandSpacesMulti<Items, Ctx>(),
    dataHooks,
    {
      initialState: spacesInitialState<SelectableStates>(),
      reduce: selectableSpaceReduce,
      isVisible,
    },
    useItemState
  )
}
