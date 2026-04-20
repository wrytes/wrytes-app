import { useRef, useState, useCallback } from 'react';
import { faCloudArrowUp, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonInput } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png,.webp,.gif';
const MAX_MB = 10;

interface Props {
  onUpload: (files: File[]) => Promise<unknown>;
}

export default function InvoiceUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return `${file.name}: unsupported type.`;
    if (file.size > MAX_MB * 1024 * 1024) return `${file.name}: exceeds ${MAX_MB} MB.`;
    return null;
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      const errs: string[] = [];
      const valid: File[] = [];
      for (const f of files) {
        const err = validate(f);
        if (err) errs.push(err);
        else valid.push(f);
      }
      setErrors(errs);
      if (valid.length === 0) return;
      setUploading(true);
      await onUpload(valid);
      setUploading(false);
    },
    [onUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) handleFiles(files);
    },
    [handleFiles],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-4 transition-colors',
        dragging ? 'border-brand bg-brand/5' : 'border-input-border bg-surface',
      )}
    >
      <FontAwesomeIcon
        icon={faCloudArrowUp}
        className={cn('text-3xl transition-colors', dragging ? 'text-brand' : 'text-text-muted')}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          Drag & drop invoices here
        </p>
        <p className="text-xs text-text-muted mt-1">PDF, JPEG, PNG, WEBP — max {MAX_MB} MB each</p>
      </div>

      {errors.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {errors.map(e => (
            <li key={e} className="text-xs text-error">{e}</li>
          ))}
        </ul>
      )}

      <ButtonInput
        label={uploading ? 'Uploading…' : 'Choose files'}
        variant="outline"
        size="sm"
        loading={uploading}
        disabled={uploading}
        icon={<FontAwesomeIcon icon={faFileInvoice} />}
        onClick={() => inputRef.current?.click()}
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
