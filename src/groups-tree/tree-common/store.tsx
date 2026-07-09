import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { get, set, type Lens } from '../path'
import type { ExternalBrand, ListItemDomain, Lists, NodeLayerDomain, SomeListOf } from './types'
import type { StateKeys, StatesDomain, StoreArgs, Update, UpdateState } from './types'
import type { InternalUpdater } from './types'
import type { StoreResult, TreeProviderArgs, StoreState, StateContext } from './store-types'
import type { UseSetItemState, UseTreeSelector } from './store-types'

// ---- List helpers ---------------------------------------------------------

// ---- Factory --------------------------------------------------------------

/**
 * Creates the store context, hooks and TreeProvider for a given set of
 * generic parameters.  Must be called once per HOC instantiation.
 */
export const makeStoreFns = <
  States extends StatesDomain,
  ItemKeys extends string,
  External extends ExternalBrand,
  Levels extends string,
  RootNode extends NodeLayerDomain<States, Levels>,
  ListItems extends ListItemDomain<ItemKeys>,
  Context extends null | { brand: 'context' },
>(
  args: StoreArgs<States, ItemKeys, External, RootNode, ListItems, Context>,
): StoreResult<States, ItemKeys, External, Levels, RootNode, ListItems, Context> => {
  const {
    compute,
    listsToInternalState,
    extern,
    expand,
    initialRootState,
    initialLists,
    initialData,
  } = args
  type ThisLists = Lists<ItemKeys, ListItems>
  type ThisStoreState = StoreState<States, ItemKeys, RootNode, ListItems>
  type Internal = { lists: ThisLists; state: RootNode['IState']; data: States['IData'] }
  type Action<ChildNode extends Record<StateKeys, unknown>> = {
    path: Lens<StateKeys, RootNode, ChildNode>
    node: ChildNode['IState']
    data: States['IData']
    list?: SomeListOf<ItemKeys, ListItems>
  }
  type SomeList = SomeListOf<ItemKeys, ListItems>

  // ---- Reducer -----------------------------------------------------------

  const treeUpdateReducer = <ChildNode extends Record<StateKeys, unknown>>(
    { lists, states }: ThisStoreState,
    action: Action<ChildNode>,
    context: Context,
  ): Internal => {
    const { path, node, list, data } = action

    if (list) {
      const [key, listPath, items] = list
      lists = {
        ...lists,
        [key]: {
          ...lists[key],
          [listPath]: items,
        },
      }
    }

    const updatedInternal = set<'IState'>()(path, states.internal, node)
    const adaptedToNewLists = listsToInternalState(updatedInternal, states.computed, lists, context)
    return { lists, state: adaptedToNewLists, data }
  }

  // ---- Context -----------------------------------------------------------

  type ThisStateContext = StateContext<States, ItemKeys, External, RootNode, ListItems, Context>

  const TreeStoreContext = createContext<ThisStateContext | null>(null)

  const useTreeContext = () => {
    const value = useContext(TreeStoreContext)
    if (!value) throw new Error('useTreeSelector must be used within a TreeProvider')
    return value
  }

  const useTreeSelector: UseTreeSelector<States, RootNode, ItemKeys, ListItems> = selector =>
    selector(useTreeContext().state)

  const useStore = () => {
    const { dispatch, state, changeRef } = useTreeContext()
    return {
      dispatch,
      snapshot: () => state.states,
      getData: () => state.data,
      getLists: () => state.lists,
      onChange: (v: External) => changeRef.current?.(v),
    }
  }

  // ---- useSetItemState hook ----------------------------------------------

  const useSetItemState: UseSetItemState<States, ItemKeys, Levels, RootNode, ListItems> = <
    L extends Levels,
    NodeL extends NodeLayerDomain<States, L>,
  >(
    level: L,
    path: Lens<StateKeys, RootNode, NodeL>,
    item: unknown,
  ) => {
    const { dispatch, snapshot, getData, onChange, getLists } = useStore()

    const consumeUpdater = <T, V>(
      updater: (args: UpdateState<States, NodeL>) => [T, V],
      states: ThisStoreState['states'],
      data: {
        internal: States['IData']
        external: States['EData']
      },
    ) => {
      const internal = get<'IState'>()(path, states.internal)
      const external = get<'EState'>()(path, states.external)
      const computed = get<'CState'>()(path, states.computed)

      if (!internal || !external || !computed) {
        console.error('Trying to set state of an item that is not in the tree', { item, path })
        return undefined
      }

      const [node, v] = updater({ state: { computed, external, internal }, data })
      return { node, data: v, states }
    }

    const internalUpdate = (updater: InternalUpdater<States, NodeL>, list?: SomeList) =>
      dispatch(({ states, data }: ThisStoreState) => {
        const result = consumeUpdater(updater, states, data)
        if (!result) return null!
        return { path, list, node: result.node, data: result.data }
      })

    const externalUpdate: Update<States, NodeL>['external'] = updater => {
      const result = consumeUpdater(updater, snapshot(), getData())
      if (!result) return
      const { node, data: newExternalData, states } = result
      const newExternalState = set<'EState'>()(path, states.external, node)
      const computed = compute(
        { state: states.internal, data: getData().internal, lists: getLists() },
        { state: newExternalState, data: newExternalData },
      )
      onChange(extern(computed, newExternalData))
    }

    return {
      update: {
        internal: (updater: InternalUpdater<States, NodeL>) => internalUpdate(updater),
        external: externalUpdate,
      },
      updateWithList: (updater: InternalUpdater<States, NodeL>, list) =>
        internalUpdate(updater, list),
    }
  }

  // ---- TreeProvider ------------------------------------------------------

  const TreeProvider = (props: TreeProviderArgs<External, Context>) => {
    const { children, value, onChange, context } = props
    const [internal, setInternal] = useState<Internal & { v: number }>(() => ({
      data: initialData,
      state: initialRootState(context),
      lists: initialLists,
      v: 0,
    }))

    const changeRef = useRef(onChange)
    useEffect(() => {
      changeRef.current = onChange
    })

    const internalToState = useCallback(
      (x: Internal): ThisStoreState => {
        const [externalState, externalData] = expand(value, x.state, x.data)
        const computed = compute(x, { state: externalState, data: externalData })
        return {
          states: { computed, external: externalState, internal: x.state },
          data: { internal: x.data, external: externalData },
          lists: x.lists,
        }
      },
      [value],
    )

    const state = useMemo(() => internalToState(internal), [internalToState, internal])
    const dispatch = useCallback(
      <ChildNode extends Record<StateKeys, unknown>>(
        action: (state: ThisStoreState) => Action<ChildNode> | undefined,
      ) => {
        setInternal(internal => {
          const state = internalToState(internal)
          const actionValue = action(state)
          if (!actionValue) {
            console.warn('Action did not return an update, skipping state change', {
              state,
            })
            return internal
          }
          const newState = treeUpdateReducer(state, actionValue, context)
          return { ...newState, v: internal.v + 1 }
        })
      },
      [internalToState],
    )

    const store = useMemo(() => {
      return { changeRef, state, dispatch, context }
    }, [state, dispatch, changeRef, context])

    return <TreeStoreContext.Provider value={store}>{children}</TreeStoreContext.Provider>
  }

  return { TreeProvider, useTreeSelector, useSetItemState, useTreeContext }
}
