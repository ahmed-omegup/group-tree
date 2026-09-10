import type {
  TaxonomyNodeLayers,
  TaxonomyShapes,
} from '../groups-tree/group-part'
import type { TreeNode, TreeShape } from '../groups-tree/tree-common'
import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem } from '../groups-tree/group-part'
import type { EStateBrand, Reduce, StatesDomain } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'

/** One selected groupPart per taxonomy; a selected groupPart may hold many taxonomies. */
export type TaxonomySelection =
  | ({ type: 'taxonomy' } & TSelection)
  | ({ type: 'groupPart' } & GPSelection)

export type TSelection = ({ value: 'yes' } & THasSelection) | { value: 'no' }
export type THasSelection = { subId: string } & GPHasSelection
export type GPSelection = ({ value: 'yes' } & GPHasSelection) | { value: 'no' }
export type GPHasSelection = { children: { [TaxonomySubId: string]: THasSelection } }

type EState = EStateBrand & {
  v: TaxonomySelection
}

type CState = InternalStates['CState'] & {
  selected: TaxonomySelection
}

type TreeStates = InternalStates & {
  CState: CState
  EState: EState
}

type States = TreeStates & StatesDomain

export type { States as PerTaxonomySelectStates }

export const noTaxonomy: TSelection = { value: 'no' }
export const noGroupPart: GPSelection = { value: 'no' }

export const perTaxonomySelected = <L extends TaxonomySelection['type']>(
  type: L,
  eState: EState | undefined,
): Pick<CState, 'selected'> => ({
  selected: eState?.v ?? ({ type, value: 'no' } as Extract<TaxonomySelection, { type: L }>),
})

export const selectableGroupPartPerTaxonomyReduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: args => ({
    ...groupPartReduce.groupPart(args),
    ...perTaxonomySelected('groupPart', args.eState),
  }),
  taxonomy: args => ({
    ...groupPartReduce.taxonomy(args),
    ...perTaxonomySelected('taxonomy', args.eState),
  }),
}

type IState = States['IState']

export const lastSegment = (id: string) => id.split('_').at(-1)!
const join = (id: string, childId: string) => [id, lastSegment(childId)].filter(Boolean).join('_')

export const toGroupPartSelection = (selection: TSelection, groupPartId: string): GPSelection =>
  selection.value === 'yes' && selection.subId === lastSegment(groupPartId)
    ? { value: 'yes', children: selection.children }
    : noGroupPart

export const toTaxonomySelection = (selection: GPSelection, taxonomyId: string): TSelection => {
  const child = selection.value === 'yes' ? selection.children[lastSegment(taxonomyId)] : undefined
  return child ? { value: 'yes', ...child } : noTaxonomy
}

type ExpandPerTaxonomy<Sel, Shape extends TreeShape<Shape>> = (
  selection: Sel,
  tree: TreeNode<IState, Shape>,
) => TreeNode<EState, Shape>

export const mapChildren = <Sel, Shape extends TreeShape<Shape>>(
  children: Record<string, TreeNode<IState, Shape>>,
  expand: ExpandPerTaxonomy<Sel, Shape>,
  selectionOf: (id: string) => Sel,
) => {
  const expanded: Record<string, TreeNode<EState, Shape>> = {}
  for (const [id, node] of Object.entries(children)) {
    expanded[id] = expand(selectionOf(id), node)
  }
  return expanded
}

export const makePerTaxonomyExpand =
  <Sel, Shape extends TreeShape<Shape>>(
    toV: (selection: Sel) => TaxonomySelection,
    processChildren: (
      selection: Sel,
      child: TreeNode<IState, Shape>['child'],
    ) => TreeNode<EState, Shape>['child'],
  ): ExpandPerTaxonomy<Sel, Shape> =>
  (selection, tree) => {
    const v = toV(selection)
    return {
      item: { brand: 'EState' as const, type: v.type, v },
      child: processChildren(selection, tree.child),
    }
  }

type GroupPartLikeShape<Type extends string> = {
  type: Type
  child: { taxonomies: TaxonomyShapes['taxonomy'] }
}

export const makeGroupPartPerTaxonomyExpand = <Type extends string>(): ExpandPerTaxonomy<
  GPSelection,
  GroupPartLikeShape<Type>
> =>
  makePerTaxonomyExpand<GPSelection, GroupPartLikeShape<Type>>(
    (selection): TaxonomySelection => ({ type: 'groupPart', ...selection }),
    (selection, { taxonomies }) => ({
      taxonomies: mapChildren(taxonomies, expandTaxonomy, id => toTaxonomySelection(selection, id)),
    }),
  )

export const expandGroupPart = makeGroupPartPerTaxonomyExpand<'groupPart'>()

export const expandTaxonomy: ExpandPerTaxonomy<TSelection, TaxonomyShapes['taxonomy']> =
  makePerTaxonomyExpand(
    (selection): TaxonomySelection => ({ type: 'taxonomy', ...selection }),
    (selection, { groupParts }) => ({
      groupParts: mapChildren(groupParts, expandGroupPart, id => toGroupPartSelection(selection, id)),
    }),
  )

/** groupPart and space both nest taxonomies. */
export type NodeWithTaxonomies = {
  item: CState
  child: { taxonomies: Record<string, TaxonomyNodeLayers<States>['taxonomy']['CState']> }
}

export const findSelectedInGroupPart = (id: string, node?: NodeWithTaxonomies): GPSelection => {
  const selected = node?.item.selected
  if (!node || selected?.type !== 'groupPart' || selected.value !== 'yes') return noGroupPart
  const children: GPHasSelection['children'] = {}
  for (const [taxId, child] of Object.entries(node.child.taxonomies)) {
    const tax = findSelectedInTaxonomy(join(id, taxId), child)
    if (tax.value === 'yes') children[lastSegment(taxId)] = { subId: tax.subId, children: tax.children }
  }
  return { value: 'yes', children }
}

export const findSelectedInTaxonomy = (
  id: string,
  taxonomy?: TaxonomyNodeLayers<States>['taxonomy']['CState'],
): TSelection => {
  const selected = taxonomy?.item.selected
  if (!taxonomy || selected?.type !== 'taxonomy' || selected.value !== 'yes') return noTaxonomy
  const childId = [id, selected.subId].filter(Boolean).join('_')
  const gp = findSelectedInGroupPart(childId, taxonomy.child.groupParts[childId])
  return { value: 'yes', subId: selected.subId, children: gp.value === 'yes' ? gp.children : {} }
}
