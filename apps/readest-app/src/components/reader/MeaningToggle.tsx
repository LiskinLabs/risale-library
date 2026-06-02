import React, { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { saveViewSettings } from '@/helpers/settings';
import { useEnv } from '@/context/EnvContext';

interface MeaningToggleProps {
  bookKey: string;
  className?: string;
}

/**
 * Anlam Açık Modu toggle — switches between open (inline definitions)
 * and closed (clean text) reading modes.
 */
const MeaningToggle: React.FC<MeaningToggleProps> = ({ bookKey, className }) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { getViewSettings } = useReaderStore();
  const { settings: generalSettings } = useSettingsStore();

  const viewSettings = getViewSettings(bookKey) || generalSettings.globalViewSettings;
  const isOpen = (viewSettings?.meaningDisplayMode || 'closed') === 'open';

  const handleToggle = useCallback(() => {
    const newMode = isOpen ? 'closed' : 'open';
    saveViewSettings(envConfig, bookKey, 'meaningDisplayMode', newMode);
    // Reload the book to apply the transformer change
    window.location.reload();
  }, [isOpen, envConfig, bookKey]);

  return (
    <button
      onClick={handleToggle}
      className={className}
      aria-label={_('Toggle Anlam Açık Modu')}
      title={isOpen ? _('Switch to clean text') : _('Show inline definitions')}
      data-setting-id='reader.meaningMode'
    >
      {isOpen ? (
        <span className='flex items-center gap-1'>
          <span className='text-primary'>📖</span>
          <span className='text-xs'>{_('Anlam: Açık')}</span>
        </span>
      ) : (
        <span className='flex items-center gap-1'>
          <span className='opacity-50'>📖</span>
          <span className='text-xs opacity-50'>{_('Anlam: Kapalı')}</span>
        </span>
      )}
    </button>
  );
};

export default MeaningToggle;
