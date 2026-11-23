import { apiRequest } from './api';
import type { SpringPage } from '../types/sale';
import type {
  ReturnReason,
  ReturnStatus,
  SaleReturnInspectionRequest,
  SaleReturnRefundRequest,
  SaleReturnResponse,
  SaleReturnStatusUpdateRequest,
  SaleReturnSummaryResponse,
} from '../types/saleReturn';

export interface SearchAdminReturnsParams {
  returnStatus?: ReturnStatus;
  returnReason?: ReturnReason;
  customerEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const searchAdminReturns = (
  params: SearchAdminReturnsParams = {},
): Promise<SpringPage<SaleReturnSummaryResponse>> => {
  const query = new URLSearchParams();
  if (params.returnStatus) query.set('returnStatus', params.returnStatus);
  if (params.returnReason) query.set('returnReason', params.returnReason);
  if (params.customerEmail) query.set('customerEmail', params.customerEmail);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  const queryString = query.toString();
  return apiRequest<SpringPage<SaleReturnSummaryResponse>>(
    `/admin/returns${queryString ? `?${queryString}` : ''}`,
  );
};

export const getAdminReturnDetail = (returnId: string): Promise<SaleReturnResponse> =>
  apiRequest<SaleReturnResponse>(`/admin/returns/${encodeURIComponent(returnId)}`);

export const getAdminReturnsBySale = (saleId: string): Promise<SaleReturnResponse[]> =>
  apiRequest<SaleReturnResponse[]>(`/admin/returns/sales/${encodeURIComponent(saleId)}`);

export const updateAdminReturnStatus = (
  returnId: string,
  payload: SaleReturnStatusUpdateRequest,
): Promise<SaleReturnResponse> =>
  apiRequest<SaleReturnResponse>(`/admin/returns/${encodeURIComponent(returnId)}/status`, {
    method: 'PATCH',
    body: payload,
  });

export const inspectAdminReturn = (
  returnId: string,
  payload: SaleReturnInspectionRequest,
): Promise<SaleReturnResponse> =>
  apiRequest<SaleReturnResponse>(`/admin/returns/${encodeURIComponent(returnId)}/inspect`, {
    method: 'POST',
    body: payload,
  });

export const processAdminReturnRefund = (
  returnId: string,
  payload?: SaleReturnRefundRequest,
): Promise<SaleReturnResponse> =>
  apiRequest<SaleReturnResponse>(
    `/admin/returns/${encodeURIComponent(returnId)}/process-refund`,
    { method: 'POST', ...(payload ? { body: payload } : {}) },
  );
