import {
  makeTaxonomyGroupPartComponents,
  TaxonomyGroupPartCtxDom,
  TaxonomyItemsDomain,
  TaxonomyListItem,
  TaxonomyItemKeys,
  UseGroupParts,
  UseTaxonomyItemState,
} from './group-part'
import type {
  ExternalData,
  InternalData,
  ListItemDomain,
  Lists,
  NodeLayerDomain,
  StatesDomain,
} from './tree-common'
import { ExternExpand, makeStoreFns } from './tree-common'

export type GroupsDataHooks<
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
  ExtraKeys extends string,
  ListItem extends ListItemDomain<ExtraKeys | TaxonomyItemKeys> & TaxonomyListItem<Items>,
> = {
  useGroupParts: UseGroupParts<Filter, Items, States, ListItem>
  useItemState: UseTaxonomyItemState<Filter, Items, States, RootNode>
}

export const GroupsTreeHOC = <
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  External extends { brand: 'external' },
  ExtraKeyRoot extends string,
  RootNode extends NodeLayerDomain<States, TaxonomyItemKeys | ExtraKeyRoot>,
  Ctx extends TaxonomyGroupPartCtxDom<States, Items, Ctx>,
  ExtraKeys extends string,
  ListItems extends ListItemDomain<ExtraKeys | TaxonomyItemKeys> & TaxonomyListItem<Items>,
  Context extends null | { brand: 'context' },
>(
  args: GroupsDataHooks<Filter, Items, States, RootNode, ExtraKeys, ListItems> & {
    initialData: States['IData']
    isVisible: (state: States['CState'] | undefined) => boolean
    compute: (
      internal: InternalData<States, ExtraKeys | TaxonomyItemKeys, RootNode, ListItems>,
      external: ExternalData<States, RootNode>,
    ) => RootNode['CState']
    initialLists: Lists<ExtraKeys | TaxonomyItemKeys, ListItems>
    initialRootState: (context: Context) => RootNode['IState']
    listsToInternalState: (
      tree: RootNode['IState'],
      old: RootNode['CState'] | undefined,
      lists: Lists<ExtraKeys | TaxonomyItemKeys, ListItems>,
      context: Context,
    ) => RootNode['IState']
  } & ExternExpand<States, External, RootNode>,
) => {
  const {
    initialData,
    isVisible,
    expand,
    extern,
    useGroupParts,
    useItemState,
    compute,
    initialLists,
    initialRootState,
    listsToInternalState,
  } = args

  const { TreeProvider, useTreeSelector, useSetItemState, useTreeContext } = makeStoreFns<
    States,
    ExtraKeys | TaxonomyItemKeys,
    External,
    TaxonomyItemKeys | ExtraKeyRoot,
    RootNode,
    ListItems,
    Context
  >({
    compute,
    listsToInternalState,
    extern,
    expand,
    initialRootState,
    initialLists,
    initialData,
  })

  const subTree = makeTaxonomyGroupPartComponents<Filter, Items, States, Ctx, RootNode, ListItems>({
    useItemState,
    isVisible,
    useGroupParts,
    useTreeSelector,
    useSetItemState,
  })

  return { ...subTree, useTreeContext, TreeProvider, useTreeSelector, useSetItemState }
}
