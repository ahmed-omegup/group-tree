import type { ListItemBrand, NodeLayerDomain, StatesDomain, Tree } from '../tree-common'
import { concat, get, key, useHasBeenVisible } from '../tree-common'
import { subGroupPartId } from './tree-builder'
import type {
  TaxonomyGroupPartHooks,
  TaxonomyGroupPartStore,
  TaxonomyGroupPartMakeComponents,
  TaxonomyGroupPartCtxDom,
  TaxonomyGroupPartExtras,
  TaxonomyItemsDomain,
  TaxonomyListItem,
  UseTaxonomyItemState,
} from './types'

/**
 * Taxonomy lists are keyed by a space or groupPart id prefix, but that prefix
 * can fall at different depths (e.g. under `education` or `education_grade_001`).
 *
 * Given a groupPart id split on `_`, finds the matching list entry, then walks
 * remaining segments by matching taxonomy `subid` (skipping odd-index instance
 * segments like `001`).
 *
 * Examples for groupPart `education_grade_001` → `['education', 'grade', '001']`:
 * - list keyed at `education`: match subid `grade` → return its `.children`
 * - list keyed at `education_grade_001`: return that list directly (no further walk)
 *
 * @param idParts parts of the space / groupPart id, split by `_`
 * @param list taxonomy lists indexed by parent id (space or groupPart)
 * @returns taxonomy tree nodes at the resolved level
 */
export const getTaxonomyChildren = <Items extends TaxonomyItemsDomain>(
  idParts: string[],
  list: Record<string, TaxonomyListItem<Items>['taxonomy'][]>,
): Tree<Items['taxonomy'], ListItemBrand<'taxonomy'>>[] => {
  let last = 0
  let acc = idParts[0]!
  while (!list[acc] && ++last < idParts.length) {
    acc += `_${idParts[last]!}`
  }
  return last === idParts.length
    ? []
    : idParts
        .slice(last + 1, idParts.length)
        .reduce(
          (acc, id, i) =>
            // i is odd → instance segment, like 001, skip; i is even → taxonomy subid, find child
            i & 1 ? acc : acc.find(taxonomy => taxonomy.item.subid === id)!.children,
          list[acc]!,
        )
}

/**
 * Creates the GroupPart and Taxonomy components.
 * These components are space-independent: they only care about
 * the taxonomy ↔ groupPart recursive nesting.
 */
export const makeTaxonomyGroupPartComponents = <
  Filter,
  Items extends TaxonomyItemsDomain,
  States extends StatesDomain,
  RootNode extends NodeLayerDomain<States>,
  ListItems extends TaxonomyListItem<Items>,
>(
  args: TaxonomyGroupPartHooks<Filter, Items, States, ListItems>,
  store: TaxonomyGroupPartStore<Items, States, RootNode, ListItems>,
  useItemState: UseTaxonomyItemState<Filter, Items, States, RootNode>,
  isVisible: (state: States['CState'] | undefined) => boolean
): TaxonomyGroupPartMakeComponents<Filter, Items, States, RootNode> =>
<Ctx extends TaxonomyGroupPartCtxDom<States, Items, Ctx>>() => {
  const { useGroupParts } = args
  const { useTreeSelector, useSetItemState } = store

  // ---- GroupPart -------------------------------------------------------

  const GroupPartContent = (props: {
    state: States['CState']
    item: Items['groupPart']
    ctx: Ctx
    filter: Filter
    extra: TaxonomyGroupPartExtras<States, Items, RootNode>['groupPart']
  }) => {
    const { state, item, ctx, filter, extra } = props

    const taxonomies = useTreeSelector(x => {
      const idParts = item._id.split('_')
      return getTaxonomyChildren(idParts, x.lists.taxonomy)
    })

    return ctx.renderItem.groupPart({
      item: { item, type: 'groupPart' },
      ctx,
      state,
      update: useSetItemState('groupPart', extra.path, item).update,
      child: {
        taxonomies: taxonomies.map(taxonomy => (
          <Taxonomy
            key={taxonomy.item._id}
            item={taxonomy.item}
            ctx={ctx}
            filter={filter}
            extra={{
              groupPart: item,
              taxonomy,
              path: concat(extra.path, key('child'), key('taxonomies'), key(taxonomy.item._id)),
            }}
          />
        )),
      },
    })
  }

  const GroupPart = (props: {
    item: Items['groupPart']
    ctx: Ctx
    filter: Filter
    extra: TaxonomyGroupPartExtras<States, Items, RootNode>['groupPart']
  }) => {
    const { item, ctx, filter, extra } = props
    const { update } = useSetItemState('groupPart', extra.path, item)
    useItemState.groupPart({ filter, item, extra, update })

    const state = useTreeSelector(s => get<'CState'>()(extra.path, s.states.computed)?.item)
    const visible = isVisible(state)
    const hasBeenVisible = useHasBeenVisible(visible)
    if (!hasBeenVisible) return null

    return ctx.renderHideContainer({
      visible,
      ctx,
      children:
        state === undefined ? null : (
          <GroupPartContent item={item} ctx={ctx} filter={filter} extra={extra} state={state} />
        ),
    })
  }

  // ---- Taxonomy --------------------------------------------------------

  const TaxonomyContent = (props: {
    state: States['CState']
    item: Items['taxonomy']
    ctx: Ctx
    filter: Filter
    extra: TaxonomyGroupPartExtras<States, Items, RootNode>['taxonomy']
  }) => {
    const { state, item, ctx, filter, extra } = props
    const pathStr = subGroupPartId(extra.groupPart?._id ?? null, item._id)
    const { updateWithList, update } = useSetItemState('taxonomy', extra.path, item)

    useGroupParts(item, extra.groupPart ?? null, filter, (updater, list) =>
      updateWithList(updater, ['groupPart', pathStr, list]),
    )

    const groupParts = useTreeSelector(s => s.lists.groupPart[pathStr] ?? [])

    return ctx.renderItem.taxonomy({
      item: { item, type: 'taxonomy' },
      ctx,
      state,
      update,
      child: {
        groupParts: groupParts.map((groupPart: ListItems['groupPart']) => (
          <GroupPart
            key={groupPart._id}
            item={groupPart}
            ctx={ctx}
            filter={filter}
            extra={{
              path: concat(extra.path, key('child'), key('groupParts'), key(groupPart._id)),
            }}
          />
        )),
      },
    })
  }

  const Taxonomy = (props: {
    item: Items['taxonomy']
    ctx: Ctx
    filter: Filter
    extra: TaxonomyGroupPartExtras<States, Items, RootNode>['taxonomy']
  }) => {
    const { item, ctx, filter, extra } = props
    const { update } = useSetItemState('taxonomy', extra.path, item)
    useItemState.taxonomy({ filter, item, extra, update })

    const state = useTreeSelector(s => get<'CState'>()(extra.path, s.states.computed)?.item)
    const visible = isVisible(state)
    const hasBeenVisible = useHasBeenVisible(visible)
    if (!hasBeenVisible) return null

    return ctx.renderHideContainer({
      visible,
      ctx,
      children:
        state === undefined ? null : (
          <TaxonomyContent item={item} ctx={ctx} filter={filter} extra={extra} state={state} />
        ),
    })
  }

  return { GroupPart, Taxonomy }
}
