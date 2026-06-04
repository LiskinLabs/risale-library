'use client';

import React, { useEffect, useState } from 'react';
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
 *
 * Layers (from general to specific):
 * 1. Font Size + Line Height — always work
 * 2. Font Family — Serif (с засечками) or Sans-serif (без засечек)
 * 3. Font Face — specific font within the chosen family
 * 4. Font Weight — 300…700
 * 5. Override Book Font toggle
 * 6. Per-script (Advanced) — Latin/Cyrillic/Arabic specific fonts
 */
const FontQuickPopover: React.FC<FontQuickPopoverProps> = ({ bookKey }) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { getViewSettings } = useReaderStore();
  const { setHoveredBookKey } = useReaderStore();
  const { setSettingsDialogBookKey, setSettingsDialogOpen, setRequestedPanel } = useSettingsStore();
  const viewSettings = getViewSettings(bookKey);

  // ── State ──
  const [fontSize, setFontSize] = useState(viewSettings?.defaultFontSize ?? 18);
  const [lineHeight, setLineHeight] = useState(viewSettings?.lineHeight ?? 1.4);
  const [fontFamily, setFontFamily] = useState(viewSettings?.defaultFont ?? 'Serif');
  const [serifFont, setSerifFont] = useState(viewSettings?.serifFont ?? 'Georgia');
  const [sansSerifFont, setSansSerifFont] = useState(viewSettings?.sansSerifFont ?? 'Helvetica');
  const [fontWeight, setFontWeight] = useState(viewSettings?.fontWeight ?? 400);
  const [overrideFont, setOverrideFont] = useState(viewSettings?.overrideFont ?? false);
  const [latinFont, setLatinFont] = useState(viewSettings?.latinFont ?? '');
  const [cyrillicFont, setCyrillicFont] = useState(viewSettings?.cyrillicFont ?? '');
  const [arabicFont, setArabicFont] = useState(viewSettings?.arabicFont ?? '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync from external viewSettings changes
  useEffect(() => {
    if (!viewSettings) return;
    setFontSize(viewSettings.defaultFontSize ?? 18);
    setLineHeight(viewSettings.lineHeight ?? 1.4);
    setFontFamily(viewSettings.defaultFont ?? 'Serif');
    setSerifFont(viewSettings.serifFont ?? 'Georgia');
    setSansSerifFont(viewSettings.sansSerifFont ?? 'Helvetica');
    setFontWeight(viewSettings.fontWeight ?? 400);
    setOverrideFont(viewSettings.overrideFont ?? false);
    setLatinFont(viewSettings.latinFont ?? '');
    setCyrillicFont(viewSettings.cyrillicFont ?? '');
    setArabicFont(viewSettings.arabicFont ?? '');
  }, [viewSettings]);

  // ═══════════════════════════════════════════════════════════════
  // Persist helper. Each setting change is written to storage
  // immediately and reflected in the reader store.
  // ═══════════════════════════════════════════════════════════════

  const handleMoreSettings = () => {
    setHoveredBookKey('');
    setSettingsDialogBookKey(bookKey);
    setRequestedPanel('Font');
    setSettingsDialogOpen(true);
  };

  // Serif face options (first = default)
  const serifOptions = [
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Minion Pro', label: 'Minion Pro' },
    { value: 'ITC Souvenir', label: 'ITC Souvenir' },
    { value: 'Bitter', label: 'Bitter' },
    { value: 'Literata', label: 'Literata' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'PT Serif', label: 'PT Serif' },
  ];
  const sansOptions = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Noto Sans', label: 'Noto Sans' },
    { value: 'PT Sans', label: 'PT Sans' },
  ];
  const latinOptions = [
    { value: '', label: _('Off') },
    { value: 'Minion Pro', label: 'Minion Pro' },
    { value: 'ITC Souvenir', label: 'ITC Souvenir' },
    { value: 'Bitter', label: 'Bitter' },
    { value: 'Literata', label: 'Literata' },
  ];
  const cyrillicOptions = [
    { value: '', label: _('Off') },
    { value: 'Kazimir Text', label: 'Kazimir Text' },
    { value: 'PT Serif', label: 'PT Serif' },
  ];
  const arabicOptions = [
    { value: '', label: _('Off') },
    { value: 'Nassim Arabic Pro', label: 'Nassim Arabic Pro' },
    { value: 'Scheherazade New', label: 'Scheherazade New' },
  ];

  const currentFontFace = fontFamily === 'Serif' ? serifFont : sansSerifFont;
  const faceOptions = fontFamily === 'Serif' ? serifOptions : sansOptions;

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
            onChange={(e) => {
              const val = Number(e.target.value);
              setFontSize(val);
              saveViewSettings(envConfig, bookKey, 'defaultFontSize', val, true, false);
            }}
            className='range range-xs range-primary w-full'
            aria-label={_('Font Size')}
          />
        </div>

        {/* ── Line Height ── */}
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
            onChange={(e) => {
              const val = Number(e.target.value);
              setLineHeight(val);
              saveViewSettings(envConfig, bookKey, 'lineHeight', val, true, false);
            }}
            className='range range-xs range-primary w-full'
            aria-label={_('Line Spacing')}
          />
        </div>

        <hr className='border-base-300/50 mb-3' />

        {/* ── Font Family (Serif / Sans-serif) ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Font Family')}</label>
          <div className='flex gap-1'>
            <button
              type='button'
              onClick={() => {
                setFontFamily('Serif');
                saveViewSettings(envConfig, bookKey, 'defaultFont', 'Serif', true, false);
              }}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                fontFamily === 'Serif'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-base-200 text-base-content/60 hover:bg-base-300'
              }`}
            >
              {_('Serif Font')}
            </button>
            <button
              type='button'
              onClick={() => {
                setFontFamily('Sans-serif');
                saveViewSettings(envConfig, bookKey, 'defaultFont', 'Sans-serif', true, false);
              }}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                fontFamily === 'Sans-serif'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-base-200 text-base-content/60 hover:bg-base-300'
              }`}
            >
              {_('Sans-Serif Font')}
            </button>
          </div>
        </div>

        {/* ── Font Face ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Font Face')}</label>
          <select
            value={currentFontFace}
            onChange={(e) => {
              const val = e.target.value;
              if (fontFamily === 'Serif') {
                setSerifFont(val);
                saveViewSettings(envConfig, bookKey, 'serifFont', val, true, false);
              } else {
                setSansSerifFont(val);
                saveViewSettings(envConfig, bookKey, 'sansSerifFont', val, true, false);
              }
            }}
            className='select select-bordered select-xs w-full'
            aria-label={_('Font Face')}
          >
            {faceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Font Weight ── */}
        <div className='mb-3'>
          <label className='mb-1 block text-xs font-medium opacity-70'>{_('Font Weight')}</label>
          <select
            value={fontWeight}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFontWeight(val);
              saveViewSettings(envConfig, bookKey, 'fontWeight', val, true, false);
            }}
            className='select select-bordered select-xs w-full'
            aria-label={_('Font Weight')}
          >
            <option value={300}>300 — Light</option>
            <option value={400}>400 — Regular</option>
            <option value={500}>500 — Medium</option>
            <option value={600}>600 — Semibold</option>
            <option value={700}>700 — Bold</option>
          </select>
        </div>

        {/* ── Override Book Font ── */}
        <label className='mb-3 flex cursor-pointer items-center justify-between rounded-md px-1 py-1.5 transition-colors hover:bg-base-200'>
          <span className='text-xs font-medium opacity-70'>{_('Override Book Font')}</span>
          <input
            type='checkbox'
            className='toggle toggle-xs'
            checked={overrideFont}
            onChange={() => {
              const val = !overrideFont;
              setOverrideFont(val);
              saveViewSettings(envConfig, bookKey, 'overrideFont', val, true, false);
            }}
          />
        </label>

        <hr className='border-base-300/50 mb-3' />

        {/* ── Per-Script (Advanced) collapsible ── */}
        <button
          type='button'
          onClick={() => setShowAdvanced(!showAdvanced)}
          className='mb-2 flex w-full items-center justify-between rounded px-1 py-1 text-xs font-medium opacity-60 transition-colors hover:bg-base-200 hover:opacity-100'
        >
          {_('Per-Script Fonts (Advanced)')}
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
            ▸
          </span>
        </button>

        {showAdvanced && (
          <>
            {/* Latin Font */}
            <div className='mb-2 ml-2'>
              <label className='mb-1 block text-[11px] font-medium opacity-60'>
                {_('Latin Font')}
              </label>
              <select
                value={latinFont}
                onChange={(e) => {
                  const val = e.target.value;
                  setLatinFont(val);
                  saveViewSettings(envConfig, bookKey, 'latinFont', val || '', true, false);
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
            {/* Cyrillic Font */}
            <div className='mb-2 ml-2'>
              <label className='mb-1 block text-[11px] font-medium opacity-60'>
                {_('Cyrillic Font')}
              </label>
              <select
                value={cyrillicFont}
                onChange={(e) => {
                  const val = e.target.value;
                  setCyrillicFont(val);
                  saveViewSettings(envConfig, bookKey, 'cyrillicFont', val || '', true, false);
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
            {/* Arabic Font */}
            <div className='mb-2 ml-2'>
              <label className='mb-1 block text-[11px] font-medium opacity-60'>
                {_('Arabic Font')}
              </label>
              <select
                value={arabicFont}
                onChange={(e) => {
                  const val = e.target.value;
                  setArabicFont(val);
                  saveViewSettings(envConfig, bookKey, 'arabicFont', val || '', true, false);
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
          </>
        )}

        {/* ── More Settings ── */}
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
