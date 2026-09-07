import type { SpacesItemsDomain, SpacesTreeLevel } from './groups-tree/space'
import type { SpacesNodes, SpacesListItem, SpaceItemKeys } from './groups-tree/space'
import {
  InitialState,
  ListItemBrand,
  ListItemDomain,
  Reduce,
  StatesDomain,
} from './groups-tree/tree-common'
import type { InternalStates, ReplaceIState } from './internal'
import {
  groupPartInitialState,
  groupPartReduce,
  internalCommon,
  listState,
  visibility,
} from './internal'

type IState = InternalStates['IState']

const initialState = <
  Items extends ListItemDomain<SpaceItemKeys>,
  States extends StatesDomain,
>(): InitialState<
  ReplaceIState<States, IState>,
  SpacesTreeLevel,
  Items & { root: ListItemBrand<'root'> },
  SpacesNodes<ReplaceIState<States, IState>>
> => ({
  ...groupPartInitialState(),
  space: id => ({
    child: { taxonomies: {} },
    item: {
      ...internalCommon,
      type: 'space',
      id,
    },
  }),
  root: id => ({
    child: { spaces: {} },
    item: {
      ...internalCommon,
      type: 'root',
      id,
    },
  }),
})

const reduce: Reduce<
  InternalStates,
  SpacesTreeLevel,
  SpaceItemKeys,
  SpacesListItem<SpacesItemsDomain>,
  SpacesNodes<InternalStates>
> = {
  ...groupPartReduce,
  root: ({ iState, child: { spaces: children } }) => ({
    brand: 'CState',
    type: 'root',
    collapsed: 'no',
    isHeader: true,
    list: listState(iState, children),
    visibility: 'visible',
  }),
  space: ({ iState, child: { taxonomies: children }, lists }) => {
    return {
      brand: 'CState',
      type: 'space',
      visibility: visibility(iState),
      list: listState(iState, children),
      ...(Object.keys(lists.space).length > 1
        ? {
            isHeader: true,
            collapsed: iState.collapsed ? 'yes' : 'no',
          }
        : { isHeader: false }),
    }
  },
}

export { initialState as spacesInitialState, reduce as spacesReduce }
