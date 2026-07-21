import type { TaxonomyNodeLayers } from '../groups-tree/group-part'
import type { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import type { SingleSelectStates } from './single'
import { expandGroupPart, findSelectedInGroupPart } from './single'

type External = ExternalBrand & { subId: string | null }

type GroupPartLayer = TaxonomyNodeLayers<SingleSelectStates>['groupPart']

type ThisExternExpand = ExternExpand<SingleSelectStates, External, GroupPartLayer, never, {}>

export const externExpandGroupPartSingle: ThisExternExpand = {
  expand: (external, tree) => [expandGroupPart(external.subId, tree.state), { brand: 'EData' }],
  extern: computed => ({
    brand: 'external',
    subId: findSelectedInGroupPart('', computed),
  }),
}

export type { External as GroupPartExternalSingle }
