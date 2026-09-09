import type { SpaceItemKeys, SpacesListItem, SpacesTreeLevel } from '../groups-tree/space'
import { SpaceShapes, SpacesItemsDomain, SpacesNodes } from '../groups-tree/space'
import { Expand, Extern, ExternalBrand, ExternExpand, Reduce } from '../groups-tree/tree-common'
import { spacesReduce } from '../internal.space'
import {
  findSelectedInGroupPart,
  makeGroupPartPerTaxonomyExpand,
  makePerTaxonomyExpand,
  mapChildren,
  noGroupPart,
  perTaxonomySelected,
  selectableGroupPartPerTaxonomyReduce,
  type GPHasSelection,
  type GPSelection,
  type PerTaxonomySelectStates as States,
  type TaxonomySelection,
} from './per-taxonomy'

export type RootSelection = { [SpaceId: string]: GPHasSelection }

export const emptyRootSelection: RootSelection = {}

const toSpaceSelection = (selection: RootSelection, spaceId: string): GPSelection => {
  const child = selection[spaceId]
  return child ? { value: 'yes', ...child } : noGroupPart
}

type External = ExternalBrand & { selected: RootSelection }

export const selectableSpacePerTaxonomyReduce: Reduce<
  States,
  SpacesTreeLevel,
  SpaceItemKeys,
  SpacesListItem<SpacesItemsDomain>,
  SpacesNodes<States>
> = {
  ...selectableGroupPartPerTaxonomyReduce,
  root: args => ({
    ...spacesReduce.root(args),
    ...perTaxonomySelected('many', args.eState),
  }),
  space: args => ({
    ...spacesReduce.space(args),
    ...perTaxonomySelected('many', args.eState),
  }),
}

const expandSpace = makeGroupPartPerTaxonomyExpand<'space'>()

const expandRoot = makePerTaxonomyExpand<RootSelection, SpaceShapes['root']>(
  (): TaxonomySelection => ({ type: 'many', value: 'no' }),
  (selection, { spaces }) => ({
    spaces: mapChildren(spaces, expandSpace, id => toSpaceSelection(selection, id)),
  }),
)

export type ThisExpand = Expand<States, External, SpacesNodes<States>['root'], never, {}>

export const expand: ThisExpand = (external, tree) => [
  expandRoot(external.selected, tree.state),
  { brand: 'EData' },
]

export const findSelectedInRoot = (
  root?: SpacesNodes<States>['root']['CState'],
): RootSelection => {
  if (!root) return emptyRootSelection
  const selected: RootSelection = {}
  for (const [spaceId, node] of Object.entries(root.child.spaces)) {
    const space = findSelectedInGroupPart(spaceId, node)
    if (space.value === 'yes') selected[spaceId] = { children: space.children }
  }
  return selected
}

export const extern: Extern<States, External, SpacesNodes<States>['root']> = computed => ({
  brand: 'external',
  selected: findSelectedInRoot(computed),
})

export const externExpandSpacesPerTaxonomy: ExternExpand<
  States,
  External,
  SpacesNodes<States>['root'],
  never,
  {}
> = { expand, extern }

export type { External as SpacesExternalPerTaxonomy }
