import { SpacesTreeHOC } from '../groups-tree'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import { isVisible, ListState } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { MultiSelectStates } from './multi'
import { externExpandSpacesMulti, type SpacesExternalMulti } from './space.multi'
import { selectableSpaceReduce } from './space.reduce'

export const MultiSelectSpacesTreeHOC = <Filter, Items extends SpacesItemsDomain, Ctx>(
  dataHooks: SpacesDataHooks<Filter, Items, MultiSelectStates>,
  useItemState: UseSpaceItemState<Filter, Items, MultiSelectStates>,
) => {
  return SpacesTreeHOC<Filter, Items, MultiSelectStates, SpacesExternalMulti, ListState, Ctx>(
    externExpandSpacesMulti,
    dataHooks,
    {
      initialState: spacesInitialState<MultiSelectStates>(),
      reduce: selectableSpaceReduce,
      isVisible,
    },
    useItemState,
  )
}
