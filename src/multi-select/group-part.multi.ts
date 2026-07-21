import { TaxonomyNodeLayers } from '../groups-tree/group-part'
import { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import type { MultiSelectStates } from './multi'
import { collectItemGroupPartIds, expandGroupPart } from './multi'

type External = ExternalBrand & { subIds: string[] }

type GroupPartLayer = TaxonomyNodeLayers<MultiSelectStates>['groupPart']
type ThisExternExpand = ExternExpand<MultiSelectStates, External, GroupPartLayer, never, {}>

export const externExpandGroupPartMulti: ThisExternExpand = {
  expand: (external, tree) => [
    expandGroupPart(external.subIds, tree.state, false),
    { brand: 'EData' },
  ],
  extern: computed => {
    const ids = collectItemGroupPartIds('', computed)
    return {
      brand: 'external',
      subIds: ids.some(c => c.indexOf('_') === -1) ? [''] : ids,
    }
  },
}

export type { External as GroupPartExternalMulti }
