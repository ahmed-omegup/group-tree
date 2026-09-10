import type { TaxonomyNodeLayers, TaxonomyShapes } from '../groups-tree/group-part'
import type { TreeNode, TreeShape } from '../groups-tree/tree-common'
import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem } from '../groups-tree/group-part'
import type { EStateBrand, Reduce, StatesDomain } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'

/** `one`: a taxonomy (one selected groupPart). `many`: a groupPart or space (many taxonomies). */
export type TaxonomySelection = ({ type: 'one' } & TSelection) | ({ type: 'many' } & GPSelection)

export type TSelection = ({ value: 'yes' | 'now' } & THasSelection) | { value: 'no' }
export type THasSelection = { subId: string } & GPHasSelection
export type GPSelection = ({ value: 'yes' | 'now' } & GPHasSelection) | { value: 'no' }
type TSectectionDict = { [TaxonomySubId: string]: THasSelection }
export type GPHasSelection = { children: TSectectionDict }

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

export const lastSegment = (id: string) => id.split('_').at(-1)!
const join = (id: string, childId: string) => [id, lastSegment(childId)].filter(Boolean).join('_')

const noOne: TaxonomySelection = { type: 'one', value: 'no' }
const noMany: TaxonomySelection = { type: 'many', value: 'no' }

export const perTaxonomySelected = <L extends TaxonomySelection['type']>(
  type: L,
  eState: EState | undefined,
): Pick<CState, 'selected'> => ({
  selected: eState?.v ?? { type, value: 'no' },
})


type Pred<T, V> = (x: T) => x is T & V
const h =
  <T, K extends keyof T, V>(k: K, pred: Pred<T[K], V>): Pred<T, Record<K, V>> =>
  (x: T): x is T & Record<K, V> =>
    pred(x[k])
const eq =
  <T, V>(v: V): Pred<T, V> =>
  (x: T): x is T & V =>
    (x as {}) === v

const findSelected = (nodes: Record<string, { item: CState }>, value: 'now' | 'yes') =>
  Object.entries(nodes).find(h(1, h('item', h('selected', h('value', eq(value))))))

const oneFromChildren = (
  groupParts: Record<string, { item: CState }>,
  eState: EState | undefined,
): TaxonomySelection & { type: 'one' } => {
  const eOne = eState?.v.type === 'one' && eState.v.value === 'yes' ? eState.v : undefined
  const hit = findSelected(groupParts, 'now') ?? findSelected(groupParts, 'yes')
  if (hit) {
    const [id, node] = hit
    return {
      ...node.item.selected,
      type: 'one',
      subId: lastSegment(id),
    }
  }
  if (eOne && !Object.keys(groupParts).some(id => lastSegment(id) === eOne.subId)) return eOne
  return noOne
}

export const manyFromChildren = (
  taxonomies: Record<string, { item: CState }>,
  eState: EState | undefined,
): TaxonomySelection & { type: 'many' } => {
  const eMany = eState?.v.type === 'many' && eState.v.value !== 'no' ? eState.v : undefined
  if (eMany?.value === 'now') return eMany

  const children = { ...eMany?.children }
  for (const [id, { item }] of Object.entries(taxonomies)) {
    const sel = item.selected
    const k = lastSegment(id)
    if (sel.type === 'one' && sel.value !== 'no')
      children[k] = { subId: sel.subId, children: sel.children }
    else delete children[k]
  }
  if (Object.keys(children).length === 0)
    return eMany && Object.keys(eMany.children).length === 0 ? eMany : noMany
  return {
    type: 'many',
    value: findSelected(taxonomies, 'now') ? 'now' : 'yes',
    children,
  }
}

export const selectableGroupPartPerTaxonomyReduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: args => ({
    ...groupPartReduce.groupPart(args),
    selected: manyFromChildren(args.child.taxonomies, args.eState),
  }),
  taxonomy: args => ({
    ...groupPartReduce.taxonomy(args),
    selected: oneFromChildren(args.child.groupParts, args.eState),
  }),
}

type IState = States['IState']

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
    (selection): TaxonomySelection => ({ type: 'many', ...selection }),
    (selection, { taxonomies }) => ({
      taxonomies: mapChildren(taxonomies, expandTaxonomy, id => toTaxonomySelection(selection, id)),
    }),
  )

export const expandGroupPart = makeGroupPartPerTaxonomyExpand<'groupPart'>()

export const expandTaxonomy: ExpandPerTaxonomy<TSelection, TaxonomyShapes['taxonomy']> =
  makePerTaxonomyExpand(
    (selection): TaxonomySelection => ({ type: 'one', ...selection }),
    (selection, { groupParts }) => ({
      groupParts: mapChildren(groupParts, expandGroupPart, id =>
        toGroupPartSelection(selection, id),
      ),
    }),
  )

/** groupPart and space both nest taxonomies. */
export type NodeWithTaxonomies = {
  item: CState
  child: { taxonomies: Record<string, TaxonomyNodeLayers<States>['taxonomy']['CState']> }
}

export const findSelectedInGroupPart = (gpId: string, node?: NodeWithTaxonomies): GPSelection => {
  const selected = node?.item.selected
  if (!node || selected?.type !== 'many' || selected.value === 'no') return noGroupPart
  const children: TSectectionDict = {}
  for (const taxSubId of Object.keys(selected.children)) {
    const childId = join(gpId, taxSubId)
    const tax = findSelectedInTaxonomy(childId, node.child.taxonomies[childId])
    children[taxSubId] =
      tax.value !== 'no'
        ? { subId: tax.subId, children: tax.children }
        : selected.children[taxSubId]!
  }
  return { value: 'yes', children }
}

export const findSelectedInTaxonomy = (
  id: string,
  taxonomy?: TaxonomyNodeLayers<States>['taxonomy']['CState'],
): TSelection => {
  const selected = taxonomy?.item.selected
  if (!taxonomy || selected?.type !== 'one' || selected.value === 'no') return noTaxonomy
  const childId = join(id, selected.subId)
  const gp = findSelectedInGroupPart(childId, taxonomy.child.groupParts[childId])
  return {
    value: 'yes',
    subId: selected.subId,
    children: gp.value !== 'no' ? gp.children : selected.children,
  }
}
