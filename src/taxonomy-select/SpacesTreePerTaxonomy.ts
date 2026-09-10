import { SpacesTreeHOC } from '../groups-tree'
import type { SpacesItemsDomain, SpacesListItem } from '../groups-tree/space'
import type { UseSpaceItemState } from '../groups-tree/space/types'
import { isVisible, ListState } from '../internal'
import { spacesInitialState } from '../internal.space'
import type { SpacesDataHooks } from '../groups-tree/SpacesTree'
import type { PerTaxonomySelectStates } from './per-taxonomy'
import type { SpacesExternalPerTaxonomy } from './space.per-taxonomy'
import { externExpandSpacesPerTaxonomy, selectableSpacePerTaxonomyReduce } from './space.per-taxonomy'

export const PerTaxonomySelectSpacesTreeHOC = <Filter, Items extends SpacesItemsDomain, Ctx>(
  dataHooks: SpacesDataHooks<Filter, Items, PerTaxonomySelectStates>,
  useItemState: UseSpaceItemState<Filter, Items, PerTaxonomySelectStates>,
) =>
  SpacesTreeHOC<Filter, Items, PerTaxonomySelectStates, SpacesExternalPerTaxonomy, ListState, Ctx>(
    externExpandSpacesPerTaxonomy,
    dataHooks,
    {
      initialState: spacesInitialState<SpacesListItem<Items>, PerTaxonomySelectStates>(),
      reduce: selectableSpacePerTaxonomyReduce,
      isVisible,
    },
    useItemState,
  )
