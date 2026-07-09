import type { SpacesListItem, SpacesNodes, SpacesTreeLevel } from '../groups-tree/space'
import type { SpaceItemKeys, SpacesItemsDomain } from '../groups-tree/space'
import type { Reduce } from '../groups-tree/tree-common'

import { allSelected, selectableGroupPartReduce } from './reduce'
import { someSelected, type SelectableStates as States } from './reduce'
import { spacesReduce } from '../internal.space'

export const selectableSpaceReduce: Reduce<
  States,
  SpacesTreeLevel,
  SpaceItemKeys,
  SpacesListItem<SpacesItemsDomain>,
  SpacesNodes<States>
> = {
  ...selectableGroupPartReduce,
  root: args => ({
    ...spacesReduce.root(args),
    ...allSelected(args.child.spaces, args.eState),
  }),
  space: args => ({
    ...spacesReduce.space(args),
    ...someSelected(args.child.taxonomies, args.eState),
  }),
}
