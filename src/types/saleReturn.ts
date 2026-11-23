export type ReturnReason =
  | 'ARREPENTIMIENTO_LEGAL'
  | 'CAMBIO_TALLE'
  | 'DEFECTO_FABRICACION';

export type ReturnResolution =
  | 'REEMBOLSO_DINERO'
  | 'CAMBIO_PRODUCTO'
  | 'CREDITO_TIENDA';

export type ReturnStatus =
  | 'SOLICITADA'
  | 'EN_TRANSITO'
  | 'RECIBIDO_EN_CONTROL'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CANCELADA';

export interface SaleReturnItemRequest {
  saleItemId: number;
  quantity: number;
}

export interface SaleReturnCreateRequest {
  returnReason: ReturnReason;
  returnResolution: ReturnResolution;
  customerNotes: string;
  items: SaleReturnItemRequest[];
}

export interface SaleReturnItemResponse {
  returnItemId: number;
  saleItemId: number;
  variantId: number | null;
  productName: string;
  variantDesc: string | null;
  variantSku: string | null;
  variantSize: NumericSize | null;
  colorName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  restockApproved: boolean | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface SaleReturnResponse {
  returnId: string;
  saleId: string;
  trackingToken: string;
  returnReason: ReturnReason;
  returnResolution: ReturnResolution;
  returnStatus: ReturnStatus;
  shippingCoveredByStore: boolean | null;
  returnShippingGuide: string | null;
  refundAmount: number | null;
  customerNotes: string;
  inspectionNotes: string | null;
  inspectionEvidencePath: string | null;
  inspectedBy: string | null;
  inspectedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  closedAt: string | null;
  items: SaleReturnItemResponse[];
}

export interface SaleReturnSummaryResponse {
  returnId: string;
  saleId: string;
  trackingToken: string;
  customerName: string;
  customerEmail: string;
  returnReason: ReturnReason;
  returnResolution: ReturnResolution;
  returnStatus: ReturnStatus;
  refundAmount: number | null;
  createdAt: string;
  closedAt: string | null;
}

export interface SaleReturnStatusUpdateRequest {
  newStatus: ReturnStatus;
  returnShippingGuide?: string;
  statusNotes?: string;
}

export interface SaleReturnItemInspectionRequest {
  returnItemId: number;
  restockApproved: boolean;
  rejectionReason?: string;
}

export interface SaleReturnInspectionRequest {
  inspectionNotes: string;
  inspectionEvidencePath?: string;
  inspectedItems: SaleReturnItemInspectionRequest[];
}

export interface SaleReturnRefundRequest {
  transactionReference?: string;
  notes?: string;
}
import type { NumericSize } from './products';
