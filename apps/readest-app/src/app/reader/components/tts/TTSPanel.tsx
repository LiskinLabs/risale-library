import clsx from 'clsx';
import { useState, ChangeEvent, useEffect } from 'react';
import { MdPlayCircle, MdPauseCircle, MdFastRewind, MdFastForward, MdAlarm } from 'react-icons/md';
import { TbChevronCompactDown, TbChevronCompactUp } from 'react-icons/tb';
import { RiVoiceAiFill } from 'react-icons/ri';
import { MdCheck } from 'react-icons/md';
import { TTSVoicesGroup } from '@/services/tts';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { TranslationFunc, useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useDefaultIconSize, useResponsiveSize } from '@/hooks/useResponsiveSize';
import { getLanguageName } from '@/utils/lang';

type TTSPanelProps = {
  bookKey: string;
  ttsLang: string;
  isPlaying: boolean;
  timeoutOption: number;
  timeoutTimestamp: number;
  onTogglePlay: () => void;
  onBackward: () => void;
  onForward: () => void;
  onSetRate: (rate: number) => void;
  onGetVoices: (lang: string) => Promise<TTSVoicesGroup[]>;
  onSetVoice: (voice: string, lang: string) => void;
  onGetVoiceId: () => string;
  onSelectTimeout: (bookKey: string, value: number) => void;
  onToogleTTSBar: () => void;
};

const getTTSTimeoutOptions = (_: TranslationFunc) => {
  return [
    {
      label: _('No Timeout'),
      value: 0,
    },
    {
      label: _('{{value}} minute', { value: 1 }),
      value: 60,
    },
    {
      label: _('{{value}} minutes', { value: 3 }),
      value: 180,
    },
    {
      label: _('{{value}} minutes', { value: 5 }),
      value: 300,
    },
    {
      label: _('{{value}} minutes', { value: 10 }),
      value: 600,
    },
    {
      label: _('{{value}} minutes', { value: 20 }),
      value: 1200,
    },
    {
      label: _('{{value}} minutes', { value: 30 }),
      value: 1800,
    },
    {
      label: _('{{value}} minutes', { value: 45 }),
      value: 2700,
    },
    {
      label: _('{{value}} hour', { value: 1 }),
      value: 3600,
    },
    {
      label: _('{{value}} hours', { value: 2 }),
      value: 7200,
    },
    {
      label: _('{{value}} hours', { value: 3 }),
      value: 10800,
    },
    {
      label: _('{{value}} hours', { value: 4 }),
      value: 14400,
    },
    {
      label: _('{{value}} hours', { value: 6 }),
      value: 21600,
    },
    {
      label: _('{{value}} hours', { value: 8 }),
      value: 28800,
    },
  ];
};

const getCountdownTime = (timeout: number) => {
  const now = Date.now();
  if (timeout > now) {
    const remainingTime = Math.floor((timeout - now) / 1000);
    const minutes = Math.floor(remainingTime / 3600) * 60 + Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return '';
};

const TTSPanel = ({
  bookKey,
  ttsLang,
  isPlaying,
  timeoutOption,
  timeoutTimestamp,
  onTogglePlay,
  onBackward,
  onForward,
  onSetRate,
  onGetVoices,
  onSetVoice,
  onGetVoiceId,
  onSelectTimeout,
  onToogleTTSBar,
}: TTSPanelProps) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { getViewSettings, setViewSettings } = useReaderStore();
  const { settings, setSettings, saveSettings } = useSettingsStore();
  const viewSettings = getViewSettings(bookKey);

  const [voiceGroups, setVoiceGroups] = useState<TTSVoicesGroup[]>([]);
  const [rate, setRate] = useState(viewSettings?.ttsRate ?? 1.0);
  const [selectedVoice, setSelectedVoice] = useState(viewSettings?.ttsVoice ?? '');

  const [timeoutCountdown, setTimeoutCountdown] = useState(() => {
    return getCountdownTime(timeoutTimestamp);
  });

  const defaultIconSize = useDefaultIconSize();
  const iconSize32 = useResponsiveSize(32);
  const iconSize48 = useResponsiveSize(48);

  const handleSetRate = (e: ChangeEvent<HTMLInputElement>) => {
    let newRate = parseFloat(e.target.value);
    newRate = Math.max(0.2, Math.min(3.0, newRate));
    setRate(newRate);
    onSetRate(newRate);
    const viewSettings = getViewSettings(bookKey)!;
    viewSettings.ttsRate = newRate;
    settings.globalViewSettings.ttsRate = newRate;
    setViewSettings(bookKey, viewSettings);
    setSettings(settings);
    saveSettings(envConfig, settings);
  };

  const handleSelectVoice = (voice: string, lang: string) => {
    onSetVoice(voice, lang);
    setSelectedVoice(voice);
    const viewSettings = getViewSettings(bookKey)!;
    viewSettings.ttsVoice = voice;
    setViewSettings(bookKey, viewSettings);
  };

  const updateTimeout = (timeout: number) => {
    const now = Date.now();
    if (timeout > 0 && timeout < now) {
      onSelectTimeout(bookKey, 0);
      setTimeoutCountdown('');
    } else if (timeout > 0) {
      setTimeoutCountdown(getCountdownTime(timeout));
    }
  };

  useEffect(() => {
    setTimeout(() => {
      updateTimeout(timeoutTimestamp);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutTimestamp, timeoutCountdown]);

  useEffect(() => {
    const voiceId = onGetVoiceId();
    setSelectedVoice(voiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchVoices = async () => {
      const voiceGroups = await onGetVoices(ttsLang);
      const voicesCount = voiceGroups.reduce((acc, group) => acc + group.voices.length, 0);
      if (!voiceGroups || voicesCount === 0) {
        console.warn('No voices found for TTSPanel');
        setVoiceGroups([
          {
            id: 'no-voices',
            name: _('Voices for {{lang}}', { lang: getLanguageName(ttsLang) }),
            voices: [],
          },
        ]);
      } else {
        setVoiceGroups(voiceGroups);
      }
    };
    fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsLang]);

  const timeoutOptions = getTTSTimeoutOptions(_);

  return (
    <div className='premium-glass flex w-full flex-col items-center justify-center gap-4 rounded-[2rem] px-6 py-5 shadow-2xl sm:gap-3'>
      {/* Rate Slider Area */}
      <div className='flex w-full flex-col items-center gap-1 opacity-90 transition-opacity hover:opacity-100'>
        <input
          className='range range-sm'
          type='range'
          min={0.0}
          max={3.0}
          step='0.1'
          value={rate}
          onChange={handleSetRate}
          style={{ accentColor: 'var(--fallback-p, #c5a059)' }}
        />
        <div className='text-premium-gold/60 grid w-full grid-cols-7 text-[10px] font-medium tracking-widest'>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
        </div>
        <div className='text-premium-gold/80 grid w-full grid-cols-7 text-[10px] font-semibold uppercase tracking-wider'>
          <span className='text-center'>{_('Slow')}</span>
          <span className='text-center'></span>
          <span className='text-center'>1.0</span>
          <span className='text-center'>1.5</span>
          <span className='text-center'>2.0</span>
          <span className='text-center'></span>
          <span className='text-center'>{_('Fast')}</span>
        </div>
      </div>

      {/* Main Controls Area */}
      <div className='flex w-full items-center justify-between'>
        <button
          onClick={() => onBackward()}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-2 hover:scale-110'
          title={_('Previous Paragraph')}
          aria-label={_('Previous Paragraph')}
        >
          <MdFastRewind size={iconSize32} />
        </button>

        <button
          onClick={onTogglePlay}
          className='text-premium-gold hover-glow premium-transition bg-base-content/5 hover:bg-base-content/10 flex items-center justify-center rounded-full p-2 hover:scale-110'
          title={isPlaying ? _('Pause') : _('Play')}
          aria-label={isPlaying ? _('Pause') : _('Play')}
        >
          {isPlaying ? <MdPauseCircle size={iconSize48} /> : <MdPlayCircle size={iconSize48} />}
        </button>

        <button
          onClick={() => onForward()}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-2 hover:scale-110'
          title={_('Next Paragraph')}
          aria-label={_('Next Paragraph')}
        >
          <MdFastForward size={iconSize32} />
        </button>

        <div className='dropdown dropdown-top'>
          <button
            tabIndex={0}
            className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 relative flex flex-col items-center justify-center rounded-full p-2 hover:scale-110'
            onClick={(e) => e.currentTarget.focus()}
            title={_('Set Timeout')}
            aria-label={_('Set Timeout')}
          >
            <MdAlarm size={iconSize32} />
            {timeoutCountdown && (
              <span
                className={clsx(
                  'bg-premium-gold text-premium-midnight absolute -bottom-1 -right-2 min-w-[3rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold shadow-sm',
                )}
              >
                {timeoutCountdown}
              </span>
            )}
          </button>
          <ul
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={clsx(
              'dropdown-content premium-glass border-premium-gold/10 menu menu-vertical absolute right-0 z-[1] rounded-2xl border shadow-2xl',
              'mt-4 inline max-h-96 w-[200px] overflow-y-scroll py-2',
            )}
          >
            {timeoutOptions.map((option, index) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
              <li
                key={`${index}-${option.value}`}
                onClick={() => onSelectTimeout(bookKey, option.value)}
                className='hover:bg-premium-gold/10 premium-transition'
              >
                <div className='flex items-center gap-3 px-3 py-2'>
                  <span
                    className='text-premium-gold flex items-center justify-center'
                    style={{
                      width: `${defaultIconSize}px`,
                      height: `${defaultIconSize}px`,
                    }}
                  >
                    {timeoutOption === option.value && <MdCheck size={20} />}
                  </span>
                  <span
                    className={clsx(
                      'text-sm font-medium tracking-wide',
                      timeoutOption === option.value ? 'text-premium-gold' : 'text-base-content',
                    )}
                  >
                    {option.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className='dropdown dropdown-top'>
          <button
            tabIndex={0}
            className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-2 hover:scale-110'
            onClick={(e) => e.currentTarget.focus()}
          >
            <RiVoiceAiFill size={iconSize32} />
          </button>
          <ul
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={clsx(
              'dropdown-content premium-glass border-premium-gold/10 menu menu-vertical absolute right-0 z-[1] rounded-2xl border shadow-2xl',
              'mt-4 inline max-h-96 w-[250px] overflow-y-scroll py-2',
            )}
            title={_('Select Voice')}
            aria-label={_('Select Voice')}
          >
            {voiceGroups.map((voiceGroup, index) => {
              return (
                <div key={voiceGroup.id} className=''>
                  <div className='flex items-center gap-3 px-3 py-1'>
                    <span
                      style={{ width: `${defaultIconSize}px`, height: `${defaultIconSize}px` }}
                    ></span>
                    <span className='text-premium-gold/60 text-[10px] font-bold uppercase tracking-wider'>
                      {_('{{engine}}: {{count}} voices', {
                        engine: _(voiceGroup.name),
                        count: voiceGroup.voices.length,
                      })}
                    </span>
                  </div>
                  {voiceGroup.voices.map((voice, voiceIndex) => (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                    <li
                      key={`${index}-${voiceGroup.id}-${voiceIndex}`}
                      onClick={() => !voice.disabled && handleSelectVoice(voice.id, voice.lang)}
                      className='hover:bg-premium-gold/10 premium-transition'
                    >
                      <div className='flex items-center gap-3 px-3 py-1.5'>
                        <span
                          className='text-premium-gold flex items-center justify-center'
                          style={{
                            width: `${defaultIconSize}px`,
                            height: `${defaultIconSize}px`,
                          }}
                        >
                          {selectedVoice === voice.id && <MdCheck size={20} />}
                        </span>
                        <span
                          className={clsx(
                            'max-w-[180px] overflow-hidden text-ellipsis text-sm font-medium tracking-wide',
                            voice.disabled
                              ? 'text-base-content/30'
                              : selectedVoice === voice.id
                                ? 'text-premium-gold'
                                : 'text-base-content',
                          )}
                        >
                          {_(voice.name)}
                        </span>
                      </div>
                    </li>
                  ))}
                </div>
              );
            })}
          </ul>
        </div>
      </div>
      <div className='text-base-content/40 hover:text-premium-gold premium-transition flex h-4 items-center justify-center hover:scale-110'>
        <button
          onClick={onToogleTTSBar}
          className='p-0'
          title={_('Toggle Sticky Bottom TTS Bar')}
          aria-label={_('Toggle Sticky Bottom TTS Bar')}
        >
          {viewSettings?.showTTSBar ? (
            <TbChevronCompactUp size={iconSize48} style={{ transform: 'scaleY(0.85)' }} />
          ) : (
            <TbChevronCompactDown size={iconSize48} style={{ transform: 'scaleY(0.85)' }} />
          )}
        </button>
      </div>
    </div>
  );
};

export default TTSPanel;
