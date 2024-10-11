import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { DvLink, DvPage } from '../utils/fileUtils';
import PageTitle from './general/PageTitle';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import { debounce } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { TextSelect } from 'lucide-react';
import Description from './general/Description';
import { getAPI } from 'obsidian-dataview';
import ListOfItems from './ListOfItems';

type SCREENS = 'INLINKS' | 'OUTLINKS';
type OutNotesView = 'All' | 'Notes' | 'MOC';

export const SideView = () => {
  const { plugin, view } = useApp();

  const [activeFile, setActiveFile] = useState<DvPage | undefined>(undefined);
  const [screen, setScreen] = useState<SCREENS>('OUTLINKS');
  const [outNotesView, setOutNotesView] = useState<OutNotesView>('All');

  const allOutNotes = useMemo<DvPage[]>(() => {
    if (!activeFile) {
      return [];
    }
    const dv = getAPI();

    console.log('Active file outlinks', activeFile.file.outlinks);
    // remove up links if only 1 outlink

    const outPages = [...new Set(activeFile.file.outlinks.map((l: DvLink) => l.path))]
      .map((p: string) => dv.page(p))
      .filter((p: DvPage) => !!p);
    return outPages;
  }, [activeFile]);

  const childOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p?.isMoc);
  }, [allOutNotes]);

  const mocOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p?.isMoc);
  }, [allOutNotes]);

  const subscribeToEvents = debounce(() => {
    view.registerEvent(
      plugin.app.workspace.on('file-links-helper:on-change-active-file', (file: DvPage) => {
        setActiveFile(file);
        console.log('Active file changed', file);
      }),
    );
    console.log('Registered events in SideView');
  }, 200);

  useEffect(() => {
    subscribeToEvents();
  }, []);

  useEffect(() => {
    if (!activeFile) {
      const interval = setInterval(() => {
        if (!activeFile) {
          const page = getCurrentOpenFile(plugin);
          if (page) {
            setActiveFile(page);
          }
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [activeFile]);

  const onScreenChange = (screen: SCREENS) => {
    setScreen(screen);
  };

  const onOutNotesViewChange = (view: OutNotesView) => {
    setOutNotesView(view);
  };

  if (!activeFile) {
    return <NoFileSelectedScreen />;
  }

  return (
    <div className="file-links-helper">
      <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s p-m">
        <PageTitle page={activeFile} />

        <ToggleButtonGroup
          options={[
            { label: 'Notes Included', value: 'OUTLINKS' },
            { label: 'Missing Notes', value: 'INLINKS' },
          ]}
          selectedOption={screen}
          onOptionSelected={onScreenChange}
        />

        {screen === 'OUTLINKS' ? (
          <div className="flex flex-col gap-xs p-s">
            <Description
              text={
                <div>
                  Notes included in this{' '}
                  <span className="font-semibold text-text-accent">
                    {plugin.settings.parentTag}
                  </span>{' '}
                  parent note. You can quickly modify their{' '}
                  <span className="font-semibold text-text-accent">
                    {plugin.settings.upPropName}
                  </span>{' '}
                  link in relation to this parent note. You can also
                  <span className="mx-xs inline-block">
                    <TextSelect size={15} />
                  </span>
                  select text to choose specific notes.
                </div>
              }
            />

            <ToggleButtonGroup
              options={[
                { label: 'All', value: 'All' },
                { label: 'Notes', value: 'Notes' },
                { label: plugin.settings.parentTag, value: 'MOC' },
              ]}
              selectedOption={outNotesView}
              onOptionSelected={onOutNotesViewChange}
              mergeBottom
            />

            <ListOfItems
              pages={
                outNotesView === 'All'
                  ? allOutNotes
                  : outNotesView === 'Notes'
                    ? childOutNotes
                    : mocOutNotes
              }
              parentPage={activeFile}
              type="SIMPLE"
            />
          </div>
        ) : screen === 'INLINKS' ? (
          <></>
        ) : null}

        {/* {activeFile.isMoc ? (
        <>
          {inLinksNotInFile.length > 0 && inLinksNotInFileComponent}

          {outNotesInParent}
        </>
      ) : (
        <ChildNoteView settings={settings} upFiles={upFiles} activeFile={activeFile} />
      )} */}
      </div>
    </div>
  );
};
