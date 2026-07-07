type s = keyof any
type Rec<K extends s> = Record<K, unknown>

export type Lens<in K extends s, A extends Rec<K>, B extends Rec<K>> = {
  get?: <P extends K>(a: A[P]) => B[P]
  set?: <P extends K>(a: A[P], v: B[P]) => A[P]
  path: string[]
}

export const pop = <
  K extends s,
  A extends Rec<K>,
  B extends Rec<K>,
  Field extends string & keyof B[K],
>(
  lens: Lens<K, A, { [P in K]: B[P][Field] }>,
): [Lens<K, A, B>, Field] => [
  {
    path: lens.path.slice(0, -1),
  },
  lens.path.at(-1)! as Field,
]

export const root: <K extends s, A extends Rec<K>>() => Lens<K, A, A> = () => ({
  path: [],
})

export const get =
  <P extends s>() =>
  <K extends s, A extends Rec<K | P>, B extends Rec<K | P>>(
    { path }: Lens<K | P, A, B>,
    a: A[P],
  ): B[P] | undefined => {
    return path.reduce((acc, key) => acc?.[key], a as any)
  }

export const set = <P extends s>() => {
  const set = <K extends s, A extends Rec<K | P>, B extends Rec<K | P>>(
    { path }: Lens<K | P, A, B>,
    a: A[P],
    v: B[P],
  ): A[P] => {
    const [key, ...rest] = path
    if (key === undefined) return v as {} as A[P]
    return {
      ...a!,
      [key]: set({ path: rest }, (a as any)[key], v),
    }
  }
  return set
}
export const key = <K extends s, A extends Rec<K>, Field extends string & keyof A[K]>(
  key: Field,
): Lens<K, A, { [P in K]: A[P][Field] }> => ({ path: [key] })

export const up =
  <K extends s, P extends K>() =>
  <A extends Rec<K>, B extends Rec<K>>(lens: Lens<K, A, B>): Lens<P, A, B> =>
    lens

export const concat: {
  <K extends s, A extends Rec<K>, B extends Rec<K>, C extends Rec<K>>(
    ab: Lens<K, A, B>,
    bc: Lens<K, B, C>,
  ): Lens<K, A, C>
  <K extends s, A extends Rec<K>, B extends Rec<K>, C extends Rec<K>, D extends Rec<K>>(
    ab: Lens<K, A, B>,
    bc: Lens<K, B, C>,
    cd: Lens<K, C, D>,
  ): Lens<K, A, D>
  <
    K extends s,
    A extends Rec<K>,
    B extends Rec<K>,
    C extends Rec<K>,
    D extends Rec<K>,
    E extends Rec<K>,
  >(
    ab: Lens<K, A, B>,
    bc: Lens<K, B, C>,
    cd: Lens<K, C, D>,
    de: Lens<K, D, E>,
  ): Lens<K, A, E>
} = <K extends s>(...lenses: Lens<K, Rec<K>, Rec<K>>[]) => ({ path: lenses.flatMap(l => l.path) })
