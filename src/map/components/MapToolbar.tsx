import { Crosshair, Ruler, SquareDashedMousePointer, ScanSearch } from 'lucide-react';
import { useMapText } from '../i18n';
export type Tool = 'coord' | 'length' | 'area' | 'searchArea' | null;
export default function MapToolbar({ tool, setTool }: { tool: Tool; setTool: (t: Tool) => void }) {
  const { t } = useMapText();
  return (
    <div className="gis-glass gis-toolbar">
      {(
        [
          ['coord', Crosshair],
          ['length', Ruler],
          ['area', SquareDashedMousePointer],
          ['searchArea', ScanSearch],
        ] as const
      ).map(([key, Icon]) => (
        <button
          aria-label={t[key]}
          aria-pressed={tool === key}
          title={t[key]}
          key={key}
          className={tool === key ? 'active' : ''}
          onClick={() => setTool(tool === key ? null : key)}
        >
          <Icon size={16} />
          <span>{t[key]}</span>
        </button>
      ))}
    </div>
  );
}
