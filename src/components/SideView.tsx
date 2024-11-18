import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { DvPage, expandPage } from '../utils/fileUtils';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import { debounce } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { Frown } from 'lucide-react';
import Description from './general/Description';
import { ChildNoteView } from './ChildNoteView';
import { ParentNoteView } from './ParentNoteView';

export const SideView = () => {
  const { plugin, view } = useApp();

  const [activePage, setActivePage] = useState<DvPage | undefined>(undefined);
  const [isShown, setIsShown] = useState(true);
  const [dataviewReady, setDataviewReady] = useState(plugin.isDataviewReady);

  const subscribeToEvents = debounce(() => {
    view.registerEvent(
      plugin.app.workspace.on('moc-link-helper:on-change-active-file', (file: DvPage) => {
        setActivePage(file);
      }),
    );

    view.registerEvent(
      plugin.app.metadataCache.on('dataview:index-ready', () => {
        setDataviewReady(true);
      }),
    );

    view.registerEvent(
      plugin.app.workspace.on('moc-link-helper:on-shown-view-changed', (shown: boolean) => {
        setIsShown(shown);
        if (!shown) {
          setActivePage(undefined);
        }
      }),
    );
  }, 200);

  useEffect(() => {
    if (!isShown || !plugin.isViewVisible() || !dataviewReady) {
      return;
    }

    if (!activePage) {
      const interval = setInterval(() => {
        if (!activePage && dataviewReady) {
          const page = getCurrentOpenFile(plugin);
          if (page) {
            expandPage(page, plugin.settings);
            setActivePage(page);
          }
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [activePage, isShown, dataviewReady]);

  useEffect(() => {
    if (!dataviewReady) {
      return;
    }
    subscribeToEvents();
  }, [dataviewReady]);

  if (!dataviewReady) {
    return (
      <Description
        bigCenterIcon={<Frown size={32} />}
        text="Dataview plugin not detected. This plugin requires Dataview to work. If you just installed the plugin, please reload the app."
      />
    );
  }

  if (!activePage) {
    return <NoFileSelectedScreen />;
  }

  if (!activePage.isMoc) {
    return <ChildNoteView activePage={activePage} dataviewReady={dataviewReady} />;
  }

  return <ParentNoteView activePage={activePage} dataviewReady={dataviewReady} isShown={isShown} />;
};
