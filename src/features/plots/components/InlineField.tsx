import { useState } from 'react';
import { useI18n } from '../../../lib/i18n';
import { number } from '../../../lib/format';
export default function InlineField({
  label,
  value,
  onSave,
  validate,
  displayValue,
}: {
  label: string;
  value: string | number;
  onSave: (value: string) => Promise<void>;
  validate?: (value: string) => string;
  displayValue?: string;
}) {
  const { lang } = useI18n();
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(String(value)),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function save() {
    if (busy) return;
    if (validate?.(draft)) {
      setError(validate(draft));
      return;
    }
    if (!draft.trim()) {
      setError('Vui lòng nhập giá trị');
      return;
    }
    if (draft === String(value)) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(typeof value === 'number' ? draft.trim().replace(',', '.') : draft.trim());
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd>
        {editing ? (
          <input
            aria-label={label}
            aria-invalid={!!error}
            ref={(element) => element?.focus()}
            disabled={busy}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(validate?.(e.target.value) || '');
            }}
            onBlur={() => void save()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save();
              if (e.key === 'Escape') {
                setEditing(false);
                setDraft(String(value));
              }
            }}
            className="min-h-11 w-full rounded border border-green-800 px-2 focus-visible:ring-2"
          />
        ) : (
          <button
            className="min-h-11 max-w-full break-words text-left font-semibold focus-visible:ring-2"
            aria-label={`${label}: ${value}`}
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
          >
            {displayValue ?? (typeof value === 'number' ? number(value, lang, 4) : value)}
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
      </dd>
    </div>
  );
}
