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
    showSpine = false,
    className,
    imageClassName,
    isPreview,
    is3d = false,
    onImageError,
    onAspectRatioChange,
  }) => {
    const coverRef = useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const dynamicStyle = getDynamicCoverStyle(book.title || '')!;

    const coverSrc = book.metadata?.coverImageUrl || book.coverImageUrl;
    // For builtin Risale books, their EPUB covers are half-white. We force the
    // beautiful dynamic themed fallback cover to achieve the "full length" wow-effect.
    const hasValidSrc = coverSrc && coverSrc.length > 0 && !book.builtin;

    const shouldShowSpine = showSpine && imageLoaded && !imageError;

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
      setImageLoaded(true);
      setImageError(false);
      toggleImageVisibility(true);
      const img = e.currentTarget;
      if (onAspectRatioChange && img.naturalWidth > 0 && img.naturalHeight > 0) {
        onAspectRatioChange(img.naturalWidth / img.naturalHeight);
      }
    };

    const handleImageError = () => {
      setImageLoaded(false);
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
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      coverRef.current.style.setProperty('--mouse-x', `${x}%`);
      coverRef.current.style.setProperty('--mouse-y', `${y}%`);
      coverRef.current.style.setProperty('--glare-opacity', '1');
    };

    const handleMouseLeave = () => {
      if (!coverRef.current) return;
      coverRef.current.style.setProperty('--glare-opacity', '0');
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
            '--mouse-x': '50%',
            '--mouse-y': '50%',
            '--glare-opacity': '0',
          } as React.CSSProperties
        }
      >
        <div className={clsx('relative h-full w-full', is3d && 'book-3d-wrapper')}>
          {is3d && (
            <>
              <div className='book-3d-back'></div>
              <div className='book-3d-spine'></div>
              <div className='book-3d-page page-5'></div>
              <div className='book-3d-page page-4'></div>
              <div className='book-3d-page page-3'></div>
              <div className='book-3d-page page-2'></div>
              <div className='book-3d-page page-1 flex flex-col items-center justify-center p-3 text-center overflow-hidden bg-base-100'>
                <div className='w-full h-full border border-base-content/10 rounded-sm flex flex-col items-center justify-center p-2'>
                  <h3 className='font-serif text-[10px] leading-tight font-bold text-base-content'>
                    {formatTitle(book.title)}
                  </h3>
                  <div className={clsx('mt-2 w-4 h-[1px]', dynamicStyle.line)}></div>
                  <p className='text-[7px] text-base-content/70 mt-2 uppercase tracking-wider'>
                    {formatAuthors(book.author || book.metadata?.author || '')}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className={clsx(is3d ? 'book-3d-front' : 'relative h-full w-full')}>
            {is3d && <div className='book-3d-front-inside'></div>}

            <div
              className={clsx(
                'relative w-full h-full z-10 overflow-hidden',
                is3d ? 'rounded-r-[4px] book-front-content' : 'rounded-[4px]',
                dynamicStyle.bgClass,
              )}
            >
              {hasValidSrc && coverFit === 'crop' ? (
                <>
                  <Image
                    src={coverSrc!}
                    alt={book.title}
                    fill={true}
                    loading='lazy'
                    draggable={false}
                    className={clsx(
                      'cover-image crop-cover-img object-cover',
                      is3d && 'book-gold-edge',
                      imageClassName,
                    )}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                  <div
                    className={`book-spine absolute inset-0 ${shouldShowSpine ? 'visible' : 'invisible'}`}
                  />
                </>
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
                      sizes='100vw'
                      loading='lazy'
                      draggable={false}
                      className={clsx(
                        'cover-image fit-cover-img h-auto max-h-full w-auto max-w-full',
                        is3d && 'book-gold-edge',
                        imageClassName,
                        imageError && 'hidden',
                      )}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                    <div
                      className={`book-spine absolute inset-0 ${shouldShowSpine ? 'visible' : 'invisible'}`}
                    />
                  </div>
                </div>
              ) : null}

              <div
                className={clsx(
                  'fallback-cover invisible absolute inset-0 p-[4cqi] premium-grain flex flex-col @container shadow-[inset_0_0_24px_rgba(0,0,0,0.4)]',
                  is3d && 'book-gold-edge',
                  dynamicStyle.bgClass,
                  imageClassName,
                  dynamicStyle.text,
                )}
                style={{ containerType: 'inline-size' }}
              >
                <div className='absolute inset-[3px] border border-white/10 rounded-sm'></div>
                <div className='absolute inset-[6px] border border-white/5 rounded-sm pointer-events-none'></div>
                <div
                  className='glare-overlay absolute inset-0 pointer-events-none mix-blend-overlay'
                  style={{
                    background: `radial-gradient(
                    circle at var(--mouse-x) var(--mouse-y),
                    rgba(255, 255, 255, 0.4) 0%,
                    rgba(255, 255, 255, 0) 50%
                  )`,
                    opacity: 'var(--glare-opacity)',
                  }}
                ></div>

                {!isPreview && mode === 'grid' && (
                  <div
                    className={clsx(
                      'absolute top-0 right-[8cqi] w-[12cqi] h-[30cqi] shadow-md z-10',
                      dynamicStyle.ribbon,
                    )}
                  >
                    <div className='absolute bottom-0 w-0 h-0 border-l-[6cqi] border-r-[6cqi] border-b-[6cqi] border-l-transparent border-r-transparent border-b-base-300 transform translate-y-full opacity-80 mix-blend-overlay'></div>
                  </div>
                )}

                <div className='flex-1 flex flex-col items-center justify-center z-10 p-[2cqi] relative'>
                  <span
                    className={clsx(
                      'font-serif font-bold tracking-wide text-center drop-shadow-md gold-foil',
                      isPreview
                        ? 'line-clamp-2 text-[0.8em]'
                        : mode === 'grid'
                          ? 'line-clamp-4'
                          : 'line-clamp-2 text-sm',
                    )}
                    style={{
                      fontFamily: 'Playfair Display, Lora, serif',
                      fontSize: '15cqi',
                      lineHeight: '1.25',
                    }}
                  >
                    {formatTitle(book.title)}
                  </span>

                  <div
                    className={clsx('my-[4cqi] w-8 h-[2px] opacity-70', dynamicStyle.line)}
                  ></div>

                  <span
                    className={clsx(
                      'uppercase tracking-widest text-center font-medium opacity-80 gold-foil',
                      isPreview ? 'text-[0.5em]' : 'text-[7cqi]',
                    )}
                    style={{ wordBreak: 'break-word', fontSize: '6cqi', lineHeight: '1.3' }}
                  >
                    {formatAuthors(book.author || book.metadata?.author || '')}
                  </span>
                </div>

                <div className='h-[20cqi] flex items-end justify-center pb-[2cqi] z-10'>
                  <div
                    className={clsx(
                      'w-[8cqi] h-[8cqi] rounded-full border flex items-center justify-center shadow-sm',
                      dynamicStyle.iconOuter,
                    )}
                  >
                    <div
                      className={clsx('w-[4cqi] h-[4cqi] rounded-full', dynamicStyle.iconInner)}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
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
