import type { TaxonomyNodeLayers } from '../groups-tree/group-part'
import type { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import type { SingleStates } from './single'
import { expandGroupPart, findSelectedInGroupPart } from './single'

type External = ExternalBrand & { subId: string | null }

type GroupPartLayer = TaxonomyNodeLayers<SingleStates>['groupPart']

type ThisExternExpand = ExternExpand<SingleStates, External, GroupPartLayer, never, {}>

export const externExpandGroupPartSingle: ThisExternExpand = {
  expand: (external, tree) => [expandGroupPart(external.subId, tree.state), { brand: 'EData' }],
  extern: computed => ({
    brand: 'external',
    subId: findSelectedInGroupPart('', computed),
  }),
}

export type { External as GroupPartExternalSingle }
