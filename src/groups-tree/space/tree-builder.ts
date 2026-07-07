import { makeGroupPartTreeFns } from '../group-part'
import { InitialState, type StatesDomain, makeFitToChildren } from '../tree-common'
import type {
  SpaceLists,
  SpacesItemsDomain,
  SpacesListItem,
  SpacesNodes,
  SpacesTreeLevel,
} from './types'

export const makeSpaceTreeFns = <States extends StatesDomain, Items extends SpacesItemsDomain>(
  initialState: InitialState<States, SpacesTreeLevel, SpacesNodes<States>>,
) => {
  const { listsToTaxonomyNode } = makeGroupPartTreeFns<States, Items>(initialState)
  const fitToChildren = makeFitToChildren(initialState)<SpacesListItem<Items>>()

  const listsToSpaceNode = (
    space: Items['space'],
    tree: SpacesNodes<States>['space']['IState'],
    old: SpacesNodes<States>['space']['CState'] | undefined,
    lists: SpaceLists<Items>,
  ): SpacesNodes<States>['space']['IState'] => {
    const taxonomies = fitToChildren(
      'taxonomy',
      key => key,
      tree.child.taxonomies,
      old?.child.taxonomies,
      lists.taxonomy[space._id]?.map(s => [s.item._id, s]),
      (id, item, child, oldChild) => listsToTaxonomyNode(id, item.children, child, oldChild, lists),
      tree.item,
      old?.item,
    )
    return { item: tree.item, child: { taxonomies } }
  }

  const listsToInternalState = (
    tree: SpacesNodes<States>['root']['IState'],
    old: SpacesNodes<States>['root']['CState'] | undefined,
    lists: SpaceLists<Items>,
  ): SpacesNodes<States>['root']['IState'] => {
    const spaces = fitToChildren(
      'space',
      key => key,
      tree.child.spaces,
      old?.child.spaces,
      lists.space['']?.map(e => [e._id, e]),
      (_, item, child, oldChild) => listsToSpaceNode(item, child, oldChild, lists),
      tree.item,
      old?.item,
    )
    return { item: tree.item, child: { spaces } }
  }

  return { listsToInternalState }
}
