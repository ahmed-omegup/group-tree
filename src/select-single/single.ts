import type { TaxonomyNodeLayers, TaxonomyShapes } from '../groups-tree/group-part'
import type { TreeNode, TreeShape } from '../groups-tree/tree-common'
import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem } from '../groups-tree/group-part'
import type { SpacesListItem, SpacesNodes, SpacesTreeLevel } from '../groups-tree/space'
import type { SpaceItemKeys, SpacesItemsDomain } from '../groups-tree/space'
import type { EStateBrand, Reduce, StatesDomain } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'
import { spacesReduce } from '../internal.space'

export type SingleSelection = { value: 'yes' | 'no' } | { value: 'child'; subId: string }

type EState = EStateBrand & {
  v: SingleSelection
}

type CState = InternalStates['CState'] & {
  selected: SingleSelection
}

type TreeStates = InternalStates & {
  CState: CState
  EState: EState
}

type States = TreeStates & StatesDomain

export type { States as SingleStates }

export const singleSelected = (eState: EState | undefined): Pick<CState, 'selected'> => ({
  selected: eState?.v ?? { value: 'no' },
})

export const selectableGroupPartSingleReduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: args => ({
    ...groupPartReduce.groupPart(args),
    ...singleSelected(args.eState),
  }),
  taxonomy: args => ({
    ...groupPartReduce.taxonomy(args),
    ...singleSelected(args.eState),
  }),
}

export const selectableSpaceSingleReduce: Reduce<
  States,
  SpacesTreeLevel,
  SpaceItemKeys,
  SpacesListItem<SpacesItemsDomain>,
  SpacesNodes<States>
> = {
  ...selectableGroupPartSingleReduce,
  root: args => ({
    ...spacesReduce.root(args),
    ...singleSelected(args.eState),
  }),
  space: args => ({
    ...spacesReduce.space(args),
    ...singleSelected(args.eState),
  }),
}

type IState = States['IState']

export const toSelection = (selectedId: string | null, nodeId: string): SingleSelection => {
  if (!selectedId?.startsWith(nodeId)) return { value: 'no' }
  if (selectedId === nodeId) return { value: 'yes' }
  return { value: 'child', subId: selectedId.slice(nodeId.length + 1).split('_')[0]! }
}

type ExpandSingle<Shape extends TreeShape<Shape>> = (
  selectedId: string | null,
  tree: TreeNode<IState, Shape>,
) => TreeNode<EState, Shape>

const singleItem = <L extends string>(level: L, selectedId: string | null, nodeId: string) => ({
  brand: 'EState' as const,
  type: level,
  v: toSelection(selectedId, nodeId.split('_').at(-1)!),
})

export const mapChildren = <Shape extends TreeShape<Shape>>(
  children: Record<string, TreeNode<IState, Shape>>,
  expand: ExpandSingle<Shape>,
  selectedId: string | null,
) =>
  Object.fromEntries(
    Object.entries(children).map(([id, node]) => [id, expand(selectedId, node)]),
  ) as Record<string, TreeNode<EState, Shape>>

export const makeSingleExpand =
  <L extends string, Shape extends TreeShape<Shape>>(
    level: L,
    processChildren: (
      selectedId: string | null,
      child: TreeNode<IState, Shape>['child'],
    ) => TreeNode<EState, Shape>['child'],
  ): ExpandSingle<Shape> =>
  (selectedId, tree) => {
    const item = singleItem(level, selectedId, tree.item.id)
    const subId =
      selectedId && item.v.value === 'child' ? selectedId.split('_').slice(1).join('_') : null
    return { item, child: processChildren(subId, tree.child) }
  }

export const expandGroupPart: ExpandSingle<TaxonomyShapes['groupPart']> = makeSingleExpand(
  'groupPart',
  (selectedId, { taxonomies }) => ({
    taxonomies: mapChildren(taxonomies, expandTaxonomy, selectedId),
  }),
)

export const expandTaxonomy: ExpandSingle<TaxonomyShapes['taxonomy']> = makeSingleExpand(
  'taxonomy',
  (selectedId, { groupParts }) => ({
    groupParts: mapChildren(groupParts, expandGroupPart, selectedId),
  }),
)

export const findSelectedIn = <T>(
  node: { item: CState; child: T } | undefined,
  id: string,
  walkChild: (child: T, id: string) => string | null,
): string | null => {
  if (!node) return null
  const { selected } = node.item
  if (selected.value === 'yes') return id
  if (selected.value === 'child') {
    return walkChild(node.child, [id, selected.subId].filter(Boolean).join('_'))
  }
  return null
}
const idToTaxonomyId = (id: string) => {
  const parts = id.split('_').filter((_, i) => i & 1)
  return parts.join('_')
}

export const findSelectedInGroupPart = (
  id: string,
  groupPart?: TaxonomyNodeLayers<States>['groupPart']['CState'],
) =>
  findSelectedIn(groupPart, id, (child, childId) =>
    findSelectedInTaxonomy(childId, child.taxonomies[idToTaxonomyId(childId)]),
  )
export const findSelectedInTaxonomy = (
  id: string,
  groupPart?: TaxonomyNodeLayers<States>['taxonomy']['CState'],
): string | null =>
  findSelectedIn(groupPart, id, (child, childId) =>
    findSelectedInGroupPart(childId, child.groupParts[childId]),
  )
