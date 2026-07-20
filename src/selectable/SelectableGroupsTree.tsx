import React, { useMemo } from 'react'
import type { SpacesItemsDomain } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { GroupsTreeHOC } from '../groups'
import type { GroupsListItem, RenderGroupsList, UseGroupsList } from '../groups'
import { isVisible } from '../internal'
import { spacesInitialState } from '../internal.space'
import { setGroupPartIds, toGroupsMultiRenderItem } from './groups.multi'
import type { GroupsMultiContentProps } from './groups.multi'
import type { SelectableSpacesDataHooks } from './SelectableSpacesTree'
import type { SelectableStates } from './multi'
import { externExpandSpacesMulti, type SpacesExternalMulti } from './space.multi'
import { selectableSpaceReduce } from './space.reduce'

export type SelectableGroupsContentProps<
  Filter,
  Ctx,
  Items extends SpacesItemsDomain,
  Item extends GroupsListItem,
> = GroupsMultiContentProps<SelectableStates, Filter, Ctx, Items, Item>

/**
 * Selectable Spaces tree + flat groups list.
 * Builds Spaces via {@link GroupsTreeHOC}; owns SelectedGroups ↔ tree selectedIds.
 */
export const SelectableGroupsTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  Ctx,
  Item extends GroupsListItem,
>(
  dataHooks: SelectableSpacesDataHooks<Filter, Items, SelectableStates>,
  useItemState: UseSpaceItemState<Filter, Items, SelectableStates>,
  useGroups: UseGroupsList<Filter, Item>,
  renderList: RenderGroupsList<Item>,
) => {
  const {
    Groups: GroupsBody,
    Spaces,
    TreeProvider,
    useTreeSelector,
  } = GroupsTreeHOC<Filter, Items, SelectableStates, SpacesExternalMulti, Ctx, Item>(
    externExpandSpacesMulti,
    dataHooks,
    {
      initialState: spacesInitialState<SelectableStates>(),
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
  }: GroupsMultiContentProps<SelectableStates, Filter, Ctx, Items, Item>) => {
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

