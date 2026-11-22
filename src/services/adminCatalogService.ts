import { apiRequest } from './api';
import type {
  AdminProductRequest,
  AdminProductResponse,
  AdminProductSearchFilters,
  AdminVariantResponse,
  AdminVariantSearchFilters,
  ColorRequest,
  ColorResponse,
  PageResponse,
  ProductOption,
  RowStatus,
  VariantCreateRequest,
  VariantUpdateRequest,
} from '../types/products';

const withQuery = (path: string, params: URLSearchParams): string =>
  params.size > 0 ? `${path}?${params.toString()}` : path;

export const getAdminColors = (): Promise<ColorResponse[]> =>
  apiRequest<ColorResponse[]>('/colors?includeInactive=true');

export const createColor = (payload: ColorRequest): Promise<ColorResponse> =>
  apiRequest<ColorResponse>('/admin/colors', { method: 'POST', body: payload });

export const updateColor = (id: number, payload: ColorRequest): Promise<ColorResponse> =>
  apiRequest<ColorResponse>(`/admin/colors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });

export const updateColorStatus = (id: number, rowStatus: RowStatus): Promise<ColorResponse> =>
  apiRequest<ColorResponse>(`/admin/colors/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { rowStatus },
  });

export const searchAdminProducts = (
  filters: AdminProductSearchFilters = {},
): Promise<PageResponse<AdminProductResponse>> => {
  const params = new URLSearchParams({
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 20),
  });
  if (filters.targetGender) params.set('targetGender', filters.targetGender);
  if (filters.rowStatus) params.set('rowStatus', filters.rowStatus);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  return apiRequest<PageResponse<AdminProductResponse>>(withQuery('/admin/products', params));
};

export const getAdminProducts = (
  filters: AdminProductSearchFilters = {},
): Promise<PageResponse<AdminProductResponse>> => searchAdminProducts(filters);

export const getActiveProductOptions = (): Promise<ProductOption[]> =>
  apiRequest<ProductOption[]>('/admin/products/options');

export const createAdminProduct = (payload: AdminProductRequest): Promise<AdminProductResponse> =>
  apiRequest<AdminProductResponse>('/admin/products', { method: 'POST', body: payload });

export const updateAdminProduct = (
  id: string,
  payload: AdminProductRequest,
): Promise<AdminProductResponse> =>
  apiRequest<AdminProductResponse>(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });

export const updateAdminProductStatus = (
  id: string,
  rowStatus: RowStatus,
): Promise<AdminProductResponse> =>
  apiRequest<AdminProductResponse>(`/admin/products/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { rowStatus },
  });

export const searchAdminVariants = (
  filters: AdminVariantSearchFilters,
): Promise<PageResponse<AdminVariantResponse>> => {
  const params = new URLSearchParams();
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.colorId !== undefined) params.set('colorId', String(filters.colorId));
  if (filters.size) params.set('size', filters.size);
  if (filters.rowStatus) params.set('rowStatus', filters.rowStatus);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.page !== undefined) params.set('page', String(filters.page));
  return apiRequest<PageResponse<AdminVariantResponse>>(withQuery('/variants', params));
};

export const createVariant = (payload: VariantCreateRequest): Promise<AdminVariantResponse> =>
  apiRequest<AdminVariantResponse>('/variants', { method: 'POST', body: payload });

export const updateVariant = (
  id: number,
  payload: VariantUpdateRequest,
): Promise<AdminVariantResponse> =>
  apiRequest<AdminVariantResponse>(`/variants/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });

export const updateVariantStatus = (id: number, rowStatus: RowStatus): Promise<AdminVariantResponse> =>
  apiRequest<AdminVariantResponse>(`/variants/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { rowStatus },
  });
