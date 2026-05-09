import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

interface CellEditableProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  emptyPlaceholder?: string;
  className?: string;
}

export function CellEditable({
  value,
  onSave,
  placeholder = 'Click to edit',
  emptyPlaceholder = '—',
  className = '',
}: CellEditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === value) { setEditing(false); return; }
    if (!trimmed) { setDraft(value); setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        disabled={saving}
        placeholder={placeholder}
        className={`w-full min-w-[8rem] px-2 py-0.5 rounded border border-brand text-sm font-medium text-text-primary bg-card outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`group flex items-center gap-1.5 text-left hover:text-brand transition-colors ${className}`}
    >
      <span className={value ? 'font-medium text-text-primary' : 'text-text-muted italic'}>
        {value || emptyPlaceholder}
      </span>
      <FontAwesomeIcon
        icon={faPencil}
        className="w-2.5 h-2.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      />
    </button>
  );
}
