import React from 'react';

interface Props {
  children?: React.ReactNode;
}

/**
 * ParallelReader component.
 * In Astro, use slots for original and translation content:
 * <ParallelReader client:load>
 *   <div slot="original">...</div>
 *   <div slot="translation">...</div>
 * </ParallelReader>
 */
export const ParallelReader = ({ children }: Props) => {
  return (
    <div className='my-12 flex flex-col gap-0 overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md lg:grid lg:grid-cols-2 lg:gap-0'>
      {children}
    </div>
  );
};
