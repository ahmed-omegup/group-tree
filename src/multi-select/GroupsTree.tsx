import React, { useMemo } from 'react'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { GroupsTreeHOC } from '../groups'
import type { GroupsListItem, RenderGroupsList, UseGroupsList } from '../groups'
import { isVisible } from '../internal'
import { spacesInitialState } from '../internal.space'
import { setGroupPartIds, toGroupsMultiRenderItem } from './groups.multi'
import type { GroupsMultiContentProps } from './groups.multi'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import type { MultiSelectStates } from './multi'
import { externExpandSpacesMulti, type SpacesExternalMulti } from './space.multi'
import { selectableSpaceReduce } from './space.reduce'

export type MultiSelectGroupsContentProps<
  Filter,
  Ctx,
  Items extends SpacesItemsDomain,
  Item extends GroupsListItem,
> = GroupsMultiContentProps<MultiSelectStates, Filter, Ctx, Items, Item>

/**
 * Multi Select Spaces tree + flat groups list.
 * Builds Spaces via {@link GroupsTreeHOC}; owns SelectedGroups ↔ tree selectedIds.
 */
export const MultiSelectGroupsTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx,
  Item extends GroupsListItem,
>(
  dataHooks: SpacesDataHooks<Filter, Items, MultiSelectStates>,
  useItemState: UseSpaceItemState<Filter, Items, MultiSelectStates>,
  useGroups: UseGroupsList<Filter, Item>,
  renderList: RenderGroupsList<Item>,
) => {
  const {
    Groups: GroupsBody,
    Spaces,
    TreeProvider,
    useTreeSelector,
  } = GroupsTreeHOC<Filter, Items, MultiSelectStates, SpacesExternalMulti, Ctx, Item>(
    externExpandSpacesMulti,
    dataHooks,
    {
      initialState: spacesInitialState<MultiSelectStates>(),
      reduce: selectableSpaceReduce,
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
    ctx,
    filter,
  }: GroupsMultiContentProps<MultiSelectStates, Filter, Ctx, Items, Item>) => {
    const treeValue = useMemo(
      (): SpacesExternalMulti => ({ brand: 'external', selectedIds: value.groupPartIds }),
      [value.groupPartIds],
    )
    const renderItem = useMemo(
      () => toGroupsMultiRenderItem(value, onChange, renderGroupItem),
      [value, onChange, renderGroupItem],
    )

    return (
      <TreeProvider
        context={null}
        value={treeValue}
        onChange={onChange ? tree => onChange(setGroupPartIds(value, tree.selectedIds)) : undefined}>
        <GroupsBody filter={filter} ctx={ctx} renderItem={renderItem} />
      </TreeProvider>
    )
  }

  return { Groups, Spaces, TreeProvider, useTreeSelector }
}

