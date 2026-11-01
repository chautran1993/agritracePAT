import type { Plot } from '../types';
import { editFields } from '../editable';
import InlineField from './InlineField';
import { useI18n } from '../../../lib/i18n';
import { checkIngredient } from '../../../data/mrlLimits';
export default function EditableRecordPanel({
  plot,
  tab,
  save,
}: {
  plot: Plot;
  tab: string;
  save: (path: string, value: string) => Promise<void>;
}) {
  const { lang } = useI18n();
  const fields = editFields(plot, tab);
  if (!fields.length) return null;
  return (
    <details className="pp-card">
      <summary className="min-h-11 cursor-pointer font-semibold">
        {lang === 'vi' ? 'Chỉnh sửa thông tin' : 'Edit information'}
      </summary>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => (
          <InlineField
            key={f.path}
            label={f.label}
            value={f.value}
            validate={
              f.path.endsWith('activeIngredient') && plot.officialZoneCode!.code.endsWith('-USA')
                ? (value) =>
                    checkIngredient('USA', value)
                      ? ''
                      : lang === 'vi'
                        ? 'Hoạt chất chưa được cấu hình cho thị trường Hoa Kỳ; cần đối chiếu trước khi lưu.'
                        : 'Ingredient requires review for the United States market.'
                : undefined
            }
            onSave={(value) => save(f.path, value)}
          />
        ))}
      </dl>
    </details>
  );
}
