import React, { useEffect, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useResetViewSettings } from '@/hooks/useResetSettings';
import { SettingsPanelPanelProp } from './SettingsDialog';
import { saveViewSettings } from '@/helpers/settings';
import { BoxedList } from './primitives';
import LayerToggle from '@/components/reader/LayerToggle';
import type { AnnotationLayer } from '@/types/book';

const LayersPanel: React.FC<SettingsPanelPanelProp> = ({ bookKey, onRegisterReset }) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { settings } = useSettingsStore();
  const { getViewSettings, setViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey) || settings.globalViewSettings;

  const [enabledLayers, setEnabledLayers] = useState<AnnotationLayer[]>(
    viewSettings.enabledLayers || ['user', 'author', 'hasiye', 'lugat'],
  );

  const resetToDefaults = useResetViewSettings();

  const handleReset = () => {
    resetToDefaults({
      enabledLayers: setEnabledLayers,
    });
  };

  useEffect(() => {
    onRegisterReset(handleReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleLayer = (layer: AnnotationLayer) => {
    const next = enabledLayers.includes(layer)
      ? enabledLayers.filter((l) => l !== layer)
      : [...enabledLayers, layer];

    setEnabledLayers(next);
    saveViewSettings(envConfig, bookKey, 'enabledLayers', next);

    // Also update current view settings in store to trigger effects
    if (viewSettings) {
      setViewSettings(bookKey, { ...viewSettings, enabledLayers: next });
    }
  };

  return (
    <div className='my-4 w-full space-y-6'>
      <BoxedList
        title={_('Display Layers')}
        description={_('Choose which types of content to display in the reader.')}
      >
        <div className='p-4'>
          <LayerToggle enabled={new Set(enabledLayers)} onToggle={handleToggleLayer} />
        </div>
      </BoxedList>

      <div className='px-4 text-xs text-base-content/50'>
        {_('Note: Some layers like Haşiye and Lügat require specific books or dictionary setup.')}
      </div>
    </div>
  );
};

export default LayersPanel;
