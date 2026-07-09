import {
  TaxonomyGroupPartCtxDom,
  TaxonomyItemsDomain,
  TaxonomyNodeLayers,
} from '../groups-tree/group-part'
import { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import { collectItemGroupPartIds, expandGroupPart } from './multi'
import type { SelectableStates } from './multi'

type External = ExternalBrand & {
  subIds: string[]
}

export const externExpandGroupPartMulti = <
  Items extends TaxonomyItemsDomain,
  Ctx extends TaxonomyGroupPartCtxDom<SelectableStates, Items, Ctx>,
>(): ExternExpand<
  SelectableStates,
  External,
  TaxonomyNodeLayers<SelectableStates>['groupPart']
> => ({
  expand: (external, tree) => [expandGroupPart(external.subIds, tree, false), { brand: 'EData' }],
  extern: computed => {
    const ids = collectItemGroupPartIds('', computed)
    return {
      brand: 'external',
      subIds: ids.some(c => c.indexOf('_') === -1) ? [''] : ids,
    }
  },
})

export type { External as GroupPartExternalMulti }
