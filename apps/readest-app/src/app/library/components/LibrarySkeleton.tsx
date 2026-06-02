import React from 'react';

export const LibrarySkeleton: React.FC = () => {
  // Generate 12 skeleton books
  const skeletons = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className='absolute inset-0 z-40 bg-base-200/50 backdrop-blur-sm p-4 overflow-hidden pt-8'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
        {skeletons.map((i) => (
          <div key={i} className='flex flex-col gap-2'>
            <div className='w-full aspect-[28/41] bg-base-300 rounded animate-pulse shadow-sm'></div>
            <div className='w-3/4 h-3 bg-base-300 rounded animate-pulse mt-2'></div>
            <div className='w-1/2 h-2 bg-base-300 rounded animate-pulse'></div>
          </div>
        ))}
      </div>
    </div>
  );
};
