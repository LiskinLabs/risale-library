import clsx from 'clsx';
import React, { useCallback, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { PiPlus } from 'react-icons/pi';
import { PiSelectionAll, PiSelectionAllFill } from 'react-icons/pi';
import { PiDotsThreeCircle } from 'react-icons/pi';
import { MdOutlineMenu } from 'react-icons/md';
import { IoMdCloseCircle } from 'react-icons/io';

import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';
import { useTrafficLight } from '@/hooks/useTrafficLight';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { debounce } from '@/utils/debounce';
import useShortcuts from '@/hooks/useShortcuts';
import WindowButtons from '@/components/WindowButtons';
import Dropdown from '@/components/Dropdown';
import SettingsMenu from './SettingsMenu';
import ImportMenu from './ImportMenu';
import ViewMenu from './ViewMenu';

interface LibraryHeaderProps {
  isSelectMode: boolean;
  isSelectAll: boolean;
  onPullLibrary: () => void;
  onImportBooksFromFiles: () => void;
  onImportBooksFromDirectory?: () => void;
  onOpenCatalogManager: () => void;
  onToggleSelectMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  isSelectMode,
  isSelectAll,
  onPullLibrary,
  onImportBooksFromFiles,
  onImportBooksFromDirectory,
  onOpenCatalogManager,
  onToggleSelectMode,
  onSelectAll,
  onDeselectAll,
}) => {
  const _ = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appService } = useEnv();
  const { systemUIVisible, statusBarHeight } = useThemeStore();
  const { currentBookshelf } = useLibraryStore();
  const { isTrafficLightVisible } = useTrafficLight();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');

  const headerRef = useRef<HTMLDivElement>(null);
  const iconSize18 = useResponsiveSize(18);
  const { safeAreaInsets: insets } = useThemeStore();

  useShortcuts({
    onToggleSelectMode,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQueryParam = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`);
    }, 500),
    [searchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedUpdateQueryParam(newQuery);
  };

  const windowButtonVisible = appService?.hasWindowBar && !isTrafficLightVisible;
  const currentBooksCount = currentBookshelf.reduce(
    (acc, item) => acc + ('books' in item ? item.books.length : 1),
    0,
  );

  if (!insets) return null;

  const isMobile = appService?.isMobile || window.innerWidth <= 640;

  return (
    <div
      ref={headerRef}
      className={clsx(
        'titlebar premium-transition z-50 flex h-[64px] w-full items-center bg-white/5 py-2 pr-4 backdrop-blur-md sm:h-[60px] dark:bg-black/5',
        windowButtonVisible ? 'sm:pr-4' : 'sm:pr-6',
        isTrafficLightVisible ? 'pl-16' : 'pl-0 sm:pl-2',
      )}
      style={{
        marginTop: appService?.hasSafeAreaInset
          ? `max(${insets.top}px, ${systemUIVisible ? statusBarHeight : 0}px)`
          : appService?.hasTrafficLight
            ? '-2px'
            : '0px',
      }}
    >
      <div className='flex w-full items-center justify-between space-x-6 sm:space-x-12'>
        <div className='flex items-center gap-2 pl-4'>
          <div className='nur-logo-container scale-75 sm:scale-90'>
            <div className='nur-logo-core' />
            <div className='nur-logo-wing wing-left' />
            <div className='nur-logo-wing wing-right' />
          </div>
          <div className='hidden lg:block'>
            <span className='shelf-title text-premium-gold text-lg font-light uppercase tracking-[0.2em]'>
              Risale
            </span>
          </div>
        </div>

        <div className='exclude-title-bar-mousedown relative flex w-full items-center'>
          <div className='relative flex h-10 w-full items-center sm:h-9'>
            <span className='text-premium-gold/50 absolute ps-4'>
              <FaSearch className='h-3.5 w-3.5' />
            </span>
            <input
              type='text'
              value={searchQuery}
              placeholder={
                currentBooksCount > 1
                  ? _('Search in {{count}} Book(s)...', {
                      count: currentBooksCount,
                    })
                  : _('Search Books...')
              }
              onChange={handleSearchChange}
              spellCheck='false'
              className={clsx(
                'search-input input h-10 w-full rounded-full pr-[30%] ps-11 sm:h-9',
                'bg-base-content/5 border-base-content/5 focus:border-premium-gold/30 border',
                'premium-transition font-sans text-sm font-medium tracking-tight',
                'placeholder:text-base-content/30 truncate',
                'focus:outline-none focus:ring-0',
              )}
            />
          </div>
          <div className='text-base-content/40 absolute right-4 flex items-center space-x-2 sm:space-x-4'>
            {searchQuery && (
              <button
                type='button'
                onClick={() => {
                  setSearchQuery('');
                  debouncedUpdateQueryParam('');
                }}
                className='hover:text-premium-gold premium-transition pe-1'
                aria-label={_('Clear Search')}
              >
                <IoMdCloseCircle className='h-4 w-4' />
              </button>
            )}
            <span className='bg-base-content/10 mx-2 h-4 w-[0.5px]'></span>
            <Dropdown
              label={_('Import Books')}
              className={clsx(
                'exclude-title-bar-mousedown dropdown-bottom dropdown-center cursor-pointer',
              )}
              buttonClassName='p-0 h-8 min-h-8 w-8 flex touch-target items-center justify-center !bg-transparent hover:text-premium-gold premium-transition'
              toggleButton={<PiPlus role='none' className='m-0.5 h-5 w-5' />}
            >
              <ImportMenu
                onImportBooksFromFiles={onImportBooksFromFiles}
                onImportBooksFromDirectory={onImportBooksFromDirectory}
                onOpenCatalogManager={onOpenCatalogManager}
              />
            </Dropdown>
            {isMobile ? null : (
              <button
                onClick={onToggleSelectMode}
                aria-label={_('Select Books')}
                title={_('Select Books')}
                className='hover:text-premium-gold premium-transition flex h-8 w-8 items-center justify-center'
              >
                {isSelectMode ? (
                  <PiSelectionAllFill role='button' className='text-premium-gold h-5 w-5' />
                ) : (
                  <PiSelectionAll role='button' className='h-5 w-5' />
                )}
              </button>
            )}
          </div>
        </div>
        {isSelectMode ? (
          <div className={clsx('flex h-full items-center', 'w-max-[80px] w-min-[80px]')}>
            <button
              onClick={isSelectAll ? onDeselectAll : onSelectAll}
              className='btn btn-ghost text-premium-gold premium-transition h-9 min-h-9 w-[80px] p-0'
              aria-label={isSelectAll ? _('Deselect') : _('Select All')}
            >
              <span className='font-sans text-xs font-bold uppercase tracking-wider'>
                {isSelectAll ? _('Deselect') : _('Select All')}
              </span>
            </button>
          </div>
        ) : (
          <div className='flex h-full items-center gap-x-3 pr-2 sm:gap-x-4'>
            <Dropdown
              label={_('View Menu')}
              className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
              buttonClassName='btn btn-ghost h-9 min-h-9 w-9 p-0 hover:text-premium-gold premium-transition'
              toggleButton={<PiDotsThreeCircle role='none' size={20} />}
            >
              <ViewMenu />
            </Dropdown>
            <Dropdown
              label={_('Settings Menu')}
              className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
              buttonClassName='btn btn-ghost h-9 min-h-9 w-9 p-0 hover:text-premium-gold premium-transition'
              toggleButton={<MdOutlineMenu role='none' size={20} />}
            >
              <SettingsMenu onPullLibrary={onPullLibrary} />
            </Dropdown>
            {appService?.hasWindowBar && (
              <WindowButtons
                headerRef={headerRef}
                showMinimize={windowButtonVisible}
                showMaximize={windowButtonVisible}
                showClose={windowButtonVisible}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryHeader;
