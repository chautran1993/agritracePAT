import { useEffect, useRef, useState, type ReactNode } from 'react';
export default function HeaderPopover({
  id,
  label,
  trigger,
  children,
}: {
  id: string;
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false),
    root = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={button}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg p-2 text-slate-700"
      >
        {trigger}
      </button>
      {open && (
        <section
          id={id}
          aria-label={label}
          className="fixed left-4 right-4 top-[72px] z-50 max-h-[calc(100dvh-96px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96"
        >
          {children(() => setOpen(false))}
        </section>
      )}
    </div>
  );
}
