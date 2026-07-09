import {
  TaxonomyGroupPartCtxDom,
  TaxonomyItemsDomain,
  TaxonomyNodeLayers,
} from '../groups-tree/group-part'
import { ExternalBrand, ExternExpand } from '../groups-tree/tree-common'
import { expandGroupPart, findSelectedInGroupPart } from './single'
import type { SingleStates } from './single'

export type SingleGroupPartExternal = ExternalBrand & {
  subId: string | null
}

export const externExpandGroupPartSingle = <
  Items extends TaxonomyItemsDomain,
  Ctx extends TaxonomyGroupPartCtxDom<SingleStates, Items, Ctx>,
>(): ExternExpand<
  SingleStates,
  SingleGroupPartExternal,
  TaxonomyNodeLayers<SingleStates>['groupPart']
> => ({
  expand: (external, tree) => [expandGroupPart(external.subId, tree), { brand: 'EData' }],
  extern: computed => ({
    brand: 'external',
    subId: findSelectedInGroupPart('', computed),
  }),
})

export type { SingleGroupPartExternal as GroupPartExternalSingle }
