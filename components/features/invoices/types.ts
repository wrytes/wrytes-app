export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  userId: string;
  number: string;
  status: InvoiceStatus;
  recipientName: string;
  recipientEmail: string | null;
  recipientAddress: string | null;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  items: InvoiceItem[];
  subtotal: string;
  total: string;
  createdAt: string;
  updatedAt: string;
}
