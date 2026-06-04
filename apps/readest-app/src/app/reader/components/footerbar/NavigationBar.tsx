import clsx from 'clsx';
import React from 'react';
import { IoIosList as TOCIcon } from 'react-icons/io';
import { RxSlider as SliderIcon } from 'react-icons/rx';
import { PiSun as ColorIcon, PiRobot } from 'react-icons/pi';
import { LuNotebookPen } from 'react-icons/lu';
import { useEnv } from '@/context/EnvContext';
import { useNotebookStore } from '@/store/notebookStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useSidebarStore } from '@/store/sidebarStore';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import Button from '@/components/Button';
import { Insets } from '@/types/misc';

interface NavigationBarProps {
  bookKey: string;
  actionTab: string;
  gridInsets: Insets;
  forceMobileLayout: boolean;
  onSetActionTab: (tab: string) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  bookKey: _bookKey,
  actionTab,
  gridInsets,
  forceMobileLayout,
  onSetActionTab,
}) => {
  const isMobile = forceMobileLayout || window.innerWidth < 640 || window.innerHeight < 640;
  const _ = useTranslation();
  const { appService } = useEnv();
  const { isSideBarVisible, isSideBarPinned } = useSidebarStore();
  const { setNotebookVisible, setNotebookActiveTab, isNotebookVisible } = useNotebookStore();
  const aiEnabled = useSettingsStore((s) => s.settings?.aiSettings?.enabled ?? false);

  const tocIconSize = useResponsiveSize(23);
  const navPadding = isMobile ? `${gridInsets.bottom * 0.33 + 16}px` : '0px';

  const openNotebook = (tab: 'notes' | 'ai') => {
    setNotebookActiveTab(tab);
    setNotebookVisible(true);
  };

  return (
    <div
      className={clsx(
        'not-eink:bg-base-200 eink:bg-base-100 z-30 mt-auto flex w-full justify-between px-4 py-3',
        'eink:border-base-content eink:border-t',
        !forceMobileLayout && 'sm:hidden',
      )}
      style={{
        paddingBottom: appService?.isAndroidApp
          ? `calc(env(safe-area-inset-bottom) + 16px)`
          : navPadding,
      }}
    >
      {isSideBarVisible && isSideBarPinned ? null : (
        <Button
          label={_('TOC')}
          icon={<TOCIcon size={tocIconSize} />}
          onClick={() => onSetActionTab('toc')}
        />
      )}
      <Button
        label={_('Notlar')}
        icon={<LuNotebookPen className={clsx(isNotebookVisible && 'text-blue-500')} />}
        onClick={() => openNotebook('notes')}
      />
      {aiEnabled && (
        <Button
          label={_('AI')}
          icon={<PiRobot className={clsx(isNotebookVisible && 'text-blue-500')} />}
          onClick={() => openNotebook('ai')}
        />
      )}
      <Button
        label={_('Appearance')}
        icon={
          <ColorIcon
            className={clsx((actionTab === 'color' || actionTab === 'font') && 'text-blue-500')}
          />
        }
        onClick={() => onSetActionTab('font')}
      />
      <Button
        label={_('Progress')}
        icon={<SliderIcon className={clsx(actionTab === 'progress' && 'text-blue-500')} />}
        onClick={() => onSetActionTab('progress')}
      />
    </div>
  );
};
