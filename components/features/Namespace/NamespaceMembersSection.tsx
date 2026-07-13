import { useState } from 'react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, ConfirmModal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { Namespace, NamespaceMember } from '@/lib/auth/types';

const MEMBER_HEADERS = ['Member', 'Role', ''];

interface Props {
  namespace: Namespace;
  currentUserId: string;
  isOwner: boolean;
  onRemoved?: () => void;
}

export default function NamespaceMembersSection({
  namespace,
  currentUserId,
  isOwner,
  onRemoved,
}: Props) {
  const [removeTarget, setRemoveTarget] = useState<NamespaceMember | null>(null);
  const { sortTab, sortReverse, handleSort } = useSort('Member');

  const sorted = [...namespace.members].sort((a, b) => {
    const m = sortReverse ? -1 : 1;
    if (sortTab === 'Role') return m * a.role.localeCompare(b.role);
    const aHandle = a.user.telegramHandle ?? a.userId;
    const bHandle = b.user.telegramHandle ?? b.userId;
    return m * aHandle.localeCompare(bHandle);
  });

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await apiRequest(`/namespaces/${namespace.id}/members/${removeTarget.userId}`, {
        method: 'DELETE',
      });
      showToast.success('Member removed');
      setRemoveTarget(null);
      onRemoved?.();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to remove member');
    }
  };

  const displayName = (m: NamespaceMember) =>
    m.user.telegramHandle ? `@${m.user.telegramHandle}` : m.userId;

  return (
    <>
      <Table>
        <TableHead
          headers={MEMBER_HEADERS}
          colSpan={MEMBER_HEADERS.length}
          tab={sortTab}
          reverse={sortReverse}
          tabOnChange={handleSort}
        />
        <TableBody>
          {sorted.length === 0 ? (
            <TableRowEmpty>No members found.</TableRowEmpty>
          ) : (
            sorted.map(m => (
              <TableRow
                key={m.userId}
                headers={MEMBER_HEADERS}
                colSpan={MEMBER_HEADERS.length}
                tab={sortTab}
              >
                <div className="text-left text-sm text-text-primary">{displayName(m)}</div>
                <div className="flex justify-end">
                  <Badge
                    text={m.role}
                    variant="custom"
                    customColor={m.role === 'OWNER' ? 'text-brand' : 'text-text-secondary'}
                    customBgColor={m.role === 'OWNER' ? 'bg-brand/10' : 'bg-surface'}
                    size="sm"
                  />
                </div>
                <div className="flex justify-end">
                  {isOwner && m.userId !== currentUserId && (
                    <button
                      onClick={() => setRemoveTarget(m)}
                      className="text-xs text-error hover:text-error transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      Remove
                    </button>
                  )}
                </div>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Member"
        message={
          <span>
            Remove <strong>{removeTarget ? displayName(removeTarget) : ''}</strong> from this
            namespace?
          </span>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleRemove}
      />
    </>
  );
}
