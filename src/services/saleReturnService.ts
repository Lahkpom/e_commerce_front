import { apiRequest } from './api';
import type { SpringPage } from '../types/sale';
import type {
  SaleReturnCreateRequest,
  SaleReturnResponse,
  SaleReturnSummaryResponse,
} from '../types/saleReturn';

export const getMyReturns = (
  page = 0,
  size = 15,
): Promise<SpringPage<SaleReturnSummaryResponse>> =>
  apiRequest<SpringPage<SaleReturnSummaryResponse>>(
    `/returns/me?page=${page}&size=${size}`,
  );

export const getReturnsByOrder = (saleId: string): Promise<SaleReturnResponse[]> =>
  apiRequest<SaleReturnResponse[]>(`/returns/orders/${encodeURIComponent(saleId)}`);

export const createReturnForOrder = (
  saleId: string,
  payload: SaleReturnCreateRequest,
): Promise<SaleReturnResponse> =>
  apiRequest<SaleReturnResponse>(`/returns/orders/${encodeURIComponent(saleId)}`, {
    method: 'POST',
    body: payload,
  });
