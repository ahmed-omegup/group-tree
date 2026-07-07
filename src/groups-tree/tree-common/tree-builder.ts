import { InitialState, ListItemDomain, NodesDomain, type StatesDomain } from './types'

/**
 * Curried factory that captures `initialState` and returns a `fitToChildren`
 * helper usable at any tree level.  Levels and Nodes are fully generic so this
 * utility has no knowledge of specific domain names.
 */
export const makeFitToChildren =
  <States extends StatesDomain, Levels extends string, Nodes extends NodesDomain<States, Levels>>(
    initialState: InitialState<States, Levels, Nodes>,
  ) =>
  <ListItems extends ListItemDomain<Levels>>() =>
  <L extends Levels>(
    level: L,
    getId: (key: string) => string,
    children: Record<string, Nodes[L]['IState']>,
    oldChildren: Record<string, Nodes[L]['CState']> | undefined,
    items: [string, ListItems[L]][] = [],
    handleChild: (
      id: string,
      item: ListItems[L],
      tree: Nodes[L]['IState'],
      old: Nodes[L]['CState'] | undefined,
    ) => Nodes[L]['IState'],
    newParent: States['IState'] | undefined,
    oldParent: States['CState'] | undefined,
  ) => {
    const result: Record<string, Nodes[L]['IState']> = {}
    for (const [key, item] of items) {
      const id = getId(key)
      const node = children[key] ?? initialState[level](id, newParent, oldParent)
      result[key] = handleChild(id, item, node, oldChildren?.[key])
    }
    return result
  }
