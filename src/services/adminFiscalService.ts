import { apiRequest } from './api';
import type { FiscalReceiptResponse } from '../types/fiscal';

export const getFiscalReceiptsBySale = (saleId: string): Promise<FiscalReceiptResponse[]> =>
  apiRequest<FiscalReceiptResponse[]>(
    `/admin/fiscal/sales/${encodeURIComponent(saleId)}`,
  );

export const retryRejectedInvoice = (saleId: string): Promise<FiscalReceiptResponse> =>
  apiRequest<FiscalReceiptResponse>(
    `/admin/fiscal/sales/${encodeURIComponent(saleId)}/retry-invoice`,
    { method: 'POST' },
  );
