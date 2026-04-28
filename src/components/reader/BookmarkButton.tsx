import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { bookmarks, type Bookmark } from '../../stores/readerStore';

interface Props {
  slug: string;
  title: string;
}

export const BookmarkButton = ({ slug, title }: Props) => {
  const currentBookmarks = useStore(bookmarks);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setIsBookmarked(currentBookmarks.some((b) => b.slug === slug && !b.hash));
  }, [currentBookmarks, slug]);

  const toggleBookmark = () => {
    if (isBookmarked) {
      bookmarks.set(currentBookmarks.filter((b) => b.slug !== slug || b.hash));
    } else {
      const newBookmark: Bookmark = {
        slug,
        title,
        date: Date.now(),
      };
      bookmarks.set([...currentBookmarks, newBookmark]);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      className={`flex items-center gap-2 rounded-full border-2 p-2 px-4 text-xs font-bold uppercase tracking-widest transition-all ${
        isBookmarked
          ? 'border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-600/20'
          : 'border-slate-200 bg-transparent text-slate-500 hover:border-amber-500 hover:text-amber-500 dark:border-slate-800'
      }`}
      title={isBookmarked ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className={`h-4 w-4 ${isBookmarked ? 'fill-current' : 'fill-none'}`}
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
        />
      </svg>
      {isBookmarked ? 'В избранном' : 'В избранное'}
    </button>
  );
};
