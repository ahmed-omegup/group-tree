import { idToTaxonomyId, type TaxonomyNodeLayers, type TaxonomyShapes } from '../groups-tree/group-part'
import type { TreeNode, TreeShape } from '../groups-tree/tree-common'
import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem } from '../groups-tree/group-part'
import type { EStateBrand, Reduce, StatesDomain } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'

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

export type { States as SingleSelectStates }

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


type IState = States['IState']

/** Match a path remainder against this node's last id segment (same segment scheme as multi). */
export const toSelection = (selectedId: string | null, segment: string): SingleSelection => {
  const prefix = segment && `${segment}_`
  if (!selectedId?.startsWith(segment)) return { value: 'no' }
  if (selectedId === segment) return { value: 'yes' }
  return { value: 'child', subId: selectedId.slice(prefix.length) }
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
    const childSelectedId = item.v.value === 'child' ? item.v.subId : null
    return { item, child: processChildren(childSelectedId, tree.child) }
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
