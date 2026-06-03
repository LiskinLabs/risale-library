import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { memo, useEffect, useRef, useState } from 'react';
import { Book } from '@/types/book';
import { LibraryCoverFitType, LibraryViewModeType } from '@/types/settings';
import { formatAuthors, formatTitle } from '@/utils/book';

const getDynamicCoverStyle = (title: string) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const styles = [
    {
      bgClass: 'bg-primary',
      bgValue: 'var(--fallback-p, oklch(var(--p)))', // for custom CSS properties if needed
      text: 'text-primary-content',
      ribbon: 'bg-primary-focus mix-blend-overlay',
      iconInner: 'bg-primary-content opacity-50',
      iconOuter: 'border-primary-content opacity-30',
      line: 'bg-primary-content opacity-40',
      spineTheme: 'from-primary-focus to-primary',
    },
    {
      bgClass: 'bg-secondary',
      bgValue: 'var(--fallback-s, oklch(var(--s)))',
      text: 'text-secondary-content',
      ribbon: 'bg-secondary-focus mix-blend-overlay',
      iconInner: 'bg-secondary-content opacity-50',
      iconOuter: 'border-secondary-content opacity-30',
      line: 'bg-secondary-content opacity-40',
      spineTheme: 'from-secondary-focus to-secondary',
    },
    {
      bgClass: 'bg-accent',
      bgValue: 'var(--fallback-a, oklch(var(--a)))',
      text: 'text-accent-content',
      ribbon: 'bg-accent-focus mix-blend-overlay',
      iconInner: 'bg-accent-content opacity-50',
      iconOuter: 'border-accent-content opacity-30',
      line: 'bg-accent-content opacity-40',
      spineTheme: 'from-accent-focus to-accent',
    },
    {
      bgClass: 'bg-neutral',
      bgValue: 'var(--fallback-n, oklch(var(--n)))',
      text: 'text-neutral-content',
      ribbon: 'bg-neutral-focus mix-blend-overlay',
      iconInner: 'bg-neutral-content opacity-50',
      iconOuter: 'border-neutral-content opacity-30',
      line: 'bg-neutral-content opacity-40',
      spineTheme: 'from-neutral-focus to-neutral',
    },
  ];
  return styles[hash % styles.length];
};

interface BookCoverProps {
  book: Book;
  mode?: LibraryViewModeType;
  coverFit?: LibraryCoverFitType;
  className?: string;
  imageClassName?: string;
  showSpine?: boolean;
  isPreview?: boolean;
  is3d?: boolean;
  onImageError?: () => void;
  onAspectRatioChange?: (ratio: number) => void;
}

const BookCover: React.FC<BookCoverProps> = memo<BookCoverProps>(
  ({
    book,
    mode = 'grid',
    coverFit = 'crop',
    showSpine: _showSpine = false,
    className,
    imageClassName,
    isPreview,
    is3d = false,
    onImageError,
    onAspectRatioChange,
  }) => {
    const coverRef = useRef<HTMLDivElement>(null);
    const [imageError, setImageError] = useState(false);
    const dynamicStyle = getDynamicCoverStyle(book.title || '')!;

    const coverSrc = book.metadata?.coverImageUrl || book.coverImageUrl;
    // For builtin Risale books, their EPUB covers are half-white. We force the
    // beautiful dynamic themed fallback cover to achieve the "full length" wow-effect.
    const hasValidSrc = coverSrc && coverSrc.length > 0 && !book.builtin;

    const toggleImageVisibility = (showImage: boolean) => {
      if (coverRef.current) {
        const coverImage = coverRef.current.querySelector('.cover-image');
        const fallbackCover = coverRef.current.querySelector('.fallback-cover');
        if (coverImage) {
          coverImage.classList.toggle('invisible', !showImage);
        }
        if (fallbackCover) {
          fallbackCover.classList.toggle('invisible', showImage);
        }
      }
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageError(false);
      toggleImageVisibility(true);
      const img = e.currentTarget;
      if (onAspectRatioChange && img.naturalWidth > 0 && img.naturalHeight > 0) {
        onAspectRatioChange(img.naturalWidth / img.naturalHeight);
      }
    };

    const handleImageError = () => {
      setImageError(true);
      toggleImageVisibility(false);
      onImageError?.();
    };

    useEffect(() => {
      // If we don't have a valid source, we must show the fallback cover immediately.
      // If we do have a valid source, we start by showing the image (which might still be loading)
      // or we can start with fallback and let onLoad toggle it.
      // The old logic was starting with true.
      toggleImageVisibility(!!hasValidSrc);
    }, [book.metadata?.coverImageUrl, book.coverImageUrl, hasValidSrc]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!coverRef.current) return;
      const rect = coverRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      coverRef.current.style.setProperty('--mouse-x', `${x}`);
      coverRef.current.style.setProperty('--mouse-y', `${y}`);
      coverRef.current.style.setProperty('--glare-opacity', '1');
    };

    const handleMouseLeave = () => {
      if (!coverRef.current) return;
      coverRef.current.style.setProperty('--glare-opacity', '0');
      coverRef.current.style.setProperty('--mouse-x', '0.5');
      coverRef.current.style.setProperty('--mouse-y', '0.5');
    };

    return (
      <div
        ref={coverRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={clsx(
          'book-cover-container relative flex h-full w-full',
          is3d && 'book-3d-container',
          className,
        )}
        style={
          {
            '--book-bg': dynamicStyle.bgValue,
            '--mouse-x': '0.5',
            '--mouse-y': '0.5',
            '--glare-opacity': '0',
          } as React.CSSProperties
        }
      >
        <div className={clsx('relative h-full w-full', is3d && 'book-minimal-hover-wrapper')}>
          <div
            className={clsx(
              'relative w-full h-full z-10 overflow-hidden',
              is3d ? 'rounded-md shadow-apple-book' : 'rounded-[4px]',
            )}
          >
            {hasValidSrc && coverFit === 'crop' ? (
              <Image
                src={coverSrc!}
                alt={book.title}
                fill={true}
                sizes='(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 20vw, 15vw'
                loading={isPreview ? 'eager' : 'lazy'}
                draggable={false}
                className={clsx('cover-image crop-cover-img object-cover', imageClassName)}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : hasValidSrc ? (
              <div className={clsx('flex h-full w-full justify-start bg-base-100')}>
                <div
                  className={clsx(
                    'flex h-full max-h-full',
                    mode === 'grid' ? 'items-end' : 'items-center',
                  )}
                >
                  <Image
                    src={coverSrc!}
                    alt={book.title}
                    width={0}
                    height={0}
                    sizes='(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 20vw, 15vw'
                    loading={isPreview ? 'eager' : 'lazy'}
                    draggable={false}
                    className={clsx(
                      'cover-image fit-cover-img h-auto max-h-full w-auto max-w-full',
                      imageClassName,
                      imageError && 'hidden',
                    )}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>
              </div>
            ) : null}

            <div
              className={clsx(
                'fallback-cover invisible absolute inset-0 flex flex-col justify-between items-center text-center p-[4cqi] overflow-hidden',
                imageClassName,
              )}
              style={{ backgroundColor: '#a3161c', containerType: 'inline-size' }}
            >
              {/* Outer Golden Border Frame */}
              <div className='absolute inset-[3.5cqi] border-[1px] border-[#e4cc7b] z-0 opacity-80'></div>
              <div className='absolute inset-[4.5cqi] border-[2px] border-[#e4cc7b] z-0'></div>
              <div className='absolute inset-[6cqi] border-[1px] border-[#e4cc7b] z-0 opacity-80'></div>

              {/* Corner Ornaments (Simplified via CSS) */}
              <div className='absolute top-[4.5cqi] left-[4.5cqi] w-[3cqi] h-[3cqi] border-r-[2px] border-b-[2px] border-[#e4cc7b] z-0'></div>
              <div className='absolute top-[4.5cqi] right-[4.5cqi] w-[3cqi] h-[3cqi] border-l-[2px] border-b-[2px] border-[#e4cc7b] z-0'></div>
              <div className='absolute bottom-[4.5cqi] left-[4.5cqi] w-[3cqi] h-[3cqi] border-r-[2px] border-t-[2px] border-[#e4cc7b] z-0'></div>
              <div className='absolute bottom-[4.5cqi] right-[4.5cqi] w-[3cqi] h-[3cqi] border-l-[2px] border-t-[2px] border-[#e4cc7b] z-0'></div>

              <div className='z-10 flex flex-col items-center justify-start w-full pt-[8cqi] h-full relative'>
                {/* Top Text */}
                <span
                  className={clsx(
                    'text-[#e4cc7b] drop-shadow-sm',
                    isPreview ? 'text-[0.6em]' : mode === 'grid' ? 'text-[6cqi]' : 'text-xs',
                  )}
                  style={{ fontFamily: "'Great Vibes', cursive", opacity: 0.95 }}
                >
                  Risale-i Nur Külliyatından
                </span>

                {/* Title */}
                <div className='flex-1 flex items-center justify-center w-[90%]'>
                  <span
                    className={clsx(
                      'font-bold tracking-wide text-center drop-shadow-md',
                      isPreview
                        ? 'line-clamp-3 text-[1em]'
                        : mode === 'grid'
                          ? 'line-clamp-4'
                          : 'line-clamp-3 text-lg',
                    )}
                    style={{
                      fontFamily: "'Philosopher', 'Playfair Display', serif",
                      fontSize: '15cqi',
                      lineHeight: '1.2',
                      background: 'linear-gradient(180deg, #fff3c4 0%, #e4cc7b 50%, #b8973b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))',
                    }}
                  >
                    {formatTitle(book.title)}
                  </span>
                </div>

                {/* Author Info */}
                <div className='flex flex-col items-center pb-[4cqi] w-full'>
                  {(() => {
                    const authorName = formatAuthors(book.author || book.metadata?.author || '');
                    const isRisaleAuthor =
                      !authorName ||
                      authorName.toLowerCase().includes('said nursi') ||
                      authorName.toLowerCase().includes('bediüzzaman');

                    if (isRisaleAuthor) {
                      return (
                        <>
                          <span
                            className={clsx(
                              'font-serif font-bold text-[#e4cc7b]',
                              isPreview
                                ? 'text-[0.4em]'
                                : mode === 'grid'
                                  ? 'text-[4.5cqi]'
                                  : 'text-[10px]',
                            )}
                          >
                            Müellifi
                          </span>
                          <span
                            className={clsx(
                              'font-serif font-bold text-[#e4cc7b]',
                              isPreview
                                ? 'text-[0.5em]'
                                : mode === 'grid'
                                  ? 'text-[5.5cqi]'
                                  : 'text-xs',
                            )}
                          >
                            Bediüzzaman
                          </span>
                          <span
                            className={clsx(
                              'font-serif font-bold uppercase text-[#e4cc7b] tracking-wider',
                              isPreview
                                ? 'text-[0.6em]'
                                : mode === 'grid'
                                  ? 'text-[6cqi]'
                                  : 'text-sm',
                            )}
                          >
                            SAİD NURSİ
                          </span>
                        </>
                      );
                    }

                    return (
                      <span
                        className={clsx(
                          'font-serif font-bold text-[#e4cc7b]',
                          isPreview ? 'text-[0.6em]' : mode === 'grid' ? 'text-[6cqi]' : 'text-sm',
                        )}
                      >
                        {authorName}
                      </span>
                    );
                  })()}

                  {/* Fake Logo Element */}
                  <div className='mt-[2cqi] w-[14cqi] h-[14cqi] border-[1.5px] border-[#e4cc7b] rounded-full flex items-center justify-center'>
                    <div className='w-[10cqi] h-[10cqi] border border-[#e4cc7b] rounded-full flex items-center justify-center opacity-80'>
                      <div className='w-[6cqi] h-[3cqi] border-b border-[#e4cc7b] rounded-[50%]'></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apple Books Style Reflections and Glare */}
            {is3d && (
              <>
                <div className='absolute inset-0 border border-white/10 rounded-md pointer-events-none z-20 mix-blend-overlay shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)]'></div>
                <div className='absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-white/30 to-transparent pointer-events-none z-20 mix-blend-overlay rounded-l-md'></div>
                <div
                  className='glare-overlay absolute inset-0 pointer-events-none mix-blend-overlay rounded-md z-30'
                  style={{
                    background:
                      'radial-gradient(circle at calc(var(--mouse-x) * 100%) calc(var(--mouse-y) * 100%), rgba(255,255,255,0.4) 0%, transparent 60%)',
                    opacity: 'var(--glare-opacity)',
                    transition: 'opacity 0.2s ease-out',
                  }}
                ></div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.book.coverImageUrl === nextProps.book.coverImageUrl &&
      prevProps.book.metadata?.coverImageUrl === nextProps.book.metadata?.coverImageUrl &&
      prevProps.book.updatedAt === nextProps.book.updatedAt &&
      prevProps.mode === nextProps.mode &&
      prevProps.coverFit === nextProps.coverFit &&
      prevProps.isPreview === nextProps.isPreview &&
      prevProps.is3d === nextProps.is3d &&
      prevProps.showSpine === nextProps.showSpine &&
      prevProps.className === nextProps.className &&
      prevProps.imageClassName === nextProps.imageClassName
    );
  },
);

BookCover.displayName = 'BookCover';

export default BookCover;
