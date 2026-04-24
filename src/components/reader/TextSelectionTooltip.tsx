import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { bookLanguage } from '../../stores/readerStore';

interface SelectionData {
  text: string;
  x: number;
  y: number;
  isVisible: boolean;
}

export const TextSelectionTooltip: React.FC = () => {
  const lang = useStore(bookLanguage);
  const [selection, setSelection] = useState<SelectionData>({ text: '', x: 0, y: 0, isVisible: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.isCollapsed) {
        // Only hide if we are not currently playing audio for this selection
        if (!isPlaying) {
          setSelection(prev => ({ ...prev, isVisible: false }));
        }
        return;
      }

      const text = activeSelection.toString().trim();
      if (!text) {
        if (!isPlaying) setSelection(prev => ({ ...prev, isVisible: false }));
        return;
      }

      // Check if selection is within the reader container
      const range = activeSelection.getRangeAt(0);
      const container = document.querySelector('.reader-page');
      if (container && container.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        
        // Calculate position above the selection
        // We use client bounding rect, so we need to add scroll offset if it's position absolute,
        // but we'll use fixed position to make it easier relative to viewport.
        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          isVisible: true
        });
      } else {
        if (!isPlaying) setSelection(prev => ({ ...prev, isVisible: false }));
      }
    };

    const handleMouseUp = () => {
      // Delay slightly to let the selection settle
      setTimeout(handleSelectionChange, 10);
    };

    // Listen on document for mouseup and touchend
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isPlaying]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    if (selection.text) {
      navigator.clipboard.writeText(selection.text);
      // Briefly show visual feedback? We can just hide the tooltip
      setSelection(prev => ({ ...prev, isVisible: false }));
    }
  };

  const handleListen = () => {
    if (!window.speechSynthesis) {
      alert('Ваш браузер не поддерживает озвучку текста.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!selection.text) return;

    const utterance = new SpeechSynthesisUtterance(selection.text);
    
    // Determine language code
    let langCode = 'ru-RU';
    if (lang === 'tr' || lang === 'os') langCode = 'tr-TR';
    if (lang === 'ar') langCode = 'ar-SA';

    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for better reading

    // Try to find the exact voices used in gemini_telegram_official (Dmitry for RU, Ahmet for TR)
    const voices = window.speechSynthesis.getVoices();
    const targetVoices = voices.filter(v => v.lang.startsWith(langCode.split('-')[0]));

    let preferredVoice = null;

    if (langCode === 'ru-RU') {
      preferredVoice = targetVoices.find(v => v.name.toLowerCase().includes('dmitry')) ||
                       targetVoices.find(v => v.name.toLowerCase().includes('pavel') || v.name.toLowerCase().includes('male'));
    } else if (langCode === 'tr-TR') {
      preferredVoice = targetVoices.find(v => v.name.toLowerCase().includes('ahmet')) ||
                       targetVoices.find(v => v.name.toLowerCase().includes('tolga') || v.name.toLowerCase().includes('male'));
    } else {
      preferredVoice = targetVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('tariq'));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else if (targetVoices.length > 0) {
      utterance.voice = targetVoices[0]; // fallback to first available
    }
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      // If selection is gone, hide the popup
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.isCollapsed) {
        setSelection(prev => ({ ...prev, isVisible: false }));
      }
    };
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  if (!selection.isVisible) return null;

  return (
    <div
      className={`fixed z-50 glass-panel shadow-2xl transition-all duration-200`}
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px',
        gap: '4px',
        borderRadius: '12px',
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent clicking from removing selection
    >
      <button 
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        style={{ fontSize: '13px', fontWeight: 500 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Копировать
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 4px' }} />

      <button 
        onClick={handleListen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${isPlaying ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
        style={{ fontSize: '13px', fontWeight: 500 }}
      >
        {isPlaying ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Пауза
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Слушать
          </>
        )}
      </button>
      
      {/* Downward triangle arrow */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--glass-bg)',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};
