import { useI18n } from '../lib/i18n';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function ModalDrawer({
  open,
  onClose,
  title,
  id,
  className = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Native modal dialog handles backdrop clicks and the keyboard focus loop.
    <dialog
      ref={ref}
      id={id}
      aria-label={title}
      className={`modal-drawer ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const items = Array.from(
          ref.current!.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex="0"]',
          ),
        ).filter((item) => !item.hasAttribute('disabled') && item.getClientRects().length);
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b p-4">
          <h2 className="font-bold text-rice-900">{title}</h2>
          <button onClick={onClose} aria-label={t.close} className="rounded-lg p-2">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
