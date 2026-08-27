/**
 * Report aggregation. The logic lives in shared/lib/reportAggregates (leaf) —
 * this module re-exports it for migration compatibility. New code should import
 * from `@/shared/lib/reportAggregates` directly.
 */
export {
  computeReport,
  type ReportType,
  type ReportParams,
  type ExpiryRow,
  type StockoutRow,
  type SummaryRow,
  type TransactionRow,
  type ReportData,
} from '@/shared/lib/reportAggregates';
