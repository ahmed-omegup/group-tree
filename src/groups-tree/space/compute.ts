import type { ExternalData, InternalData, Reduce, StatesDomain } from '../tree-common'
import type {
  SpaceItemKeys,
  SpacesItemsDomain,
  SpacesListItem,
  SpacesNodes,
  SpacesTreeLevel,
} from './types'
import { makeGroupPartComputeFns } from '../group-part'

export const makeSpaceComputeFns = <States extends StatesDomain, Items extends SpacesItemsDomain>(
  reduce: Reduce<
    States,
    SpacesTreeLevel,
    SpaceItemKeys,
    SpacesListItem<Items>,
    SpacesNodes<States>
  >,
) => {
  const { computeTaxonomyState } = makeGroupPartComputeFns(reduce)
  type Nodes = SpacesNodes<States>

  const computeSpaceState = (
    internal: InternalData<States, SpaceItemKeys, Nodes['space'], SpacesListItem<Items>>,
    external: ExternalData<States, Nodes['space'], undefined>,
  ): SpacesNodes<States>['space']['CState'] => {
    const taxonomies: Record<string, SpacesNodes<States>['taxonomy']['CState']> = {}
    for (const [k, child] of Object.entries(internal.state.child.taxonomies)) {
      taxonomies[k] = computeTaxonomyState(
        { ...internal, state: child },
        { ...external, state: external.state?.child.taxonomies[k] },
      )
    }
    return {
      item: reduce.space({
        iState: internal.state.item,
        eState: external.state?.item,
        data: { internal: internal.data, external: external.data },
        lists: internal.lists,
        child: { taxonomies },
      }),
      child: { taxonomies },
    }
  }

  const computeRootState = (
    internal: InternalData<States, SpaceItemKeys, Nodes['root'], SpacesListItem<Items>>,
    external: ExternalData<States, Nodes['root'], undefined>,
  ): Nodes['root']['CState'] => {
    const spaces: Record<string, SpacesNodes<States>['space']['CState']> = {}
    for (const [k, child] of Object.entries(internal.state.child.spaces)) {
      spaces[k] = computeSpaceState(
        { state: child, data: internal.data, lists: internal.lists },
        { state: external.state?.child.spaces[k], data: external.data },
      )
    }
    return {
      item: reduce.root({
        iState: internal.state.item,
        eState: external.state?.item,
        data: { internal: internal.data, external: external.data },
        lists: internal.lists,
        child: { spaces },
      }),
      child: { spaces },
    }
  }

  return { computeRootState }
}
