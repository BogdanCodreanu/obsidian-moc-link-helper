import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { DvPage, expandPage } from '../utils/fileUtils';
import PageTitle from './general/PageTitle';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import { debounce } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { TextSelect } from 'lucide-react';
import Description from './general/Description';
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
    console.log('Active file', activeFile);
    return activeFile.outPages;
  }, [activeFile]);

  const childOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => !p.isMoc);
  }, [allOutNotes]);

  const mocOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p.isMoc);
  }, [allOutNotes]);

  const subscribeToEvents = debounce(() => {
    view.registerEvent(
      plugin.app.workspace.on('file-links-helper:on-change-active-file', (file: DvPage) => {
        setActiveFile(file);
      }),
    );

    view.registerEvent(
      plugin.app.workspace.on('file-links-helper:on-shown-view-changed', (shown: boolean) => {
        if (!shown) {
          setActiveFile(undefined);
        }
      }),
    );
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
            expandPage(page, plugin.settings);
            setActiveFile(page);
            console.log('Self grabbed active file from view', page);
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
      <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s p-m overflow-auto">
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

            <div className='overflow-auto'>
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
