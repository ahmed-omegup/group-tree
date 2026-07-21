import type { ReactNode } from 'react'
import type { GroupsListItem, RenderGroupItem } from '../groups'
import { SpacesCtxDom, SpacesItemsDomain } from '../groups-tree/space'
import type { ExternalBrand } from '../groups-tree/tree-common'
import { ListState } from '../internal'
import { SingleSelectStates } from './single'

/** One tree part id and/or one unclassified group id. */
export type SelectedGroup =
  | {
      type: 'group'
      groupId: string
    }
  | {
      type: 'groupPart'
      groupPartId: string
    }
  | {
      type: 'none'
    }

export type GroupsExternalSingle = ExternalBrand & SelectedGroup

export const emptySelectedGroup = (): SelectedGroup => ({
  type: 'none',
})

export const hasGroupSelection = (value: SelectedGroup): boolean => value.type !== 'none'

export const fromGroupPartId = (groupPartId: string | null): SelectedGroup =>
  groupPartId === null ? emptySelectedGroup() : { type: 'groupPart', groupPartId }

export const fromGroupId = (groupId: string | null): SelectedGroup =>
  groupId === null ? emptySelectedGroup() : { type: 'group', groupId }

export type GroupsSingleContentProps<Filter, Ctx, Item extends GroupsListItem> = {
  ctx: SpacesCtxDom<SingleSelectStates, SpacesItemsDomain, ListState, Ctx>
  filter: Filter
  value: SelectedGroup
  onChange: (value: SelectedGroup) => void
  renderGroupItem: RenderGroupItem<Item>
}

export const toGroupsSingleRenderItem =
  <Item extends GroupsListItem>(
    value: SelectedGroup,
    onChange: (value: SelectedGroup) => void,
    renderGroupItem: RenderGroupItem<Item>,
  ) =>
  (item: Item): ReactNode =>
    renderGroupItem({
      item,
      selected: value.type === 'group' && value.groupId === item.id,
      onSelect: () =>
        onChange(
          fromGroupId(value.type === 'group' && value.groupId === item.id ? null : item.id),
        ),
    })
