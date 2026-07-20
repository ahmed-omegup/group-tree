export * from './types'
export { makeTaxonomyGroupPartComponents } from './components'
export { makeGroupPartComputeFns } from './compute'
export { makeGroupPartTreeFns, subGroupPartId } from './tree-builder'
export const idToTaxonomyId = (id: string) => {
  const parts = id.split('_').filter((_, i) => i & 1)
  return parts.join('_')
}
