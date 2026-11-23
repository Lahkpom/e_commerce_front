import { apiRequest } from './api';
import type {
  AdminUserUpdateRequest,
  OperatorCreateRequest,
  UserResponse,
  UserRole,
  UserRowStatus,
  UserSegment,
  WholesalerCreateRequest,
} from '../types/auth';
import type { PageResponse } from '../types/products';

export interface AdminUserSearchParams {
  segment: UserSegment;
  roleFilter?: Extract<UserRole, 'CUSTOMER' | 'WHOLESALER' | 'OPERATOR'>;
  rowStatus?: Exclude<UserRowStatus, 'DELETED'>;
  search?: string;
  page?: number;
  size?: number;
}

export const searchAdminUsers = (
  params: AdminUserSearchParams,
): Promise<PageResponse<UserResponse>> => {
  const query = new URLSearchParams({
    segment: params.segment,
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  });
  if (params.roleFilter) query.set('roleFilter', params.roleFilter);
  if (params.rowStatus) query.set('rowStatus', params.rowStatus);
  if (params.search?.trim()) query.set('search', params.search.trim());

  return apiRequest<PageResponse<UserResponse>>(`/admin/users?${query.toString()}`);
};

export const createWholesalerAccount = (
  payload: WholesalerCreateRequest,
): Promise<UserResponse> =>
  apiRequest<UserResponse>('/auth/register/wholesalers', {
    method: 'POST',
    body: payload,
  });

export const createOperatorAccount = (
  payload: OperatorCreateRequest,
): Promise<UserResponse> =>
  apiRequest<UserResponse>('/auth/register/operators', {
    method: 'POST',
    body: payload,
  });

export const updateAdminUser = (
  userId: string,
  payload: AdminUserUpdateRequest,
): Promise<UserResponse> =>
  apiRequest<UserResponse>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: payload,
  });

export const updateAdminUserStatus = (
  userId: string,
  rowStatus: 'ACTIVE' | 'INACTIVE' | 'DELETED',
): Promise<UserResponse> =>
  apiRequest<UserResponse>(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: { rowStatus },
  });
