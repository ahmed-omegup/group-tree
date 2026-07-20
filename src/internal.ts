import type { TaxonomyItemKeys, TaxonomyItemsDomain } from './groups-tree/group-part'
import type { TaxonomyListItem, TaxonomyNodeLayers } from './groups-tree/group-part'
import { getTaxonomyChildren } from './groups-tree/group-part/components'
import type { CStateBrand, InitialState } from './groups-tree/tree-common'
import type { IStateBrand, Reduce, StatesDomain } from './groups-tree/tree-common'

type IState = IStateBrand & {
  visible: boolean | null
  childrenReady: boolean
  collapsed: boolean
  id: string
}

export type ListState = 'loading' | 'none-matching' | 'populated' | 'is-leaf'

type CState = CStateBrand & {
  visibility: 'visible' | 'hidden' | 'notReady'
  list: ListState
} & (
    | {
        isHeader: true
        collapsed: 'yes' | 'no' | 'n.a'
      }
    | {
        isHeader: false
      }
  )

const common = {
  brand: 'IState',
  collapsed: true,
  visible: null,
  childrenReady: false,
} as const

type States = StatesDomain & { IState: IState; CState: CState }
export type ReplaceIState<States extends StatesDomain, IState extends IStateBrand> = {
  IState: IState
} & Pick<States, OtherStates>

type OtherStates = Exclude<keyof StatesDomain, 'IState'>
const initialState = <States extends StatesDomain>(): InitialState<
  ReplaceIState<States, IState>,
  TaxonomyItemKeys,
  TaxonomyNodeLayers<ReplaceIState<States, IState>>
> => ({
  groupPart: id => ({
    child: { taxonomies: {} },
    item: {
      ...common,
      childrenReady: true,
      type: 'groupPart',
      id,
    },
  }),
  taxonomy: id => ({
    child: { groupParts: {} },
    item: {
      ...common,
      collapsed: false,
      type: 'taxonomy',
      id,
    },
  }),
})

export const listState = (
  iState: States['IState'],
  children: Record<string, { item: States['CState'] }>,
) =>
  !iState.childrenReady ||
  Object.values(children).some(
    ({ item: c }) => c.visibility === 'notReady' || (!c.isHeader && c.list === 'loading'),
  )
    ? 'loading'
    : Object.values(children).some(({ item: c }) => c.visibility === 'visible')
      ? 'populated'
      : 'none-matching'

export const visibility = (iState: IState) =>
  iState.visible === false ? 'hidden' : iState.visible === true ? 'visible' : 'notReady'

const reduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: ({ iState, child: { taxonomies: children } }) => {
    const isLeaf = iState.childrenReady && Object.values(children).length === 0
    const node: States['CState'] & { type: 'groupPart' } = {
      type: 'groupPart',
      brand: 'CState',
      visibility: visibility(iState),
      isHeader: true,
      list: isLeaf ? 'is-leaf' : listState(iState, children),
      collapsed: isLeaf ? 'n.a' : iState.collapsed ? 'yes' : 'no',
    }
    return node
  },
  taxonomy: ({ iState, child: { groupParts: children }, lists }) => {
    const idParts = iState.id.split('_')
    const siblings = getTaxonomyChildren(idParts.slice(0, -1), lists.taxonomy)
    const isHeader = siblings.length > 1
    return {
      brand: 'CState',
      type: 'taxonomy',
      visibility: visibility(iState),
      list: listState(iState, children),
      ...(isHeader ? { isHeader, collapsed: iState.collapsed ? 'yes' : 'no' } : { isHeader }),
    }
  },
}

export {
  reduce as groupPartReduce,
  common as internalCommon,
  initialState as groupPartInitialState,
}

export const isVisible = (state: CState | undefined) => state?.visibility === 'visible'

export type { States as InternalStates }
