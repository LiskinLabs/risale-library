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
    const [currentCoverIdx, setCurrentCoverIdx] = useState(0);

    const shouldShowSpine = showSpine; // Always show spine for both loaded image and fallback

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

    const getPotentialCoverUrls = () => {
      const base = book.metadata?.coverImageUrl || book.coverImageUrl || '';
      if (!base || base === '/covers/default.png') return [getAssetPath('/covers/default.png')];

      const filename = base.split('/').pop() || '';
      const urls = [getAssetPath(base)];

      // Try common language prefixes if the original fails
      if (!filename.includes('_')) {
        urls.push(getAssetPath(`/covers/ar_${filename}`));
        urls.push(getAssetPath(`/covers/tr_${filename}`));
        urls.push(getAssetPath(`/covers/ru_${filename}`));
      }

      return urls;
    };

    const potentialUrls = getPotentialCoverUrls();
    const coverUrl = potentialUrls[currentCoverIdx] || potentialUrls[0]!;

    const handleImageError = () => {
      if (currentCoverIdx < potentialUrls.length - 1) {
        setCurrentCoverIdx(currentCoverIdx + 1);
      } else {
        setImageLoaded(false);
        setImageError(true);
        toggleImageVisibility(false);
        onImageError?.();
      }
    };

    useEffect(() => {
      setCurrentCoverIdx(0);
      setImageError(false);
      setImageLoaded(false);
      toggleImageVisibility(true);
    }, [book.metadata?.coverImageUrl, book.coverImageUrl]);

    const getCategoryGradient = () => {
      const titleLower = formatTitle(book.title).toLowerCase();
      if (titleLower.includes('külliyat') || titleLower.includes('kulliyat')) {
        return 'bg-kulliyat-cover';
      }
      if (titleLower.includes('lâhika') || titleLower.includes('lahika')) {
        return 'bg-lahikalar-cover';
      }
      if (titleLower.includes('risale') || titleLower.includes('sözler') || titleLower.includes('mektubat') || titleLower.includes('lem\'alar') || titleLower.includes('şualar')) {
        return 'bg-risaleler-cover';
      }
      return 'bg-default-cover';
    };

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
              mode === 'grid' ? 'border-premium-gold/30 rounded-r-lg border-l-[4px]' : 'rounded-lg',
            )}
          >
            {!imageError && (
              <>
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
              </>
            )}

            <div
              className={clsx(
                'fallback-cover absolute inset-0 p-4',
                'flex flex-col items-center justify-center text-center',
                getCategoryGradient(),
                imageLoaded && !imageError ? 'invisible' : 'visible',
                imageClassName,
              )}
            >
              <div className='premium-glass absolute inset-2 rounded-md opacity-20' />
              <div className='z-10 flex flex-col gap-4'>
                <span
                  className={clsx(
                    'gold-foil-glow font-serif font-bold leading-tight',
                    isPreview ? 'text-[0.6em]' : mode === 'grid' ? 'text-xl' : 'text-sm',
                    'line-clamp-4',
                  )}
                >
                  {formatTitle(book.title)}
                </span>
                <div className='bg-premium-gold/30 mx-auto h-[1px] w-12' />
                <span
                  className={clsx(
                    'text-premium-gold/60 font-medium uppercase tracking-widest',
                    isPreview ? 'text-[0.4em]' : mode === 'grid' ? 'text-[10px]' : 'text-[8px]',
                    'line-clamp-2',
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
