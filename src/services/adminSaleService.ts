import { apiRequest } from './api';
import type {
  PaymentStatus,
  PaymentStatusUpdateRequest,
  SaleFiscalDataUpdateRequest,
  SaleInternalNoteRequest,
  SaleResponse,
  SaleStatus,
  SaleStatusUpdateRequest,
  SaleSummaryResponse,
  SpringPage,
} from '../types/sale';

export interface SearchAdminSalesParams {
  auditOnly?: boolean;
  statuses?: SaleStatus[];
  saleStatus?: SaleStatus;
  paymentStatus?: PaymentStatus;
  fiscalRejection?: boolean;
  customerEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const searchAdminSales = (
  params: SearchAdminSalesParams = {},
): Promise<SpringPage<SaleSummaryResponse>> => {
  const query = new URLSearchParams();
  if (params.auditOnly !== undefined) query.set('auditOnly', String(params.auditOnly));
  params.statuses?.forEach((status) => query.append('statuses', status));
  if (params.saleStatus) query.set('saleStatus', params.saleStatus);
  if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
  if (params.fiscalRejection !== undefined) query.set('fiscalRejection', String(params.fiscalRejection));
  if (params.customerEmail) query.set('customerEmail', params.customerEmail);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  const queryString = query.toString();

  return apiRequest<SpringPage<SaleSummaryResponse>>(
    `/admin/sales${queryString ? `?${queryString}` : ''}`,
  );
};

export const getAdminSaleDetail = (saleId: string): Promise<SaleResponse> =>
  apiRequest<SaleResponse>(`/admin/sales/${encodeURIComponent(saleId)}`);

export const updateAdminSaleStatus = (
  saleId: string,
  payload: SaleStatusUpdateRequest,
): Promise<SaleResponse> =>
  apiRequest<SaleResponse>(`/admin/sales/${encodeURIComponent(saleId)}/status`, {
    method: 'PATCH',
    body: payload,
  });

export const updateAdminPaymentStatus = (
  saleId: string,
  payload: PaymentStatusUpdateRequest,
): Promise<SaleResponse> =>
  apiRequest<SaleResponse>(`/admin/sales/${encodeURIComponent(saleId)}/payment-status`, {
    method: 'PATCH',
    body: payload,
  });

export const updateAdminSaleNotes = (
  saleId: string,
  payload: SaleInternalNoteRequest,
): Promise<SaleResponse> =>
  apiRequest<SaleResponse>(`/admin/sales/${encodeURIComponent(saleId)}/internal-notes`, {
    method: 'PATCH',
    body: payload,
  });

export const updateAdminSaleFiscalData = (
  saleId: string,
  payload: SaleFiscalDataUpdateRequest,
): Promise<SaleResponse> =>
  apiRequest<SaleResponse>(`/admin/sales/${encodeURIComponent(saleId)}/fiscal-data`, {
    method: 'PATCH',
    body: payload,
  });
