import React from 'react';

export const LibrarySkeleton: React.FC = () => {
  // Generate 12 skeleton books
  const skeletons = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className='absolute inset-0 z-40 p-4 overflow-hidden pt-8'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 bookshelf-grid'>
        {skeletons.map((i) => (
          <div key={i} className='flex flex-col p-4 relative'>
            <div
              className='w-full aspect-[28/41] bg-base-100/10 rounded-lg animate-pulse shadow-md relative z-10'
              style={{ borderRight: '4px solid rgba(255,255,255,0.05)' }}
            ></div>
            <div className='w-3/4 h-3 bg-base-100/20 rounded animate-pulse mt-4 z-10'></div>
            <div className='w-1/2 h-2 bg-base-100/10 rounded animate-pulse mt-2 z-10'></div>
          </div>
        ))}
      </div>
    </div>
  );
};
