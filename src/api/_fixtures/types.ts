/**
 * Backend-mock fixture types.
 * Re-exports domain types from shared (leaf layer) per FSD — fixtures depend on shared,
 * never the reverse.
 */
export type { Role, User, Location, Product } from '@/shared/types/domain';