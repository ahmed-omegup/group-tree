import { SpacesTreeHOC } from '../groups-tree'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { isVisible, ListState } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import type { SingleSelectStates } from './single'
import type { SpacesExternalSingle } from './space.single'
import { externExpandSpacesSingle, selectableSpaceSingleReduce } from './space.single'

export const SingleSelectSpacesTreeHOC = <Filter, Items extends SpacesItemsDomain, Ctx>(
  dataHooks: SpacesDataHooks<Filter, Items, SingleSelectStates>,
  useItemState: UseSpaceItemState<Filter, Items, SingleSelectStates>,
) =>
  SpacesTreeHOC<Filter, Items, SingleSelectStates, SpacesExternalSingle, ListState, Ctx>(
    externExpandSpacesSingle,
    dataHooks,
    {
      initialState: spacesInitialState<SingleSelectStates>(),
      reduce: selectableSpaceSingleReduce,
      isVisible,
    },
    useItemState,
  )
