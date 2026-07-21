import type { ReactNode } from 'react'
import type { ExternalBrand } from '../groups-tree/tree-common'
import type { GroupsListItem, GroupsTreeProps, RenderGroupItem } from '../groups'
import { ListState } from '../internal'
import { SpacesCtxDom, SpacesItemsDomain } from '../groups-tree/space'
import { GroupsStates } from '../groups/types'

/** Hierarchical tree parts + unclassified flat group ids. */
export type SelectedGroups = {
  groupPartIds: string[]
  groupIds: string[]
}

export type GroupsExternalMulti = ExternalBrand & SelectedGroups

export const emptySelectedGroups = (): SelectedGroups => ({
  groupPartIds: [],
  groupIds: [],
})

export const hasGroupsSelection = (value: SelectedGroups): boolean =>
  value.groupPartIds.length > 0 || value.groupIds.length > 0

export const setGroupPartIds = (value: SelectedGroups, groupPartIds: string[]): SelectedGroups => ({
  ...value,
  groupPartIds,
})

export const toggleGroupId = (value: SelectedGroups, groupId: string): SelectedGroups => {
  const isSelected = value.groupIds.includes(groupId)
  return {
    ...value,
    groupIds: isSelected
      ? value.groupIds.filter(id => id !== groupId)
      : [...value.groupIds, groupId],
  }
}

export type GroupsMultiContentProps<
  States extends GroupsStates,
  Filter,
  Ctx,
  Items extends SpacesItemsDomain,
  Item extends GroupsListItem,
> = {
  ctx: SpacesCtxDom<States, Items, ListState, Ctx>
  filter: Filter
  value: SelectedGroups
  onChange?: (value: SelectedGroups) => void
  renderGroupItem: RenderGroupItem<Item>
}

export const toGroupsMultiRenderItem =
  <Item extends GroupsListItem>(
    value: SelectedGroups,
    onChange: ((value: SelectedGroups) => void) | undefined,
    renderGroupItem: RenderGroupItem<Item>,
  ) =>
  (item: Item): ReactNode =>
    renderGroupItem({
      item,
      selected: value.groupIds.includes(item.id),
      onSelect: () => onChange?.(toggleGroupId(value, item.id)),
    })
