import clsx from 'clsx';
import {
  MdPlayArrow,
  MdOutlinePause,
  MdFastRewind,
  MdFastForward,
  MdSkipPrevious,
  MdSkipNext,
} from 'react-icons/md';
import { Insets } from '@/types/misc';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTranslation } from '@/hooks/useTranslation';

type TTSBarProps = {
  bookKey: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onBackward: (byMark: boolean) => void;
  onForward: (byMark: boolean) => void;
  gridInsets: Insets;
};

const TTSBar = ({
  bookKey,
  isPlaying,
  onTogglePlay,
  onBackward,
  onForward,
  gridInsets,
}: TTSBarProps) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { hoveredBookKey, setHoveredBookKey } = useReaderStore();
  const iconSize32 = useResponsiveSize(30);
  const iconSize48 = useResponsiveSize(36);

  const isVisible = hoveredBookKey !== bookKey;

  return (
    <div
      className={clsx(
        'premium-glass border-premium-gold/10 absolute bottom-0 z-40 mb-4 rounded-full border shadow-2xl',
        'inset-x-0 mx-auto flex w-fit justify-center',
        'transition-opacity duration-300',
        isVisible ? `pointer-events-auto opacity-100` : `pointer-events-none opacity-0`,
      )}
      style={{
        marginBottom: appService?.hasSafeAreaInset
          ? `calc(${gridInsets.bottom * 0.33}px + 1rem)`
          : '1rem',
      }}
      onMouseEnter={() => !appService?.isMobile && setHoveredBookKey('')}
      onTouchStart={() => !appService?.isMobile && setHoveredBookKey('')}
    >
      <div className='flex h-[52px] items-center gap-1 px-4 sm:gap-2'>
        <button
          onClick={onBackward.bind(null, false)}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-1.5 hover:scale-110'
          title={_('Previous Paragraph')}
          aria-label={_('Previous Paragraph')}
        >
          <MdFastRewind size={iconSize32} />
        </button>
        <button
          onClick={onBackward.bind(null, true)}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-1.5 hover:scale-110'
          title={_('Previous Sentence')}
          aria-label={_('Previous Sentence')}
        >
          <MdSkipPrevious size={iconSize32} />
        </button>
        <div className='bg-premium-gold/20 mx-1 h-6 w-[1px]' />
        <button
          onClick={onTogglePlay}
          className='text-premium-gold hover-glow premium-transition bg-base-content/5 hover:bg-base-content/10 mx-1 rounded-full p-1.5 hover:scale-110'
          title={isPlaying ? _('Pause') : _('Play')}
          aria-label={isPlaying ? _('Pause') : _('Play')}
        >
          {isPlaying ? <MdOutlinePause size={iconSize48} /> : <MdPlayArrow size={iconSize48} />}
        </button>
        <div className='bg-premium-gold/20 mx-1 h-6 w-[1px]' />
        <button
          onClick={onForward.bind(null, true)}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-1.5 hover:scale-110'
          title={_('Next Sentence')}
          aria-label={_('Next Sentence')}
        >
          <MdSkipNext size={iconSize32} />
        </button>
        <button
          onClick={onForward.bind(null, false)}
          className='text-base-content/70 hover:text-premium-gold premium-transition hover:bg-base-content/5 rounded-full p-1.5 hover:scale-110'
          title={_('Next Paragraph')}
          aria-label={_('Next Paragraph')}
        >
          <MdFastForward size={iconSize32} />
        </button>
      </div>
    </div>
  );
};

export default TTSBar;
