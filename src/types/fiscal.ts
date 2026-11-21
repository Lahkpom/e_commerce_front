export type FiscalReceiptType = 'FACTURA_C' | 'NOTA_DEBITO_C' | 'NOTA_CREDITO_C';

export interface FiscalReceiptResponse {
  fiscalReceiptId: string;
  saleId: string;
  returnId: string | null;
  receiptType: FiscalReceiptType;
  pointOfSale: number;
  receiptNumber: number;
  formattedReceiptNumber: string;
  cae: string;
  caeDueDate: string;
  issueDate: string;
  docType: number;
  docNumber: string;
  customerName: string;
  totalAmount: number;
  qrPayload: string;
  createdAt: string;
}
