import { useMemo } from 'react'

import { useDefaultState } from 'school-utils'
import { SpacesTreeHOC, type SpacesDataHooks } from '../groups-tree/SpacesTree'
import type { SpacesNodes, CtxDom, SpaceItemKeys, SpacesItemsDomain } from '../groups-tree/space'
import type { SpacesListItem, SpacesTreeLevel, UseSpaceItemState } from '../groups-tree/space'
import type { ExternExpand, InitialState, Reduce } from '../groups-tree/tree-common'
import type { ListState } from '../internal'
import type { GroupsListItem, GroupsStates } from './types'
import type { GroupsTreeProps, RenderGroupsList, UseGroupsList } from './types'

const DEFAULT_LIMIT = 20

/**
 * Spaces tree + paginated flat groups list.
 * Creates {@link SpacesTreeHOC} internally (same pattern as SpacesTree → GroupPartTree).
 *
 * Selection stays in selectable / select-single — this HOC only composes tree + list.
 * Empty only when both subsets are empty. `Groups` must sit inside `TreeProvider`.
 */
export const GroupsTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  States extends GroupsStates,
  External extends { brand: 'external' },
  Ctx,
  Item extends GroupsListItem,
>(
  expandExtern: ExternExpand<States, External, SpacesNodes<States>['root'], never, {}>,
  dataHooks: SpacesDataHooks<Filter, Items, States>,
  storeArgs: {
    initialState: InitialState<States, SpacesTreeLevel, SpacesNodes<States>>
    reduce: Reduce<
      States,
      SpacesTreeLevel,
      SpaceItemKeys,
      SpacesListItem<Items>,
      SpacesNodes<States>
    >
    isVisible: (state: States['CState'] | undefined) => boolean
  },
  useItemState: UseSpaceItemState<Filter, Items, States>,
  useGroups: UseGroupsList<Filter, Item>,
  renderList: RenderGroupsList<Item>,
) => {
  const { Spaces, TreeProvider, useTreeSelector } = SpacesTreeHOC<
    Filter,
    Items,
    States,
    External,
    ListState,
    Ctx
  >(expandExtern, dataHooks, storeArgs, useItemState)

  const Groups = (props: GroupsTreeProps<States, Items, Item, Filter, Ctx>) => {
    const { ctx, filter, renderItem } = props
    const spacesList = useTreeSelector(s => s.states.computed.item.list)
    const spaceCtx = useMemo(
      (): CtxDom<States, Items, ListState, Ctx> => ({
        ...ctx,
        renderContainer: ({ children }) => children,
        getListState: s => s.list,
      }),
      [ctx],
    )
    // Object filters are new each render from callers — key by value, not identity.
    const [limit, setLimit] = useDefaultState(DEFAULT_LIMIT, JSON.stringify(filter))

    const data = useGroups(filter, limit)

    return ctx.renderContainer({
      ctx,
      state:
        !data.ready || spacesList === 'loading'
          ? 'loading'
          : data.items.length || spacesList === 'populated'
            ? 'populated'
            : 'none-matching',
      children: (
        <>
          <Spaces ctx={spaceCtx} filter={filter} />
          {renderList(data, limit, renderItem, setLimit)}
        </>
      ),
    })
  }

  return { Groups, Spaces, TreeProvider, useTreeSelector }
}
