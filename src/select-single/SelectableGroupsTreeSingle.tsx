import { useMemo } from 'react'
import type { GroupsListItem, RenderGroupsList, UseGroupsList } from '../groups'
import { GroupsTreeHOC } from '../groups'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { isVisible } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { SelectableSpacesDataHooks } from '../selectable/SelectableSpacesTree'
import { GroupsSingleContentProps, fromGroupPartId, toGroupsSingleRenderItem } from './groups.single'
import type { SingleStates } from './single'
import { externExpandSpacesSingle, selectableSpaceSingleReduce } from './space.single'
import type { SpacesExternalSingle } from './space.single'

/**
 * Single-select Spaces tree + flat groups list.
 * Builds Spaces via {@link GroupsTreeHOC}; owns SelectedGroup ↔ tree selectedId.
 */
export const SelectableGroupsTreeSingleHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx,
  Item extends GroupsListItem,
>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SingleStates>,
  useItemState: UseSpaceItemState<Filter, Items, SingleStates>,
  useGroups: UseGroupsList<Filter, Item>,
  renderList: RenderGroupsList<Item>,
) => {
  const {
    Groups: GroupsBody,
    Spaces,
    TreeProvider,
    useTreeSelector,
  } = GroupsTreeHOC<Filter, Items, SingleStates, SpacesExternalSingle, Ctx, Item>(
    externExpandSpacesSingle,
    dataHooks,
    {
      initialState: spacesInitialState<SingleStates>(),
      reduce: selectableSpaceSingleReduce,
      isVisible,
    },
    useItemState,
    useGroups,
    renderList,
  )

  const Groups = ({
    value,
    onChange,
    renderGroupItem,
    ...body
  }: GroupsSingleContentProps<Filter, Ctx, Item>) => {
    const selectedId = value.type === 'groupPart' ? value.groupPartId : null
    const treeValue = useMemo(() => ({ brand: 'external', selectedId }) as const, [selectedId])
    return (
      <TreeProvider
        context={null}
        value={treeValue}
        onChange={onChange ? tree => onChange(fromGroupPartId(tree.selectedId)) : undefined}>
        <GroupsBody
          {...body}
          renderItem={toGroupsSingleRenderItem(value, onChange, renderGroupItem)}
        />
      </TreeProvider>
    )
  }

  return { Groups, Spaces, TreeProvider, useTreeSelector }
}

