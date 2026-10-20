import Dexie, { type EntityTable } from 'dexie'
import type {
  BudgetOverrideRecord,
  Category,
  CategoryMappingRecord,
  NetWorthSnapshotRecord,
  RetirementGoalRecord,
  SubscriptionCandidateRecord,
  TransactionRecord,
} from './schema'

export const db = new Dexie('finance-dashboard') as Dexie & {
  categories: EntityTable<Category, 'id'>
  budgetOverrides: EntityTable<BudgetOverrideRecord, 'id'>
  transactions: EntityTable<TransactionRecord, 'id'>
  netWorthSnapshots: EntityTable<NetWorthSnapshotRecord, 'id'>
  retirementGoals: EntityTable<RetirementGoalRecord, 'id'>
  subscriptionCandidates: EntityTable<SubscriptionCandidateRecord, 'id'>
  categoryMappings: EntityTable<CategoryMappingRecord, 'spendingCategory'>
}

db.version(1).stores({
  categories: 'id, name',
  budgetOverrides: 'id, categoryId, effectiveMonth',
  transactions: 'id, categoryId, date, kind, merchant',
  netWorthSnapshots: 'id, date',
  retirementGoals: 'id',
  subscriptionCandidates: 'id, merchantNormalized, status',
})

db.version(2).stores({
  transactions: 'id, categoryId, date, kind, merchant, importKey',
  categoryMappings: 'spendingCategory',
})
