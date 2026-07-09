import { makeTaxonomyGroupPartComponents, TaxonomyGroupPartHooks } from './group-part'
import { GroupsTreeHOC } from './GroupsTree'
import type {
  CtxDom,
  SpaceItemKeys,
  SpacesItemsDomain,
  SpacesListItem,
  SpacesNodes,
  SpacesTreeLevel,
} from './space'
import { makeSpaceComponents, makeSpaceComputeFns, makeSpaceTreeFns } from './space'
import type { UseSpaceItemState } from './space/types'
import type { InitialState, Reduce, SetItemData, StatesDomain } from './tree-common'
import { ExternExpand, makeStoreFns } from './tree-common'

export type { CtxDom } from './space'

export type SpacesDataHooks<
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
> = TaxonomyGroupPartHooks<Filter, Items, States, SpacesListItem<Items>> & {
  useSpaces: (
    setItemData: SetItemData<States, SpacesNodes<States>['root'], SpacesListItem<Items>['space']>,
    filter: Filter,
  ) => void
  useTaxonomies: (
    space: Items['space'],
    setItemData: SetItemData<
      States,
      SpacesNodes<States>['space'],
      SpacesListItem<Items>['taxonomy']
    >,
    filter: Filter,
  ) => void
}

export const SpacesTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  Ctx extends CtxDom<States, Items, Ctx>,
>(
  { expand, extern }: ExternExpand<States, External, SpacesNodes<States>['root']>,
  args: SpacesDataHooks<Filter, Items, States>,
  storeArgs: {
    initialState: InitialState<States, SpacesTreeLevel, SpacesNodes<States>>
    reduce: Reduce<
      States,
      SpacesTreeLevel,
      SpaceItemKeys,
      SpacesListItem<Items>,
      SpacesNodes<States>
    >
    isVisible: (state: States['CState'] | undefined) => boolean
  },
  useItemState: UseSpaceItemState<Filter, Items, States>,
) => {
  const { initialState, isVisible, reduce } = storeArgs
  const { useSpaces, useTaxonomies } = args

  const { computeRootState } = makeSpaceComputeFns<States, Items>(reduce)
  const { listsToInternalState } = makeSpaceTreeFns<States, Items>(initialState)

  const storeResult = makeStoreFns({
    compute: computeRootState,
    expand,
    extern,
    initialData: { brand: 'IData' },
    initialLists: { space: {}, taxonomy: {}, groupPart: {} },
    initialRootState: () => initialState['root'](''),
    listsToInternalState,
  })

  const makeComponents = makeTaxonomyGroupPartComponents<
    Filter,
    Items,
    States,
    SpacesNodes<States>['root'],
    SpacesListItem<Items>
  >(args, storeResult, useItemState, isVisible)

  const subTree = makeComponents<Ctx>()

  const { Spaces } = makeSpaceComponents<Filter, Items, States, Ctx>(
    storeResult,
    {
      useItemState,
      isVisible,
      useTaxonomies,
      useSpaces,
    },
    subTree,
  )

  const { TreeProvider, useTreeSelector } = storeResult

  return { ...subTree, Spaces, TreeProvider, useTreeSelector }
}
