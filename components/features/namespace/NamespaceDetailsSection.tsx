import React, { useEffect, useState } from 'react';
import { TextInput } from '@/components/ui/input';
import { Card, CardTitle, showToast } from '@/components/ui';
import { apiRequest } from '@/lib/api/client';
import type { Namespace } from '@/lib/auth/types';

interface Props {
  namespace: Namespace;
  isOwner: boolean;
  saveRef?: React.MutableRefObject<(() => void) | null>;
  onSavingChange?: (saving: boolean) => void;
  onSaved?: () => void;
}

export default function NamespaceDetailsSection({
  namespace,
  isOwner,
  saveRef,
  onSavingChange,
  onSaved,
}: Props) {
  const [name, setName] = useState(namespace.name);

  useEffect(() => {
    setName(namespace.name);
  }, [namespace.name]);

  const handleSave = async () => {
    if (!name.trim()) return;
    onSavingChange?.(true);
    try {
      await apiRequest(`/namespaces/${namespace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      showToast.success('Namespace updated');
      onSaved?.();
    } catch {
      showToast.error('Failed to update namespace');
    } finally {
      onSavingChange?.(false);
    }
  };

  if (saveRef) saveRef.current = handleSave;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardTitle title="Details" />
        <div className="space-y-3">
          <TextInput
            label="Name"
            value={name}
            onChange={setName}
            placeholder="My Namespace"
            disabled={!isOwner}
          />
          {namespace.telegramGroupId && (
            <TextInput
              label="Telegram Group ID"
              value={namespace.telegramGroupId}
              onChange={() => {}}
              disabled
              note="Linked via bot — cannot be changed here"
            />
          )}
        </div>
      </Card>

      <Card>
        <CardTitle title="Info" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">ID</span>
            <span className="font-mono text-text-primary text-xs break-all text-right max-w-[60%]">
              {namespace.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Your role</span>
            <span className="text-text-primary font-medium">{namespace.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Members</span>
            <span className="text-text-primary">{namespace.members.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Created</span>
            <span className="text-text-primary">
              {new Date(namespace.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
