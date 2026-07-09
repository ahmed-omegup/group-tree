import { SpacesTreeHOC } from '../groups-tree'
import type { CtxDom, SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { isVisible } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { SelectableSpacesDataHooks } from './SelectableSpacesTree'
import { selectableSpaceSingleReduce, type SingleStates } from './single.reduce'
import { externExpandSpacesSingle, type SpacesExternalSingle } from './space.single'

export const SelectableSpacesTreeSingleHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx extends CtxDom<SingleStates, Items, Ctx>,
>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SingleStates>,
  useItemState: UseSpaceItemState<Filter, Items, SingleStates>,
) =>
  SpacesTreeHOC<Filter, Items, SingleStates, SpacesExternalSingle, Ctx>(
    externExpandSpacesSingle(),
    dataHooks,
    {
      initialState: spacesInitialState<SingleStates>(),
      reduce: selectableSpaceSingleReduce,
      isVisible,
    },
    useItemState,
  )
