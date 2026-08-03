import type { SpaceShapes, SpacesItemsDomain, SpacesNodes } from '../groups-tree/space'
import type { CtxDom } from '../groups-tree/space'
import type { Expand, Extern, ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import { collectItemIds, collectItems, expandTaxonomy, makeExpand } from './multi'
import { collectTaxonomyIds, makeSpitter, taxonomiesEmpty, handleChildren } from './multi'
import type { MultiSelectStates as States } from './multi'

type External = ExternalBrand & {
  selectedIds: string[]
}

const id = <T>(x: T) => x

const expandSpace = makeExpand<'space', SpaceShapes>({
  level: 'space',
  isLeaf: taxonomiesEmpty,
  initSplitten: () => ({ taxonomies: {} }),
  splitIds: ({ taxonomies }, splitten) => makeSpitter(taxonomies, splitten.taxonomies),
  processChildren: (splitten, { taxonomies }, parentSelected) => ({
    taxonomies: handleChildren(taxonomies, splitten.taxonomies, parentSelected, expandTaxonomy),
  }),
  merge: id,
})

const expandRoot = makeExpand<'root', SpaceShapes>({
  level: 'root',
  isLeaf: () => false,
  initSplitten: () => ({ spaces: {} }),
  splitIds: ({ spaces }, splitten) => makeSpitter(spaces, splitten.spaces),
  processChildren: (splitten, { spaces }, parentSelected) => ({
    spaces: handleChildren(spaces, splitten.spaces, parentSelected, expandSpace),
  }),
  merge: id,
})

type SpaceNode = SpacesNodes<States>['root']

export const expand: Expand<States, External, SpaceNode, never, {}> = (external, tree) => [
  expandRoot(external.selectedIds, tree.state, false),
  { brand: 'EData' },
]

const collectItemSpaceIds = collectItemIds<SpacesNodes<States>['space']['CState']['child']>(
  (prefix, { taxonomies }): string[] => collectTaxonomyIds(prefix, taxonomies),
)
const collectSpaceIds = collectItems(collectItemSpaceIds)

export const extern: Extern<States, External, SpacesNodes<States>['root']> = computed => ({
  brand: 'external',
  selectedIds: collectSpaceIds(
    { id: '', hasUnselected: computed.item.hasUnselected },
    computed.child.spaces,
  ),
})

type ThisExternExpand = ExternExpand<States, External, SpaceNode, never, {}>
export const externExpandSpacesMulti: ThisExternExpand = { expand, extern }

export type { External as SpacesExternalMulti }
