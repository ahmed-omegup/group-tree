type StrKeys<T> = string & keyof T
type Entry<T> = { [k in StrKeys<T>]: readonly [k, T[k]] }[StrKeys<T>]
interface ObjectConstructor {
  keys<T, _ = {}>(object?: T): StrKeys<T>[]
  entries<T, _ = {}>(object?: T): Entry<T>[]
  fromEntries<T, _ = {}>(entries: Entry<T>[]): Partial<T>
}
