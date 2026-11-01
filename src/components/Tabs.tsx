import { useRef, type ReactNode } from 'react';

export default function Tabs<T extends string>({
  id,
  label,
  items,
  active,
  onChange,
  children,
  className = '',
}: {
  id: string;
  label: string;
  items: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={ref} role="tablist" aria-label={label} className={`accessible-tabs ${className}`}>
        {items.map((item, index) => (
          <button
            key={item.id}
            id={`${id}-tab-${item.id}`}
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`${id}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            className={active === item.id ? 'active' : ''}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % items.length
                  : event.key === 'ArrowLeft'
                    ? (index + items.length - 1) % items.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? items.length - 1
                        : -1;
              if (next < 0) return;
              event.preventDefault();
              onChange(items[next].id);
              ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${id}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${item.id}`}
          hidden={active !== item.id}
          tabIndex={0}
        >
          {active === item.id ? children : null}
        </div>
      ))}
    </>
  );
}
