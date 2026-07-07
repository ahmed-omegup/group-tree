import { UseGroupParts } from './group-part'
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
import { ExternExpand } from './tree-common'

export type { CtxDom } from './space'

export type SpacesDataHooks<
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
> = {
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
  useGroupParts: UseGroupParts<Filter, Items, States, SpacesListItem<Items>>
  useItemState: UseSpaceItemState<Filter, Items, States>
}

export const SpacesTreeHOC = <
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  Ctx extends CtxDom<States, Items, Ctx>,
>(
  args: SpacesDataHooks<Filter, Items, States> & {
    initialState: InitialState<States, SpacesTreeLevel, SpacesNodes<States>>
    initialData: States['IData']
    reduce: Reduce<
      States,
      SpacesTreeLevel,
      SpaceItemKeys,
      SpacesListItem<Items>,
      SpacesNodes<States>
    >
    isVisible: (state: States['CState'] | undefined) => boolean
  } & ExternExpand<States, External, SpacesNodes<States>['root']>,
) => {
  const { initialState, isVisible, expand, extern, useSpaces, reduce } = args
  const { useTaxonomies, useGroupParts, useItemState, initialData } = args

  const { computeRootState } = makeSpaceComputeFns<States, Items>(reduce)
  const { listsToInternalState } = makeSpaceTreeFns<States, Items>(initialState)
  const { TreeProvider, useTreeSelector, useSetItemState, ...subTree } = GroupsTreeHOC<
    Filter,
    Items,
    States,
    External,
    SpacesTreeLevel,
    SpacesNodes<States>['root'],
    Ctx,
    SpaceItemKeys,
    SpacesListItem<Items>,
    null
  >({
    compute: computeRootState,
    expand,
    extern,
    initialData,
    initialLists: { space: {}, taxonomy: {}, groupPart: {} },
    initialRootState: ()=>initialState['root'](''),
    isVisible,
    listsToInternalState,
    useGroupParts,
    useItemState,
  })

  const { Spaces } = makeSpaceComponents<Filter, Items, States, Ctx>(
    {
      useItemState,
      isVisible,
      useTaxonomies,
      useSpaces,
      useTreeSelector,
      useSetItemState,
    },
    subTree,
  )

  return { ...subTree, Spaces, TreeProvider, useTreeSelector }
}
