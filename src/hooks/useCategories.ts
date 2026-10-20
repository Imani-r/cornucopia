import { useLiveQuery } from 'dexie-react-hooks'
import { listCategories } from '../db/repositories/categoryRepo'
import type { Category } from '../db/schema'

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => listCategories(), [])
}
