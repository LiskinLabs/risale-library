'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RiFontSize, RiArrowRightSLine } from 'react-icons/ri';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { saveViewSettings } from '@/helpers/settings';
import Button from '@/components/Button';

interface FontQuickPopoverProps {
  bookKey: string;
}

/**
 * Quick-access font popover in the reader header.
 * Gives instant access to the 3 most-used font settings without
 * opening the full SettingsDialog. Deep-links to Font panel for more.
 */
const FontQuickPopover: React.FC<FontQuickPopoverProps> = ({ bookKey }) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { getViewSettings } = useReaderStore();
  const { setHoveredBookKey } = useReaderStore();
  const { setSettingsDialogBookKey, setSettingsDialogOpen, setRequestedPanel } = useSettingsStore();
  const viewSettings = getViewSettings(bookKey);

  const [fontSize, setFontSize] = useState(viewSettings?.defaultFontSize ?? 18);
  const [lineHeight, setLineSpacing] = useState(viewSettings?.lineHeight ?? 1.4);
  const [latinFont, setLatinFont] = useState(viewSettings?.latinFont ?? '');
  const [cyrillicFont, setCyrillicFont] = useState(viewSettings?.cyrillicFont ?? '');
  const [arabicFont, setArabicFont] = useState(viewSettings?.arabicFont ?? '');

  useEffect(() => {
    setFontSize(viewSettings?.defaultFontSize ?? 18);
    setLineSpacing(viewSettings?.lineHeight ?? 1.4);
    setLatinFont(viewSettings?.latinFont ?? '');
    setCyrillicFont(viewSettings?.cyrillicFont ?? '');
    setArabicFont(viewSettings?.arabicFont ?? '');
  }, [viewSettings]);

  const handleFontSizeChange = useCallback(
    (value: number) => {
      setFontSize(value);
      saveViewSettings(envConfig, bookKey, 'defaultFontSize', value);
      if (viewSettings) viewSettings.defaultFontSize = value;
    },
    [envConfig, bookKey, viewSettings],
  );

  const handleLineSpacingChange = useCallback(
    (value: number) => {
      setLineSpacing(value);
      saveViewSettings(envConfig, bookKey, 'lineHeight', value);
      if (viewSettings) viewSettings.lineHeight = value;
    },
    [envConfig, bookKey, viewSettings],
  );

  const handleMoreSettings = () => {
    setHoveredBookKey('');
    setSettingsDialogBookKey(bookKey);
    setRequestedPanel('Font'); // deep-link to Font tab
    setSettingsDialogOpen(true);
  };

  // Available font family options (mirrors FontPanel's built-in faces)
  const latinOptions = [
    { value: '', label: _('Default') },
    { value: 'ITC Souvenir', label: 'ITC Souvenir' },
    { value: 'Minion Pro', label: 'Minion Pro' },
    { value: 'Georgia', label: 'Georgia' },
  ];
  const cyrillicOptions = [
    { value: '', label: _('Default') },
    { value: 'Kazimir Text', label: 'Kazimir Text' },
  ];
  const arabicOptions = [
    { value: '', label: _('Default') },
    { value: 'Nassim Arabic Pro', label: 'Nassim Arabic Pro' },
  ];

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <Button
        icon={<RiFontSize className='text-base-content' />}
        onClick={() => {}}
        label={_('Font & Layout')}
      />

      <div
        tabIndex={0}
        role='menu'
        className='dropdown-content menu-container z-30 mt-2 w-72 rounded-box border-0 bg-base-100 p-4 shadow-2xl'
      >
        {/* ── Font Size ── */}
        <div className='mb-4'>
          <div className='mb-1 flex items-center justify-between'>
            <span className='text-xs font-medium opacity-70'>{_('Font Size')}</span>
            <span className='text-xs font-bold tabular-nums'>{fontSize}px</span>
          </div>
          <input
            type='range'
            min={10}
            max={48}
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className='range range-xs range-primary w-full'
            aria-label={_('Font Size')}
          />
        </div>

        {/* ── Line Spacing ── */}
        <div className='mb-4'>
          <div className='mb-1 flex items-center justify-between'>
            <span className='text-xs font-medium opacity-70'>{_('Line Spacing')}</span>
            <span className='text-xs font-bold tabular-nums'>{lineHeight.toFixed(1)}</span>
          </div>
          <input
            type='range'
            min={0.8}
            max={3.0}
            step={0.1}
            value={lineHeight}
            onChange={(e) => handleLineSpacingChange(Number(e.target.value))}
            className='range range-xs range-primary w-full'
            aria-label={_('Line Spacing')}
          />
        </div>

        {/* ── Latin Font ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Latin Font')}</label>
          <select
            value={latinFont}
            onChange={(e) => {
              const val = e.target.value;
              setLatinFont(val);
              saveViewSettings(envConfig, bookKey, 'latinFont', val);
              if (viewSettings) viewSettings.latinFont = val;
            }}
            className='select select-bordered select-xs w-full'
            aria-label={_('Latin Font')}
          >
            {latinOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Cyrillic Font ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Cyrillic Font')}</label>
          <select
            value={cyrillicFont}
            onChange={(e) => {
              const val = e.target.value;
              setCyrillicFont(val);
              saveViewSettings(envConfig, bookKey, 'cyrillicFont', val);
              if (viewSettings) viewSettings.cyrillicFont = val;
            }}
            className='select select-bordered select-xs w-full'
            aria-label={_('Cyrillic Font')}
          >
            {cyrillicOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Arabic Font ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Arabic Font')}</label>
          <select
            value={arabicFont}
            onChange={(e) => {
              const val = e.target.value;
              setArabicFont(val);
              saveViewSettings(envConfig, bookKey, 'arabicFont', val);
              if (viewSettings) viewSettings.arabicFont = val;
            }}
            className='select select-bordered select-xs w-full'
            aria-label={_('Arabic Font')}
          >
            {arabicOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Divider + More Settings ── */}
        <div className='border-t border-base-300/50 pt-2'>
          <button
            type='button'
            onClick={handleMoreSettings}
            className='flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium opacity-60 transition-colors hover:bg-base-200 hover:opacity-100'
          >
            {_('More Font Settings')}
            <RiArrowRightSLine className='text-base' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FontQuickPopover;
