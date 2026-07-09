import type { TaxonomyNodeLayers, TaxonomyShapes } from '../groups-tree/group-part'
import type { TreeNode, TreeNodeDomain, TreeShape, TreeShapes } from '../groups-tree/tree-common'
import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem } from '../groups-tree/group-part'
import type { EStateBrand, Reduce } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'

type EState = EStateBrand & {
  v:
    | {
        selected: 'yes' | 'no'
      }
    | {
        selected: 'some'
        selectedSubIds: string[]
      }
}

type CState = InternalStates['CState'] & {
  selected: 'yes' | 'no' | 'some'
  selectedSubIds?: string[]
}

type States = InternalStates & {
  CState: CState
  EState: EState
}

export type { States as SelectableStates }

const notYesEStateToCState = (
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  eState?.v.selected === 'some' ? eState.v : { selected: 'no' }

export const allSelected = (
  children: Record<string, { item: States['CState'] }>,
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  Object.values(children).length !== 0
    ? {
        selected: Object.values(children).every(({ item: c }) => c.selected === 'yes')
          ? 'yes'
          : Object.values(children).some(
                ({ item: c }) => c.selected === 'yes' || c.selected === 'some',
              )
            ? 'some'
            : 'no',
      }
    : notYesEStateToCState(eState)

export const someSelected = (
  children: Record<string, { item: States['CState'] }>,
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  eState?.v.selected === 'yes'
    ? { selected: 'yes' }
    : Object.values(children).length !== 0
      ? {
          selected: Object.values(children).some(({ item: c }) => c.selected === 'yes')
            ? 'yes'
            : Object.values(children).some(({ item: c }) => c.selected === 'some')
              ? 'some'
              : 'no',
        }
      : notYesEStateToCState(eState)

export const selectableGroupPartReduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: args => ({
    ...groupPartReduce.groupPart(args),
    ...someSelected(args.child.taxonomies, args.eState),
  }),
  taxonomy: args => ({
    ...groupPartReduce.taxonomy(args),
    ...allSelected(args.child.groupParts, args.eState),
  }),
}

type IState = States['IState']

type Expandx<Shape extends TreeShape<Shape>> = (
  selectedIds: string[],
  tree: TreeNode<IState, Shape>,
  parentSelected: boolean,
) => TreeNode<EState, Shape>

type Splitten<NodeLayer extends TreeNodeDomain<IState, string>> = Record<
  keyof NodeLayer['child'],
  Record<string, string[]>
>

export const handleChildren = <Shape extends TreeShape<Shape>>(
  children: Record<string, TreeNode<IState, Shape>>,
  selectedIds: Record<string, string[]>,
  parentSelected: boolean,
  handleChild: Expandx<Shape>,
): Record<string, TreeNode<EState, Shape>> => {
  const out: Record<string, TreeNode<EState, Shape>> = {}
  for (const [id, node] of Object.entries(children)) {
    const key = id.split('_').slice(-1)[0]!
    out[id] = handleChild(selectedIds[key] ?? [], node, parentSelected)
  }
  return out
}

export const makeExpand =
  <L extends string, Shapes extends TreeShapes<L, Shapes>>(args: {
    level: L
    isLeaf: (children: TreeNode<IState, Shapes[L]>['child']) => boolean
    initSplitten: () => Splitten<TreeNode<IState, Shapes[L]>>
    splitIds: (
      children: TreeNode<IState, Shapes[L]>['child'],
      splitten: Splitten<TreeNode<IState, Shapes[L]>>,
    ) => (selectedId: string) => boolean
    processChildren: (
      selectedIds: Splitten<TreeNode<IState, Shapes[L]>>,
      children: TreeNode<IState, Shapes[L]>['child'],
      parentSelected: boolean,
    ) => TreeNode<EState, Shapes[L]>['child']
    merge: (data: {
      child: TreeNode<EState, Shapes[L]>['child']
      item: TreeNode<EState, Shapes[L]>['item']
    }) => TreeNode<EState, Shapes[L]>
  }): Expandx<Shapes[L]> =>
  (selectedIds, tree, parentSelected) => {
    const { initSplitten, isLeaf, level, merge, processChildren, splitIds } = args
    const selected = parentSelected || selectedIds.includes('')
    const item: TreeNode<EState, Shapes[L]>['item'] = {
      brand: 'EState',
      type: level,
      v: { selected: 'no' },
    }
    const splitten = initSplitten()
    if (!selected) {
      const splitter = splitIds(tree.child, splitten)
      selectedIds = selectedIds.filter(x => !splitter(x))
      if (selectedIds.length) item.v = { selected: 'some', selectedSubIds: selectedIds }
    }
    const child = processChildren(splitten, tree.child, selected)
    if (selected && isLeaf(tree.child)) {
      item.v = { selected: 'yes' }
    }

    return merge({ item, child })
  }

const id = <T>(x: T) => x

export const taxonomiesEmpty = (x: {
  taxonomies: Record<string, TaxonomyNodeLayers<States>['taxonomy']['IState']>
}) => Object.values(x.taxonomies).every(tax => Object.keys(tax.child.groupParts).length === 0)

export const makeSpitter = (record: Record<string, unknown>, slot: Record<string, string[]>) => {
  const filler: Record<string, (id: string) => void> = {}
  for (const k in record) {
    const key = k.split('_').slice(-1)[0]!
    filler[key] = id => (slot[key] ??= []).push(id)
  }
  return (id: string) => {
    const idx = id.indexOf('_')
    const [first, rest] = idx === -1 ? [id, ''] : [id.slice(0, idx), id.slice(idx + 1)]
    const fn = filler[first!]
    if (!fn) return false
    fn(rest)
    return true
  }
}

export const expandGroupPart: Expandx<TaxonomyShapes['groupPart']> = makeExpand<
  'groupPart',
  TaxonomyShapes
>({
  level: 'groupPart',
  isLeaf: taxonomiesEmpty,
  initSplitten: () => ({ taxonomies: {} }),
  splitIds: ({ taxonomies }, splitten) => makeSpitter(taxonomies, splitten.taxonomies),
  processChildren: (splitten, { taxonomies }, parentSelected) => ({
    taxonomies: handleChildren(taxonomies, splitten.taxonomies, parentSelected, expandTaxonomy),
  }),
  merge: id,
})

export const expandTaxonomy = makeExpand<'taxonomy', TaxonomyShapes>({
  level: 'taxonomy',
  isLeaf: () => false,
  initSplitten: () => ({ groupParts: {} }),
  splitIds: ({ groupParts }, splitten) => makeSpitter(groupParts, splitten.groupParts),
  processChildren: (splitten, { groupParts }, parentSelected) => ({
    groupParts: handleChildren(groupParts, splitten.groupParts, parentSelected, expandGroupPart),
  }),
  merge: id,
})

type CollectItems<T> = Record<string, { item: CState; child: T }>
type Collector<T> = (id: string, arg: { item: CState; child: T }) => string[]

export const collectItemIds =
  <T>(handleChildren: (prefix: string, child: T) => string[]): Collector<T> =>
  (id, { item, child }) => {
    const { selected, selectedSubIds = [] } = item
    if (selected === 'no') return []
    if (selected === 'yes') return [id]
    return [...selectedSubIds.map(subId => `${id}_${subId}`), ...handleChildren(id, child)]
  }

export const collectItems =
  <T>(collector: Collector<T>) =>
  (prefix: string, items: CollectItems<T>): string[] => {
    return Object.entries(items).flatMap(([k, item]) => {
      const key = k.split('_').slice(-1)[0]!
      const id = prefix ? `${prefix}_${key}` : key
      return collector(id, item)
    })
  }

export const collectItemGroupPartIds = collectItemIds<
  TaxonomyNodeLayers<States>['groupPart']['CState']['child']
>((prefix, { taxonomies }): string[] => collectTaxonomyIds(prefix, taxonomies))

export const collectGroupPartIds = collectItems(collectItemGroupPartIds)

export const collectItemTaxonomyIds = collectItemIds<
  TaxonomyNodeLayers<States>['taxonomy']['CState']['child']
>((prefix, { groupParts }): string[] => collectGroupPartIds(prefix, groupParts))
export const collectTaxonomyIds = collectItems(collectItemTaxonomyIds)
