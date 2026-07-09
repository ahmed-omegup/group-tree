import type { TaxonomyItemKeys, TaxonomyItemsDomain } from '../groups-tree/group-part'
import type { TaxonomyListItem, TaxonomyNodeLayers } from '../groups-tree/group-part'
import type { EStateBrand, Reduce, StatesDomain } from '../groups-tree/tree-common'
import { groupPartReduce, type InternalStates } from '../internal'

type EState = EStateBrand & {
  v:
    | {
        selected: 'yes' | 'no'
      }
    | {
        selected: 'some'
        selectedSubIds: string[]
      }
}

type CState = InternalStates['CState'] & {
  selected: 'yes' | 'no' | 'some'
  selectedSubIds?: string[]
}

type TreeStates = InternalStates & {
  CState: CState
  EState: EState
}

type States = TreeStates & StatesDomain

export type { States as SelectableStates, TreeStates as SelectableTreeStates }

const notYesEStateToCState = (
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  eState?.v.selected === 'some' ? eState.v : { selected: 'no' }

export const allSelected = (
  children: Record<string, { item: States['CState'] }>,
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  Object.values(children).length !== 0
    ? {
        selected: Object.values(children).every(({ item: c }) => c.selected === 'yes')
          ? 'yes'
          : Object.values(children).some(
                ({ item: c }) => c.selected === 'yes' || c.selected === 'some',
              )
            ? 'some'
            : 'no',
      }
    : notYesEStateToCState(eState)

export const someSelected = (
  children: Record<string, { item: States['CState'] }>,
  eState: EState | undefined,
): Pick<CState, 'selected' | 'selectedSubIds'> =>
  eState?.v.selected === 'yes'
    ? { selected: 'yes' }
    : Object.values(children).length !== 0
      ? {
          selected: Object.values(children).some(({ item: c }) => c.selected === 'yes')
            ? 'yes'
            : Object.values(children).some(({ item: c }) => c.selected === 'some')
              ? 'some'
              : 'no',
        }
      : notYesEStateToCState(eState)

export const selectableGroupPartReduce: Reduce<
  States,
  TaxonomyItemKeys,
  TaxonomyItemKeys,
  TaxonomyListItem<TaxonomyItemsDomain>,
  TaxonomyNodeLayers<States>
> = {
  groupPart: args => ({
    ...groupPartReduce.groupPart(args),
    ...someSelected(args.child.taxonomies, args.eState),
  }),
  taxonomy: args => ({
    ...groupPartReduce.taxonomy(args),
    ...allSelected(args.child.groupParts, args.eState),
  }),
}

