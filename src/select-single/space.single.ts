import { idToTaxonomyId } from '../groups-tree/group-part'
import type { SpaceItemKeys, SpacesListItem, SpacesTreeLevel } from '../groups-tree/space'
import { SpaceShapes, SpacesItemsDomain, SpacesNodes } from '../groups-tree/space'
import { Expand, Extern, ExternalBrand, ExternExpand, Reduce } from '../groups-tree/tree-common'
import { spacesReduce } from '../internal.space'
import { selectableGroupPartSingleReduce, findSelectedInTaxonomy, makeSingleExpand } from './single'
import { expandTaxonomy, findSelectedIn, mapChildren, singleSelected } from './single'
import type { SingleStates as States } from './single'
type External = ExternalBrand & { selectedId: string | null }

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

export type ThisExpand = Expand<States, External, SpacesNodes<States>['root'], never, {}>

export const expand: ThisExpand = (external, tree) => [
  expandRoot(external.selectedId, tree.state),
  { brand: 'EData' },
]

export const findSelectedInSpace = (id: string, space?: SpacesNodes<States>['space']['CState']) =>
  findSelectedIn(space, id, (child, childId) =>
    findSelectedInTaxonomy(childId, child.taxonomies[idToTaxonomyId(childId)]),
  )

export const extern: Extern<States, External, SpacesNodes<States>['root']> = computed => ({
  brand: 'external',
  selectedId: findSelectedIn(computed, '', (child, spaceId) =>
    findSelectedInSpace(spaceId, child.spaces[spaceId]),
  ),
})

type SingleExternExpand = ExternExpand<States, External, SpacesNodes<States>['root'], never, {}>
export const externExpandSpacesSingle: SingleExternExpand = { expand, extern }

export type { External as SpacesExternalSingle }
