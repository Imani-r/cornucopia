import { db } from '../db'
import type { Category } from '../schema'

export async function listCategories(): Promise<Category[]> {
  const all = await db.categories.toArray()
  return all.filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCategory(input: { name: string; color?: string }): Promise<Category> {
  const category: Category = {
    id: crypto.randomUUID(),
    name: input.name,
    color: input.color,
    archived: false,
    createdAt: new Date().toISOString(),
  }
  await db.categories.add(category)
  return category
}

export async function archiveCategory(id: string): Promise<void> {
  await db.categories.update(id, { archived: true })
}
