import { SpacesTreeHOC } from '../groups-tree'
import type { TaxonomyGroupPartArgs } from '../groups-tree/group-part'
import type { CtxDom, SpacesItemsDomain, SpacesListItem, SpacesNodes } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import { spacesInitialState } from '../internal.space'
import type { SelectableStates } from './reduce'
import { externExpandSpacesMulti, type SpacesExternalMulti } from './space.multi'
import { selectableSpaceReduce } from './space.reduce'

export type SelectableSpacesDataHooks<
  Filter,
  Items extends SpacesItemsDomain,
  States extends SelectableStates = SelectableStates,
> = SpacesDataHooks<Filter, Items, States> &
  Pick<
    TaxonomyGroupPartArgs<
      Filter,
      Items,
      States,
      SpacesNodes<States>['root'],
      SpacesListItem<Items>
    >,
    'useGroupParts'
  > & {
    useItemState: UseSpaceItemState<Filter, Items, States>
  }

const isVisible = (state: SelectableStates['CState'] | undefined) => state?.visibility === 'visible'

export const SelectableSpacesTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx extends CtxDom<SelectableStates, Items, Ctx>,
>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SelectableStates>,
) => {
  return SpacesTreeHOC<Filter, Items, SelectableStates, SpacesExternalMulti, Ctx>(
    externExpandSpacesMulti<Items, Ctx>(),
    dataHooks,
    {
      initialState: spacesInitialState<SelectableStates>(),
      reduce: selectableSpaceReduce,
      isVisible,
    },
  )
}
