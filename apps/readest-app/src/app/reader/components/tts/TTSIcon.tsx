import clsx from 'clsx';
import React from 'react';

type TTSIconProps = {
  isPlaying: boolean;
  ttsInited: boolean;
  onClick: () => void;
};

const TTSIcon: React.FC<TTSIconProps> = ({ isPlaying, ttsInited, onClick }) => {
  const bars = [1, 2, 3, 4];

  return (
    <button
      className={clsx(
        'relative h-full w-full rounded-full',
        ttsInited ? 'cursor-pointer' : 'cursor-not-allowed',
      )}
      style={{
        maskImage: 'radial-gradient(circle, white 100%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle, white 100%, transparent 100%)',
      }}
      onClick={onClick}
    >
      <div className='from-premium-gold/80 via-premium-gold to-premium-gold/40 absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br shadow-[0_0_15px_theme("colors.premium.gold/0.3")]'>
        <div
          className='from-premium-gold/40 via-premium-gold to-premium-gold/80 absolute -inset-full rounded-full bg-gradient-to-br'
          style={{
            animation:
              isPlaying && ttsInited ? 'moveGradient 4s ease-in-out infinite alternate' : 'none',
          }}
        />
      </div>

      <div className='absolute inset-0 flex items-center justify-center bg-black/10'>
        <style>{`
          @keyframes moveGradient {
            0% { transform: translate(-10%, -10%) scale(1); }
            100% { transform: translate(10%, 10%) scale(1.1); }
          }
          @keyframes bounce {
            0%, 100% { transform: scaleY(0.4); opacity: 0.8; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
        <div className='flex items-end space-x-[3px]'>
          {bars.map((bar) => (
            <div
              key={bar}
              className='w-[3px] rounded-full bg-white shadow-sm'
              style={{
                height: '18px',
                transformOrigin: 'bottom',
                transform: isPlaying ? 'scaleY(0.4)' : 'scaleY(0.2)',
                opacity: isPlaying ? 0.8 : 0.5,
                animationName: isPlaying ? 'bounce' : 'none',
                animationDuration: isPlaying ? `${0.8 + bar * 0.15}s` : '0s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${bar * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
};

export default TTSIcon;
