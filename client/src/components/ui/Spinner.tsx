// Global Spinner Component
import { useTranslation } from 'react-i18next';

export default function Spinner() {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay">
      <div className="spinner-container">
        <div className="spinner-ring" />
        <p className="text-body font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
}
