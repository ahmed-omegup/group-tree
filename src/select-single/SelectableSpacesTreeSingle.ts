import { SpacesTreeHOC } from '../groups-tree'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { isVisible, ListState } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { SelectableSpacesDataHooks } from '../selectable/SelectableSpacesTree'
import type { SingleStates } from './single'
import type { SpacesExternalSingle } from './space.single'
import { externExpandSpacesSingle, selectableSpaceSingleReduce } from './space.single'

export const SelectableSpacesTreeSingleHOC = <Filter, Items extends SpacesItemsDomain, Ctx>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SingleStates>,
  useItemState: UseSpaceItemState<Filter, Items, SingleStates>,
) =>
  SpacesTreeHOC<Filter, Items, SingleStates, SpacesExternalSingle, ListState, Ctx>(
    externExpandSpacesSingle,
    dataHooks,
    {
      initialState: spacesInitialState<SingleStates>(),
      reduce: selectableSpaceSingleReduce,
      isVisible,
    },
    useItemState,
  )
