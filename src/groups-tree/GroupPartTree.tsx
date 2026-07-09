import {
  makeGroupPartComputeFns,
  makeGroupPartTreeFns,
  TaxonomyGroupPartArgs,
  TaxonomyGroupPartCtxDom,
  TaxonomyItemKeys,
  TaxonomyItemsDomain,
  TaxonomyNodeLayers,
  UseGroupParts,
  UseTaxonomyItemState,
} from './group-part'
import { TaxonomyListItem } from './group-part/types'
import { GroupsTreeHOC } from './GroupsTree'
import type { InitialState, Reduce, SetItemData, StatesDomain, StoreArgs } from './tree-common'
import { ExternExpand, root } from './tree-common'

export type { CtxDom } from './space'

export type GroupPartDataHooks<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
> = TaxonomyGroupPartArgs<
  Filter,
  Items,
  States,
  TaxonomyNodeLayers<States>['groupPart'],
  TaxonomyListItem<Items>
> & {
  useTaxonomies: (
    groupPart: Items['groupPart'],
    setItemData: SetItemData<
      States,
      TaxonomyNodeLayers<States>['groupPart'],
      TaxonomyListItem<Items>['taxonomy']
    >,
    filter: Filter,
  ) => void
}

export const getStoreArgs = <
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  Ctx extends TaxonomyGroupPartCtxDom<States, Items, Ctx>,
>(
  { expand, extern }: ExternExpand<States, External, TaxonomyNodeLayers<States>['groupPart']>,
  storeArgs: {
    initialState: InitialState<States, TaxonomyItemKeys, TaxonomyNodeLayers<States>>
    reduce: Reduce<
      States,
      TaxonomyItemKeys,
      TaxonomyItemKeys,
      TaxonomyListItem<Items>,
      TaxonomyNodeLayers<States>
    >
  },
) => {
  const { initialState, reduce } = storeArgs
  type Context = { brand: 'context'; groupPart: Items['groupPart'] }
  type ListItems = TaxonomyListItem<Items>
  const { computeGroupPartState } = makeGroupPartComputeFns<States, Items, never, ListItems>(reduce)
  const { listsToGroupPartNode } = makeGroupPartTreeFns<States, Items>(initialState)
  type RootNode = TaxonomyNodeLayers<States>['groupPart']
  const r: StoreArgs<States, TaxonomyItemKeys, External, RootNode, ListItems, Context> = {
    expand,
    extern,
    initialData: { brand: 'IData' },
    compute: computeGroupPartState,
    initialLists: { taxonomy: {}, groupPart: {} },
    initialRootState: (ctx: Context) => initialState.groupPart(ctx.groupPart._id),
    listsToInternalState: (tree, old, lists, { groupPart }) =>
      listsToGroupPartNode(groupPart._id, lists.taxonomy[groupPart._id] ?? [], tree, old, lists),
  }
  return r
}

export const GroupPartTreeHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  Ctx extends TaxonomyGroupPartCtxDom<States, Items, Ctx>,
>(
  { expand, extern }: ExternExpand<States, External, TaxonomyNodeLayers<States>['groupPart']>,
  storeArgs: {
    initialState: InitialState<States, TaxonomyItemKeys, TaxonomyNodeLayers<States>>
    reduce: Reduce<
      States,
      TaxonomyItemKeys,
      TaxonomyItemKeys,
      TaxonomyListItem<Items>,
      TaxonomyNodeLayers<States>
    >
  },
  args: GroupPartDataHooks<Filter, Items, States>,
) => {
  const { TreeProvider, useTreeSelector, useSetItemState, useTreeContext, makeComponents } =
    GroupsTreeHOC(getStoreArgs({ expand, extern }, storeArgs), args)
    
  const subTree = makeComponents<Ctx>()

  const GroupPart = (props: { ctx: Ctx; filter: Filter }) => {
    const treeCtx = useTreeContext().context
    const { updateWithList } = useSetItemState('groupPart', root(), treeCtx.groupPart)
    args.useTaxonomies(
      treeCtx.groupPart,
      (updater, list) => updateWithList(updater, ['taxonomy', treeCtx.groupPart._id, list]),
      props.filter,
    )
    return subTree.GroupPart({
      ...props,
      extra: { path: root() },
      item: treeCtx.groupPart,
    })
  }

  return { ...subTree, GroupPart, TreeProvider, useTreeSelector }
}
