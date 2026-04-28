import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  readerTheme,
  readerFont,
  fontScale,
  readerMargins,
  readerLineHeight,
  readerAlignment,
  readerHyphens,
  readerView,
  readerAnimations,
  isSettingsPanelOpen,
  applyReaderSettings,
  bookLanguage,
  getAvailableFonts,
  getEffectiveFont,
} from '../../stores/readerStore';

const themes = [
  { value: 'white', label: 'Светлая', color: '#F9F9F7' },
  { value: 'sepia', label: 'Сепия', color: '#F5ECD7' },
  { value: 'gray', label: 'Серая', color: '#D6D6DA' },
  { value: 'dark', label: 'Тёмная', color: '#1A1A1E' },
];

const marginsPresets = [
  { value: 'narrow', label: 'Узкие' },
  { value: 'normal', label: 'Средние' },
  { value: 'wide', label: 'Широкие' },
];

const lineHeightPresets = [
  { value: 'compact', label: 'Компакт' },
  { value: 'normal', label: 'Норма' },
  { value: 'wide', label: 'Широко' },
];

export const SettingsPanel: React.FC = () => {
  const isOpen = useStore(isSettingsPanelOpen);
  const theme = useStore(readerTheme);
  const font = useStore(readerFont);
  const scale = useStore(fontScale);
  const margins = useStore(readerMargins);
  const lineHeight = useStore(readerLineHeight);
  const alignment = useStore(readerAlignment);
  const hyphens = useStore(readerHyphens);
  const view = useStore(readerView);
  const animations = useStore(readerAnimations);
  const lang = useStore(bookLanguage);

  // Get fonts for the current book language
  const availableFonts = getAvailableFonts(lang);
  const effectiveFont = getEffectiveFont(lang);

  useEffect(() => {
    applyReaderSettings();
  }, [theme, font, scale, margins, lineHeight, alignment, hyphens, view, animations, lang]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') isSettingsPanelOpen.set(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to catch outside clicks reliably */}
      <div
        className='fixed inset-0 z-40'
        onClick={() => isSettingsPanelOpen.set(false)}
        style={{ background: 'transparent' }}
      />
      <div id='settings-panel' className='settings-panel glass-panel scrollbar-thin'>
        {/* Тема */}
        <div className='settings-section'>
          <div className='settings-label'>Тема</div>
          <div className='theme-circles'>
            {themes.map((t) => (
              <div
                key={t.value}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <button
                  className={`theme-circle ${theme === t.value ? 'active' : ''}`}
                  data-theme-value={t.value}
                  style={{ background: t.color }}
                  onClick={() => readerTheme.set(t.value)}
                  title={t.label}
                />
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Размер шрифта */}
        <div className='settings-section'>
          <div className='settings-label'>Размер</div>
          <div className='font-size-control'>
            <button
              className='font-size-btn'
              onClick={() => fontScale.set(Math.max(0.6, Number(scale) - 0.1))}
              style={{ fontSize: '13px' }}
            >
              A
            </button>
            <span className='font-size-value'>{Math.round(Number(scale) * 100)}%</span>
            <button
              className='font-size-btn'
              onClick={() => fontScale.set(Math.min(2.0, Number(scale) + 0.1))}
              style={{ fontSize: '19px' }}
            >
              A
            </button>
          </div>
        </div>

        {/* Шрифт — filtered by language */}
        <div className='settings-section'>
          <div className='settings-label'>Шрифт</div>
          <div className='preset-row'>
            {availableFonts.map((f) => (
              <button
                key={f.value}
                className={`preset-btn ${effectiveFont === f.value ? 'active' : ''}`}
                onClick={() => readerFont.set(f.value)}
                style={{ fontFamily: f.family, fontSize: '0.8rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Выравнивание — иконки */}
        <div className='settings-section'>
          <div className='settings-label'>Выравнивание</div>
          <div className='preset-row'>
            <button
              className={`preset-btn ${alignment === 'left' ? 'active' : ''}`}
              onClick={() => readerAlignment.set('left')}
              title='По левому краю'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              >
                <line x1='3' y1='6' x2='21' y2='6' />
                <line x1='3' y1='12' x2='15' y2='12' />
                <line x1='3' y1='18' x2='18' y2='18' />
              </svg>
              <span>Левый</span>
            </button>
            <button
              className={`preset-btn ${alignment === 'justify' ? 'active' : ''}`}
              onClick={() => readerAlignment.set('justify')}
              title='По ширине'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              >
                <line x1='3' y1='6' x2='21' y2='6' />
                <line x1='3' y1='12' x2='21' y2='12' />
                <line x1='3' y1='18' x2='21' y2='18' />
              </svg>
              <span>Ширина</span>
            </button>
          </div>
        </div>

        {/* Межстрочный */}
        <div className='settings-section'>
          <div className='settings-label'>Интервал</div>
          <div className='preset-row'>
            {lineHeightPresets.map((p) => (
              <button
                key={p.value}
                className={`preset-btn ${lineHeight === p.value ? 'active' : ''}`}
                onClick={() => readerLineHeight.set(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Поля */}
        <div className='settings-section'>
          <div className='settings-label'>Поля</div>
          <div className='preset-row'>
            {marginsPresets.map((p) => (
              <button
                key={p.value}
                className={`preset-btn ${margins === p.value ? 'active' : ''}`}
                onClick={() => readerMargins.set(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className='settings-section'>
          <div className='toggle-row' style={{ marginBottom: '0.6rem' }}>
            <span>Переносы</span>
            <div
              className={`toggle-switch ${hyphens ? 'active' : ''}`}
              onClick={() => readerHyphens.set(!hyphens)}
            />
          </div>
          <div className='toggle-row' style={{ marginBottom: '0.6rem' }}>
            <span>Книжный разворот</span>
            <div
              className={`toggle-switch ${view === 'book' ? 'active' : ''}`}
              onClick={() => readerView.set(view === 'scroll' ? 'book' : 'scroll')}
            />
          </div>
          <div className='toggle-row'>
            <span>Анимации</span>
            <div
              className={`toggle-switch ${animations ? 'active' : ''}`}
              onClick={() => readerAnimations.set(!animations)}
            />
          </div>
        </div>
      </div>
    </>
  );
};
