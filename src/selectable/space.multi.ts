import { SpaceShapes, SpacesItemsDomain, SpacesNodes } from '../groups-tree/space'
import type { CtxDom } from '../groups-tree/space'
import { Expand, Extern, ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import {
  collectItemIds,
  collectItems,
  collectTaxonomyIds,
  expandTaxonomy,
  makeExpand,
} from './multi'
import { makeSpitter, taxonomiesEmpty, handleChildren } from './multi'
import type { SelectableStates as States } from './reduce'

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

export const expand: Expand<States, External, SpacesNodes<States>['root']> = (external, tree) => [
  expandRoot(external.selectedIds, tree, false),
  { brand: 'EData' },
]

const collectItemSpaceIds = collectItemIds<SpacesNodes<States>['space']['CState']['child']>(
  (prefix, { taxonomies }): string[] => collectTaxonomyIds(prefix, taxonomies),
)
const collectSpaceIds = collectItems(collectItemSpaceIds)

export const extern: Extern<States, External, SpacesNodes<States>['root']> = computed => ({
  brand: 'external',
  selectedIds: collectSpaceIds('', computed.child.spaces),
})

export const externExpandSpacesMulti = <
  Items extends SpacesItemsDomain,
  Ctx extends CtxDom<States, Items, Ctx>,
>(): ExternExpand<States, External, SpacesNodes<States>['root']> => ({
  expand,
  extern,
})

export type { External as SpacesExternalMulti }
