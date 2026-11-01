import { useI18n } from '../lib/i18n';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function TableScroll({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const element = ref.current!;
    const update = () =>
      setEdges({
        left: element.scrollLeft > 1,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, []);
  return (
    <div className="table-scroll-frame" data-left={edges.left} data-right={edges.right}>
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- A named scroll region must be focusable for keyboard horizontal scrolling. */}
      <div ref={ref} className="table-scroll" tabIndex={0} role="region" aria-label={t.scrollTable}>
        {children}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </div>
  );
}
