import { SpaceShapes, SpacesItemsDomain, SpacesNodes } from '../groups-tree/space'
import type { CtxDom } from '../groups-tree/space'
import { Expand, Extern, ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import { expandTaxonomy, findSelectedIn, makeSingleExpand } from './single'
import { mapChildren, findSelectedInTaxonomy } from './single'
import type { SingleStates as States } from './single'
export type SingleSpaceExternal = ExternalBrand & {
  selectedId: string | null
}

const expandSpace = makeSingleExpand<'space', SpaceShapes['space']>(
  'space',
  (selectedId, { taxonomies }) => ({
    taxonomies: mapChildren(taxonomies, expandTaxonomy, selectedId),
  }),
)

const expandRoot = makeSingleExpand<'root', SpaceShapes['root']>(
  'root',
  (selectedId, { spaces }) => ({
    spaces: mapChildren(spaces, expandSpace, selectedId),
  }),
)

export const expand: Expand<States, SingleSpaceExternal, SpacesNodes<States>['root']> = (
  external,
  tree,
) => [expandRoot(external.selectedId, tree), { brand: 'EData' }]

export const findSelectedInSpace = (id: string, space?: SpacesNodes<States>['space']['CState']) =>
  findSelectedIn(space, id, (child, childId) =>
    findSelectedInTaxonomy(childId, child.taxonomies[childId]),
  )

export const extern: Extern<
  States,
  SingleSpaceExternal,
  SpacesNodes<States>['root']
> = computed => ({
  brand: 'external',
  selectedId: findSelectedIn(computed, '', (child, spaceId) =>
    findSelectedInSpace(spaceId, child.spaces[spaceId]),
  ),
})

export const externExpandSpacesSingle = <
  Items extends SpacesItemsDomain,
  Ctx extends CtxDom<States, Items, Ctx>,
>(): ExternExpand<States, SingleSpaceExternal, SpacesNodes<States>['root']> => ({
  expand,
  extern,
})

export type { SingleSpaceExternal as SpacesExternalSingle }
