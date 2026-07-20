import { concat, key, root, useHasBeenVisible } from '../tree-common'
import type { Lens, SetItemData, StateKeys, StatesDomain, StoreCommonResult } from '../tree-common'
import type { CtxDom, SpacesNodes, SpaceArgs, SpacesItemsDomain, ListStateDom } from './types'
import type { SpaceItemKeys, SpacesListItem, SpacesTreeLevel } from './types'
import type { TaxonomyGroupPartComponents } from '../group-part/types'

export const makeSpaceComponents = <
  Filter,
  Items extends SpacesItemsDomain,
  States extends StatesDomain,
  ListState extends ListStateDom,
  Ctx,
>(
  storeResult: StoreCommonResult<
    States,
    SpaceItemKeys,
    SpacesTreeLevel,
    SpacesNodes<States>['root'],
    SpacesListItem<Items>
  >,
  args: SpaceArgs<Filter, Items, States>,
  subTree: TaxonomyGroupPartComponents<Filter, Items, States, Ctx, SpacesNodes<States>['root']>,
) => {
  const { useSetItemState, useTreeSelector } = storeResult
  const { useItemState, isVisible, useTaxonomies, useSpaces } = args
  const { Taxonomy } = subTree

  // ---- Space -----------------------------------------------------------

  const SpaceContent = (props: {
    state: States['CState']
    ctx: CtxDom<States, Items, ListState, Ctx>
    filter: Filter
    item: Items['space']
    path: Lens<StateKeys, SpacesNodes<States>['root'], SpacesNodes<States>['space']>
  }) => {
    const { ctx, filter, item, state, path } = props
    const { updateWithList, update } = useSetItemState('space', path, item)
    const ss: SetItemData<
      States,
      SpacesNodes<States>['space'],
      SpacesListItem<Items>['taxonomy']
    > = (updater, list) => {



        updateWithList(updater, ['taxonomy', item._id, list])
      }
    useTaxonomies(
      item,
     ss ,
      filter,
    )

    const taxonomies = useTreeSelector(s => s.lists.taxonomy[item._id] ?? [])

    return ctx.renderItem.space({
      item: { item, type: 'space' },
      ctx,
      state,
      update,
      child: {
        taxonomies: taxonomies.map(taxonomy => (
          <Taxonomy
            key={taxonomy.item._id}
            item={taxonomy.item}
            ctx={ctx}
            filter={filter}
            extra={{
              groupPart: null,
              taxonomy,
              path: concat(path, key('child'), key('taxonomies'), key(taxonomy.item._id)),
            }}
          />
        )),
      },
    })
  }

  const Space = (props: {
    ctx: CtxDom<States, Items, ListState, Ctx>
    filter: Filter
    item: Items['space']
  }) => {
    const { item, ctx, filter } = props
    const path: Lens<StateKeys, SpacesNodes<States>['root'], SpacesNodes<States>['space']> = concat(
      key('child'),
      key('spaces'),
      key(item._id),
    )
    const { update } = useSetItemState('space', path, item)
    useItemState.space({ filter, item, extra: {}, update })

    const state = useTreeSelector(s => s.states.computed.child.spaces[item._id]?.item)
    const visible = isVisible(state)
    const hasBeenVisible = useHasBeenVisible(visible)
    if (!hasBeenVisible) return null

    return ctx.renderHideContainer({
      visible,
      ctx,
      children:
        state === undefined ? null : (
          <SpaceContent item={item} ctx={ctx} filter={filter} state={state} path={path} />
        ),
    })
  }

  // ---- Spaces (root entry point) ----------------------------------------

  const Spaces = ({
    ctx,
    filter,
  }: {
    ctx: CtxDom<States, Items, ListState, Ctx>
    filter: Filter
  }) => {
    const { updateWithList } = useSetItemState('root', root(), undefined)
    useSpaces((updater, list) => updateWithList(updater, ['space', '', list]), filter)

    const state = useTreeSelector(s => ctx.getListState(s.states.computed.item))
    const spaces = useTreeSelector(s => s.lists.space[''] ?? [])

    return ctx.renderContainer({
      ctx,
      state,
      children: spaces.map(space => (
        <Space key={space._id} item={space} ctx={ctx} filter={filter} />
      )),
    })
  }

  return { Spaces }
}
