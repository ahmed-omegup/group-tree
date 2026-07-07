import { InitialState, type StatesDomain, makeFitToChildren } from '../tree-common'
import type {
  TaxonomyItemKeys,
  TaxonomyItemsDomain,
  TaxonomyListItem,
  TaxonomyNodeLayers,
} from './types'

/**
 * Derives the store key that identifies a groupPart node within the list cache.
 */
export const subGroupPartId = (groupPartId: string | null, taxonomyId: string): string =>
  groupPartId ? `${groupPartId}_${taxonomyId.split('_').at(-1)}` : taxonomyId

/**
 * Creates listsToTaxonomyNode and listsToGroupPartNode — the mutually-recursive
 * pair that rebuilds the taxonomy ↔ groupPart raw internal sub-tree.
 *
 * Intentionally unaware of space: receives only the groupPart slice of the
 * lists map and a TaxonomyTreeLevel-scoped initialState callback.
 */
export const makeGroupPartTreeFns = <
  States extends StatesDomain,
  Items extends TaxonomyItemsDomain,
>(
  initialState: InitialState<States, TaxonomyItemKeys, TaxonomyNodeLayers<States>>,
) => {
  const fitToChildren = makeFitToChildren(initialState)<TaxonomyListItem<Items>>()

  const listsToGroupPartNode = (
    groupPartId: string | null,
    taxonomyChildren: TaxonomyListItem<Items>['taxonomy'][],
    tree: TaxonomyNodeLayers<States>['groupPart']['IState'],
    old: TaxonomyNodeLayers<States>['groupPart']['CState'] | undefined,
    lists: { groupPart: Record<string, TaxonomyListItem<Items>['groupPart'][]> },
  ): TaxonomyNodeLayers<States>['groupPart']['IState'] => {
    const taxonomies = fitToChildren(
      'taxonomy',
      key => subGroupPartId(groupPartId, key),
      tree.child.taxonomies,
      old?.child.taxonomies,
      taxonomyChildren.map(c => [c.item._id, c]),
      (id, item, child, oldChild) => listsToTaxonomyNode(id, item.children, child, oldChild, lists),
      tree.item,
      old?.item,
    )
    return { item: tree.item, child: { taxonomies } }
  }

  const listsToTaxonomyNode = (
    id: string,
    taxonomyChildren: TaxonomyListItem<Items>['taxonomy'][],
    tree: TaxonomyNodeLayers<States>['taxonomy']['IState'],
    old: TaxonomyNodeLayers<States>['taxonomy']['CState'] | undefined,
    lists: { groupPart: Record<string, TaxonomyListItem<Items>['groupPart'][]> },
  ): TaxonomyNodeLayers<States>['taxonomy']['IState'] => {
    const groupParts = fitToChildren(
      'groupPart',
      key => key,
      tree.child.groupParts,
      old?.child.groupParts,
      lists.groupPart[id]?.map(c => [c._id, c]),
      (_, item, child, oldChild) =>
        listsToGroupPartNode(item._id, taxonomyChildren, child, oldChild, lists),
      tree.item,
      old?.item,
    )
    return { item: tree.item, child: { groupParts } }
  }

  return { listsToTaxonomyNode, listsToGroupPartNode }
}
