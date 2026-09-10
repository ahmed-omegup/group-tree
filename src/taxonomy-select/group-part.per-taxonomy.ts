import type { TaxonomyNodeLayers } from '../groups-tree/group-part'
import type { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import {
  expandGroupPart,
  findSelectedInGroupPart,
  noGroupPart,
  type GPSelection,
  type PerTaxonomySelectStates,
} from './per-taxonomy'

type External = ExternalBrand & GPSelection

type GroupPartLayer = TaxonomyNodeLayers<PerTaxonomySelectStates>['groupPart']

type ThisExternExpand = ExternExpand<PerTaxonomySelectStates, External, GroupPartLayer, never, {}>

export const externExpandGroupPartPerTaxonomy: ThisExternExpand = {
  expand: (external, tree) => [
    expandGroupPart(
      external.value === 'yes' ? { value: 'yes', children: external.children } : noGroupPart,
      tree.state,
    ),
    { brand: 'EData' },
  ],
  extern: computed => ({
    brand: 'external',
    ...findSelectedInGroupPart('', computed),
  }),
}

export type { External as GroupPartExternalPerTaxonomy }
