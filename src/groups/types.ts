import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { StatesDomain } from '../groups-tree/tree-common'
import type { InternalStates, ListState } from '../internal'
import type { SpacesCtxDom, SpacesItemsDomain } from '../groups-tree/space'

/** Minimal list row identity; integrators may extend with label, etc. */
export type GroupsListItem = {
  id: string
}

export type GroupsListData<Item extends GroupsListItem> = {
  items: Item[]
  ready: boolean
}

/** Same filter as Spaces tree, plus limit for pagination. */
export type UseGroupsList<Filter, Item extends GroupsListItem> = (
  filter: Filter,
  limit: number,
) => GroupsListData<Item>

export type RenderGroupsList<Item extends GroupsListItem> = (
  data: GroupsListData<Item>,
  limit: number,
  renderItem: (item: Item) => ReactNode,
  setLimit: Dispatch<SetStateAction<number>>,
) => ReactNode

export type RenderGroupItem<Item extends GroupsListItem> = (args: {
  item: Item
  selected: boolean
  onSelect: () => void
}) => ReactNode

/** States whose CState carries the shared tree list machine. */
export type GroupsStates = StatesDomain & {
  CState: InternalStates['CState']
}

export type GroupsTreeProps<
  States extends StatesDomain,
  Items extends SpacesItemsDomain,
  Item extends GroupsListItem,
  Filter,
  Ctx,
> = {
  ctx: SpacesCtxDom<States, Items, ListState, Ctx>
  filter: Filter
  renderItem: (item: Item) => ReactNode
}
