import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  readerTheme, readerFont, fontScale, readerMargins,
  readerLineHeight, readerAlignment, readerHyphens, readerView, readerAnimations,
  isSettingsPanelOpen, applyReaderSettings
} from '../../stores/readerStore';

const themes = [
  { value: 'white', label: 'Белая', color: '#fafaf9' },
  { value: 'sepia', label: 'Сепия', color: '#fdf5e6' },
  { value: 'gray', label: 'Серая', color: '#d4d4d8' },
  { value: 'dark', label: 'Тёмная', color: '#18181b' },
];

const fonts = [
  { value: 'kazimir', label: 'Kazimir' },
  { value: 'literata', label: 'Literata' },
  { value: 'amiri', label: 'Amiri' },
  { value: 'sans', label: 'Sans' },
];

const marginsPresets = [
  { value: 'narrow', label: 'Узкие' },
  { value: 'normal', label: 'Средние' },
  { value: 'wide', label: 'Широкие' },
];

const lineHeightPresets = [
  { value: 'compact', label: 'Компакт' },
  { value: 'normal', label: 'Норма' },
  { value: 'wide', label: 'Широк' },
];

const alignmentPresets = [
  { value: 'left', label: 'По левому краю' },
  { value: 'justify', label: 'По ширине' },
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

  useEffect(() => {
    applyReaderSettings();
  }, [theme, font, scale, margins, lineHeight, alignment, hyphens, view, animations]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const panel = document.getElementById('settings-panel');
      const trigger = document.getElementById('settings-trigger');
      if (panel && !panel.contains(e.target as Node) && trigger && !trigger.contains(e.target as Node)) {
        isSettingsPanelOpen.set(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id="settings-panel" className="settings-panel">
      {/* Тема */}
      <div className="settings-section">
        <div className="settings-label">Тема</div>
        <div className="theme-circles">
          {themes.map(t => (
            <button
              key={t.value}
              className={`theme-circle ${theme === t.value ? 'active' : ''}`}
              data-theme-value={t.value}
              style={{ background: t.color }}
              onClick={() => readerTheme.set(t.value)}
              title={t.label}
            />
          ))}
        </div>
      </div>

      {/* Размер шрифта */}
      <div className="settings-section">
        <div className="settings-label">Размер</div>
        <div className="font-size-control">
          <button
            className="font-size-btn"
            onClick={() => fontScale.set(Math.max(0.6, Number(scale) - 0.1))}
            style={{ fontSize: '14px' }}
          >A</button>
          <span className="font-size-value">{Math.round(Number(scale) * 100)}%</span>
          <button
            className="font-size-btn"
            onClick={() => fontScale.set(Math.min(2.0, Number(scale) + 0.1))}
            style={{ fontSize: '20px' }}
          >A</button>
        </div>
      </div>

      {/* Шрифт */}
      <div className="settings-section">
        <div className="settings-label">Шрифт</div>
        <div className="preset-row">
          {fonts.map(f => (
            <button
              key={f.value}
              className={`preset-btn ${font === f.value ? 'active' : ''}`}
              onClick={() => readerFont.set(f.value)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Выравнивание текста */}
      <div className="settings-section">
        <div className="settings-label">Выравнивание</div>
        <div className="preset-row">
          {alignmentPresets.map(p => (
            <button
              key={p.value}
              className={`preset-btn ${alignment === p.value ? 'active' : ''}`}
              onClick={() => readerAlignment.set(p.value)}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Межстрочный */}
      <div className="settings-section">
        <div className="settings-label">Интервал</div>
        <div className="preset-row">
          {lineHeightPresets.map(p => (
            <button
              key={p.value}
              className={`preset-btn ${lineHeight === p.value ? 'active' : ''}`}
              onClick={() => readerLineHeight.set(p.value)}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Поля */}
      <div className="settings-section">
        <div className="settings-label">Поля</div>
        <div className="preset-row">
          {marginsPresets.map(p => (
            <button
              key={p.value}
              className={`preset-btn ${margins === p.value ? 'active' : ''}`}
              onClick={() => readerMargins.set(p.value)}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="settings-section">
        <div className="toggle-row" style={{ marginBottom: '0.6rem' }}>
          <span>Переносы</span>
          <div
            className={`toggle-switch ${hyphens ? 'active' : ''}`}
            onClick={() => readerHyphens.set(!hyphens)}
          />
        </div>
        <div className="toggle-row" style={{ marginBottom: '0.6rem' }}>
          <span>Бесконечный скролл</span>
          <div
            className={`toggle-switch ${view === 'scroll' ? 'active' : ''}`}
            onClick={() => readerView.set(view === 'scroll' ? 'book' : 'scroll')}
          />
        </div>
        <div className="toggle-row">
          <span>Анимация</span>
          <div
            className={`toggle-switch ${animations ? 'active' : ''}`}
            onClick={() => readerAnimations.set(!animations)}
          />
        </div>
      </div>
    </div>
  );
};
