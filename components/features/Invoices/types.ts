export type InvoiceStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'FAILED';

export interface Invoice {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  status: InvoiceStatus;
  fromName: string | null;
  toName: string | null;
  amount: string | null;
  currency: string | null;
  reference: string | null;
  itemTags: string[];
  bankHolder: string | null;
  bankStreet: string | null;
  bankStreetNr: string | null;
  bankZip: string | null;
  bankCity: string | null;
  bankIban: string | null;
  safeAddress: string | null;
  paidTxHash: string | null;
  paidAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
