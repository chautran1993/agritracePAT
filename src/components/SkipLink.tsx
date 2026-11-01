import { useI18n } from '../lib/i18n';

export default function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#main-content" className="skip-link">
      {t.skipContent}
    </a>
  );
}
