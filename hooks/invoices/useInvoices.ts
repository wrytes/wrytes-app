import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { showToast } from '@/components/ui';
import type { Invoice } from '@/components/features/Invoices/types';

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

  const pollUntilExtracted = useCallback((invoiceId: string) => {
    const interval = setInterval(async () => {
      try {
        const updated = await apiRequest<Invoice>(`/invoices/${invoiceId}`);
        setInvoices(prev =>
          prev.map(inv => (inv.id === invoiceId ? updated : inv)),
        );
        if (updated.status !== 'PENDING' && updated.status !== 'PROCESSING') {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 4000);

    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<Invoice | null> => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const invoice = await apiRequest<Invoice>('/invoices', {
          method: 'POST',
          body: formData,
        });
        setInvoices(prev => [invoice, ...prev]);
        pollUntilExtracted(invoice.id);
        return invoice;
      } catch (err: unknown) {
        const msg = (err as { message?: string }).message;
        showToast.error(msg || 'Upload failed');
        return null;
      }
    },
    [pollUntilExtracted],
  );

  const updateField = useCallback(
    async (id: string, data: { fromName?: string | null; amount?: string | null; currency?: string | null; itemTags?: string[] }): Promise<boolean> => {
      try {
        const updated = await apiRequest<Invoice>(`/invoices/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
        return true;
      } catch {
        showToast.error('Failed to save changes');
        return false;
      }
    },
    [],
  );

  const markPaid = useCallback(async (id: string, paidTxHash: string): Promise<boolean> => {
    try {
      const updated = await apiRequest<Invoice>(`/invoices/${id}/mark-paid`, {
        method: 'PATCH',
        body: JSON.stringify({ paidTxHash }),
      });
      setInvoices(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      showToast.success('Invoice marked as paid');
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to mark as paid');
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

  return { invoices, loading, load, upload, updateField, markPaid, remove };
}
