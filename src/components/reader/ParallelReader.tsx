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
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:gap-0 my-12 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {children}
    </div>
  );
};
