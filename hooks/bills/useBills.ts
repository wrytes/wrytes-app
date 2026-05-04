import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api/client';
import { showToast } from '@/components/ui';
import type { Bill } from '@/components/features/Bills/types';

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Bill[]>('/bills');
      setBills(Array.isArray(data) ? data : []);
    } catch {
      showToast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pollUntilExtracted = useCallback((billId: string) => {
    const interval = setInterval(async () => {
      try {
        const updated = await apiRequest<Bill>(`/bills/${billId}`);
        setBills(prev => prev.map(b => (b.id === billId ? updated : b)));
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
    async (file: File): Promise<Bill | null> => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const bill = await apiRequest<Bill>('/bills', {
          method: 'POST',
          body: formData,
        });
        setBills(prev => [bill, ...prev]);
        pollUntilExtracted(bill.id);
        return bill;
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
        const updated = await apiRequest<Bill>(`/bills/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        setBills(prev => prev.map(b => (b.id === id ? updated : b)));
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
      const updated = await apiRequest<Bill>(`/bills/${id}/mark-paid`, {
        method: 'PATCH',
        body: JSON.stringify({ paidTxHash }),
      });
      setBills(prev => prev.map(b => (b.id === id ? updated : b)));
      showToast.success('Bill marked as paid');
      return true;
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to mark as paid');
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiRequest(`/bills/${id}`, { method: 'DELETE' });
      setBills(prev => prev.filter(b => b.id !== id));
      showToast.success('Bill deleted');
      return true;
    } catch {
      showToast.error('Failed to delete bill');
      return false;
    }
  }, []);

  return { bills, loading, load, upload, updateField, markPaid, remove };
}
