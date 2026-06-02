import React from 'react';
import clsx from 'clsx';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={clsx('relative flex items-center justify-center', sizeClasses[size], className)}
    >
      <svg
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='w-full h-full drop-shadow-md'
      >
        <defs>
          <linearGradient id='logo-grad-1' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='currentColor' stopOpacity='0.8' />
            <stop offset='100%' stopColor='currentColor' stopOpacity='0.3' />
          </linearGradient>
          <linearGradient id='logo-grad-2' x1='100%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='currentColor' stopOpacity='0.9' />
            <stop offset='100%' stopColor='currentColor' stopOpacity='0.4' />
          </linearGradient>
        </defs>

        {/* Outer glowing ring */}
        <circle
          cx='50'
          cy='50'
          r='45'
          stroke='url(#logo-grad-1)'
          strokeWidth='3'
          strokeDasharray='283'
          strokeDashoffset='283'
          className='animate-[dash_4s_ease-in-out_infinite_alternate] origin-center'
        />

        {/* Inner geometric AI / Book shape */}
        <path
          d='M 30 70 L 50 30 L 70 70 M 50 30 L 50 85 M 20 50 Q 50 20 80 50'
          stroke='url(#logo-grad-2)'
          strokeWidth='6'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='origin-center animate-[pulse_3s_ease-in-out_infinite]'
        />

        {/* Small AI neural dot */}
        <circle cx='50' cy='20' r='5' fill='currentColor' className='animate-bounce' />
      </svg>
    </div>
  );
};
