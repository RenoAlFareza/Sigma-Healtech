export { apiFetch, ApiError } from './client';
export type { ApiRequestOptions } from './client';
export { setSession, getSession, clearSession } from './session';
export type { Session } from './session';
export { login, getAuthContext, logout } from './auth';
export type { LoginResponse, AuthContext } from './auth';
export type { User, Role, Location, Product } from '@/api/_fixtures/types';
export type { MenuItem } from '@/shared/config/menu';