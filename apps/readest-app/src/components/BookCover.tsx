import clsx from 'clsx';
import Image from 'next/image';
import { memo, useEffect, useRef, useState } from 'react';
import { Book } from '@/types/book';
import { LibraryCoverFitType, LibraryViewModeType } from '@/types/settings';
import { formatAuthors, formatTitle } from '@/utils/book';
import { getAssetPath } from '@/utils/assetPath';

interface BookCoverProps {
  book: Book;
  mode?: LibraryViewModeType;
  coverFit?: LibraryCoverFitType;
  className?: string;
  imageClassName?: string;
  showSpine?: boolean;
  isPreview?: boolean;
  onImageError?: () => void;
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
    onImageError,
  }) => {
    const coverRef = useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

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

    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
      toggleImageVisibility(true);
    };

    const handleImageError = () => {
      setImageLoaded(false);
      setImageError(true);
      toggleImageVisibility(false);
      onImageError?.();
    };

    const coverUrl = getAssetPath(
      book.metadata?.coverImageUrl || book.coverImageUrl || '/covers/default.png',
    );

    useEffect(() => {
      toggleImageVisibility(true);
    }, [book.metadata?.coverImageUrl, book.coverImageUrl]);

    return (
      <div
        ref={coverRef}
        className={clsx('book-cover-container relative flex h-full w-full', className)}
      >
        <div
          className={clsx(
            'book-3d-object relative h-full w-full',
            mode === 'grid' && 'premium-transition hover-glow',
          )}
        >
          <div
            className={clsx(
              'absolute inset-0 z-20 overflow-hidden bg-[#0c1222]',
              mode === 'grid' ? 'border-premium-gold/20 rounded-r-lg border-l-[4px]' : 'rounded-lg',
            )}
          >
            {coverFit === 'crop' ? (
              <Image
                src={coverUrl}
                alt={book.title}
                fill={true}
                loading='lazy'
                className={clsx('cover-image crop-cover-img object-cover', imageClassName)}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className={clsx('flex h-full w-full justify-start')}>
                <div
                  className={clsx(
                    'flex h-full max-h-full items-end',
                    mode === 'grid' ? 'items-end' : 'items-center',
                  )}
                >
                  <Image
                    src={coverUrl}
                    alt={book.title}
                    width={0}
                    height={0}
                    sizes='100vw'
                    loading='lazy'
                    className={clsx(
                      'cover-image fit-cover-img h-auto max-h-full w-auto max-w-full',
                      imageClassName,
                    )}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>
              </div>
            )}

            <div
              className={clsx(
                'fallback-cover invisible absolute inset-0 p-2',
                'text-neutral-content text-center font-serif font-medium',
                isPreview ? 'bg-base-200/50' : 'bg-base-100',
                imageClassName,
              )}
            >
              <div className='flex h-1/2 items-center justify-center'>
                <span
                  className={clsx(
                    isPreview ? 'line-clamp-2' : mode === 'grid' ? 'line-clamp-3' : 'line-clamp-2',
                    isPreview ? 'text-[0.5em]' : mode === 'grid' ? 'text-lg' : 'text-sm',
                  )}
                >
                  {formatTitle(book.title)}
                </span>
              </div>
              <div className='h-1/6'></div>
              <div className='flex h-1/3 items-center justify-center'>
                <span
                  className={clsx(
                    'text-neutral-content/50 line-clamp-1',
                    isPreview ? 'text-[0.4em]' : mode === 'grid' ? 'text-base' : 'text-xs',
                  )}
                >
                  {formatAuthors(book.author)}
                </span>
              </div>
            </div>

            <div
              className={`book-spine absolute inset-0 ${shouldShowSpine ? 'visible' : 'invisible'}`}
            />
          </div>
          {mode === 'grid' && (
            <>
              <div className='book-side z-10' />
              <div className='page-edge z-0' />
            </>
          )}
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
      prevProps.showSpine === nextProps.showSpine &&
      prevProps.className === nextProps.className &&
      prevProps.imageClassName === nextProps.imageClassName
    );
  },
);

BookCover.displayName = 'BookCover';

export default BookCover;
