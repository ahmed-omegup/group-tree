import type {
  ExternalData,
  InternalData,
  ListItemDomain,
  Reduce,
  StatesDomain,
} from '../tree-common'
import type {
  TaxonomyItemsDomain,
  TaxonomyListItem,
  TaxonomyItemKeys,
  TaxonomyNodeLayers,
} from './types'

/**
 * Creates computeGroupPartState and computeTaxonomyState — the mutually-recursive
 * pair that drives the taxonomy ↔ groupPart sub-tree.
 */
export const makeGroupPartComputeFns = <
  States extends StatesDomain,
  Items extends TaxonomyItemsDomain,
  ExtraKeys extends string,
  ListItem extends ListItemDomain<ExtraKeys | TaxonomyItemKeys> & TaxonomyListItem<Items>,
>(
  reduce: Reduce<States, TaxonomyItemKeys, TaxonomyItemKeys | ExtraKeys, ListItem, TaxonomyNodeLayers<States>>,
) => {
  type ItemKeys = ExtraKeys | TaxonomyItemKeys
  type Nodes = TaxonomyNodeLayers<States>
  const computeGroupPartState = (
    internal: InternalData<States, ItemKeys, Nodes['groupPart'], ListItem>,
    external: ExternalData<States, Nodes['groupPart'], undefined>,
  ): TaxonomyNodeLayers<States>['groupPart']['CState'] => {
    const taxonomies: Record<string, TaxonomyNodeLayers<States>['taxonomy']['CState']> = {}
    for (const [k, child] of Object.entries(internal.state.child.taxonomies)) {
      taxonomies[k] = computeTaxonomyState(
        { ...internal, state: child },
        { ...external, state: external.state?.child.taxonomies[k] },
      )
    }
    return {
      item: reduce.groupPart({
        iState: internal.state.item,
        eState: external.state?.item,
        data: { internal: internal.data, external: external.data },
        lists: internal.lists,
        child: { taxonomies },
      }),
      child: { taxonomies },
    }
  }

  const computeTaxonomyState = (
    internal: InternalData<States, ItemKeys, Nodes['taxonomy'], ListItem>,
    external: ExternalData<States, Nodes['taxonomy'], undefined>,
  ): TaxonomyNodeLayers<States>['taxonomy']['CState'] => {
    const groupParts: Record<string, TaxonomyNodeLayers<States>['groupPart']['CState']> = {}
    for (const [k, child] of Object.entries(internal.state.child.groupParts)) {
      groupParts[k] = computeGroupPartState(
        { ...internal, state: child },
        { ...external, state: external.state?.child.groupParts[k] },
      )
    }
    return {
      item: reduce.taxonomy({
        iState: internal.state.item,
        eState: external.state?.item,
        data: { internal: internal.data, external: external.data },
        lists: internal.lists,
        child: { groupParts },
      }),
      child: { groupParts },
    }
  }

  return { computeGroupPartState, computeTaxonomyState }
}
