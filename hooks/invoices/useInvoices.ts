import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { showToast } from '@/components/ui';
import type { Invoice, InvoiceItem } from '@/components/features/invoices/types';

interface CreateInvoicePayload {
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  items: InvoiceItem[];
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Invoice[]>('/invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      showToast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (payload: CreateInvoicePayload): Promise<Invoice | null> => {
    try {
      const invoice = await apiRequest<Invoice>('/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setInvoices(prev => [invoice, ...prev]);
      showToast.success(`Invoice ${invoice.number} created`);
      return invoice;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to create invoice');
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, payload: Partial<CreateInvoicePayload>): Promise<boolean> => {
    try {
      const updated = await apiRequest<Invoice>(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      return true;
    } catch {
      showToast.error('Failed to update invoice');
      return false;
    }
  }, []);

  const send = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updated = await apiRequest<Invoice>(`/invoices/${id}/send`, { method: 'PATCH' });
      setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      showToast.success('Invoice marked as sent');
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to send invoice');
      return false;
    }
  }, []);

  const markPaid = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updated = await apiRequest<Invoice>(`/invoices/${id}/mark-paid`, { method: 'PATCH' });
      setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      showToast.success('Invoice marked as paid');
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to mark as paid');
      return false;
    }
  }, []);

  const cancel = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updated = await apiRequest<Invoice>(`/invoices/${id}/cancel`, { method: 'PATCH' });
      setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      showToast.success('Invoice cancelled');
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to cancel invoice');
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiRequest(`/invoices/${id}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      showToast.success('Invoice deleted');
      return true;
    } catch {
      showToast.error('Failed to delete invoice');
      return false;
    }
  }, []);

  return { invoices, loading, load, create, update, send, markPaid, cancel, remove };
}
