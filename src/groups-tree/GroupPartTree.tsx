import {
  makeGroupPartComputeFns,
  makeGroupPartTreeFns,
  TaxonomyGroupPartCtxDom,
  TaxonomyItemKeys,
  TaxonomyItemsDomain,
  TaxonomyNodeLayers,
  UseGroupParts,
  UseTaxonomyItemState,
} from './group-part'
import { TaxonomyListItem } from './group-part/types'
import { GroupsTreeHOC } from './GroupsTree'
import type { InitialState, Reduce, SetItemData, StatesDomain } from './tree-common'
import { ExternExpand, root } from './tree-common'

export type { CtxDom } from './space'

export type GroupPartDataHooks<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
> = {
  useGroupParts: UseGroupParts<Filter, Items, States, TaxonomyListItem<Items>>
  useTaxonomies: (
    groupPart: Items['groupPart'],
    setItemData: SetItemData<
      States,
      TaxonomyNodeLayers<States>['groupPart'],
      TaxonomyListItem<Items>['taxonomy']
    >,
    filter: Filter,
  ) => void
  useItemState: UseTaxonomyItemState<Filter, Items, States, TaxonomyNodeLayers<States>['groupPart']>
}

export const GroupPartTreeHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  Ctx extends TaxonomyGroupPartCtxDom<States, Items, Ctx>,
>(
  args: GroupPartDataHooks<Filter, Items, States> & {
    initialState: InitialState<States, TaxonomyItemKeys, TaxonomyNodeLayers<States>>
    initialData: States['IData']
    reduce: Reduce<
      States,
      TaxonomyItemKeys,
      TaxonomyItemKeys,
      TaxonomyListItem<Items>,
      TaxonomyNodeLayers<States>
    >
    isVisible: (state: States['CState'] | undefined) => boolean
    groupPartId: string
  } & ExternExpand<States, External, TaxonomyNodeLayers<States>['groupPart']>,
) => {
  const { initialState, isVisible, expand, extern, reduce, groupPartId } = args
  const { useGroupParts, useItemState, initialData, useTaxonomies } = args

  const { computeGroupPartState } = makeGroupPartComputeFns<
    States,
    Items,
    never,
    TaxonomyListItem<Items>
  >(reduce)
  const { listsToGroupPartNode } = makeGroupPartTreeFns<States, Items>(initialState)
  const { TreeProvider, useTreeSelector, useSetItemState, useTreeContext, ...subTree } =
    GroupsTreeHOC<
      Filter,
      Items,
      States,
      External,
      TaxonomyItemKeys,
      TaxonomyNodeLayers<States>['groupPart'],
      Ctx,
      TaxonomyItemKeys,
      TaxonomyListItem<Items>,
      {
        brand: 'context'
        groupPart: Items['groupPart']
      }
    >({
      compute: computeGroupPartState,
      expand,
      extern,
      initialData,
      initialLists: { taxonomy: {}, groupPart: {} },
      initialRootState: ctx => initialState.groupPart(ctx.groupPart._id),
      isVisible,
      listsToInternalState: (tree, old, lists, { groupPart }) =>
        listsToGroupPartNode(groupPart._id, lists.taxonomy[groupPart._id] ?? [], tree, old, lists),
      useGroupParts,
      useItemState,
    })
  const GroupPart = (props: { ctx: Ctx; filter: Filter }) => {
    const treeCtx = useTreeContext().context
    const { updateWithList } = useSetItemState('groupPart', root(), treeCtx.groupPart)
    useTaxonomies(
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
