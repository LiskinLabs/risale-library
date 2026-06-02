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
      bg: 'from-primary/20 to-base-300',
      ribbon: 'bg-primary/80',
      iconInner: 'bg-primary/30',
      iconOuter: 'border-primary/40',
      line: 'bg-primary/60',
    },
    {
      bg: 'from-secondary/20 to-base-300',
      ribbon: 'bg-secondary/80',
      iconInner: 'bg-secondary/30',
      iconOuter: 'border-secondary/40',
      line: 'bg-secondary/60',
    },
    {
      bg: 'from-accent/20 to-base-300',
      ribbon: 'bg-accent/80',
      iconInner: 'bg-accent/30',
      iconOuter: 'border-accent/40',
      line: 'bg-accent/60',
    },
    {
      bg: 'from-neutral/20 to-base-300',
      ribbon: 'bg-neutral/80',
      iconInner: 'bg-neutral/30',
      iconOuter: 'border-neutral/40',
      line: 'bg-neutral/60',
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
    is3d = true,
    onImageError,
    onAspectRatioChange,
  }) => {
    const coverRef = useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const dynamicStyle = getDynamicCoverStyle(book.title || '')!;

    const coverSrc = book.metadata?.coverImageUrl || book.coverImageUrl;
    const hasValidSrc = coverSrc && coverSrc.length > 0;

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
      toggleImageVisibility(true);
    }, [book.metadata?.coverImageUrl, book.coverImageUrl]);

    return (
      <div
        ref={coverRef}
        className={clsx(
          'book-cover-container relative flex h-full w-full',
          is3d && 'book-3d-container',
          className,
        )}
      >
        <div className={clsx('relative h-full w-full', is3d && 'book-3d-cover')}>
          {is3d && <div className='book-3d-side' />}
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
            <div className={clsx('flex h-full w-full justify-start')}>
              <div
                className={clsx(
                  'flex h-full max-h-full items-end',
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
                    'cover-image fit-cover-img h-auto max-h-full w-auto max-w-full shadow-md',
                    is3d && 'book-gold-edge',
                    imageClassName,
                    imageError && 'hidden', // Hide broken image so it doesn't break layout
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
              'fallback-cover invisible absolute inset-0 p-3 premium-grain flex flex-col',
              `bg-gradient-to-br ${dynamicStyle.bg} shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]`,
              is3d && 'book-gold-edge',
              imageClassName,
            )}
          >
            <div className='absolute inset-[3px] border border-base-content/10 rounded-sm'></div>
            <div className='absolute inset-[6px] border border-base-content/5 rounded-sm pointer-events-none'></div>

            {/* Premium WOW bookmark ribbon */}
            {!isPreview && mode === 'grid' && (
              <div
                className={clsx(
                  'absolute top-0 right-4 w-4 h-10 shadow-md z-10',
                  dynamicStyle.ribbon,
                )}
              >
                <div className='absolute bottom-0 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-base-300 transform translate-y-full opacity-80'></div>
              </div>
            )}

            <div className='flex-1 flex flex-col items-center justify-center z-10 p-2'>
              <span
                className={clsx(
                  'font-serif font-bold tracking-wide text-center text-base-content drop-shadow-sm',
                  isPreview
                    ? 'line-clamp-2 text-[0.5em]'
                    : mode === 'grid'
                      ? 'line-clamp-4 text-lg'
                      : 'line-clamp-2 text-sm',
                )}
                style={{ fontFamily: 'Playfair Display, Lora, serif' }}
              >
                {formatTitle(book.title)}
              </span>

              <div className={clsx('w-8 h-[2px] my-2 sm:my-3', dynamicStyle.line)}></div>

              <span
                className={clsx(
                  'text-base-content/80 uppercase tracking-widest text-center font-medium px-1',
                  isPreview
                    ? 'text-[0.4em] line-clamp-1'
                    : mode === 'grid'
                      ? 'text-[9px] leading-tight line-clamp-3'
                      : 'text-[8px] line-clamp-2',
                )}
                style={{ wordBreak: 'break-word' }}
              >
                {formatAuthors(book.author || book.metadata?.author || '')}
              </span>
            </div>

            <div className='h-1/5 flex items-end justify-center pb-1 z-10'>
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border flex items-center justify-center',
                  dynamicStyle.iconOuter,
                )}
              >
                <div className={clsx('w-2.5 h-2.5 rounded-full', dynamicStyle.iconInner)}></div>
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
