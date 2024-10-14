import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { addUpLinkToNote, DvPage, expandPage, removeUpLinkFromNote } from '../utils/fileUtils';
import PageTitle from './general/PageTitle';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import { debounce } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { TextSelect } from 'lucide-react';
import Description from './general/Description';
import ListOfItems from './ListOfItems';
import LinkButtons from './general/LinkButtons';

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
    return activeFile.outPages;
  }, [activeFile]);

  const childOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => !p.isMoc);
  }, [allOutNotes]);

  const mocOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p.isMoc);
  }, [allOutNotes]);

  const shownNotes =
    outNotesView === 'All' ? allOutNotes : outNotesView === 'Notes' ? childOutNotes : mocOutNotes;

  const subscribeToEvents = debounce(() => {
    view.registerEvent(
      plugin.app.workspace.on('file-links-helper:on-change-active-file', (file: DvPage) => {
        setActiveFile(file);
        console.log("Set active file", file);
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

  const addUpLinkToNotes = async (notes: DvPage[]) => {
    if (!activeFile) {
      return;
    }
    const allFiles = plugin.app.vault.getAllLoadedFiles();
    await Promise.all(
      notes.map((n) => addUpLinkToNote(n, activeFile, plugin.app, plugin.settings, allFiles)),
    );
  };

  const removeUpLinkFromNotes = async (notes: DvPage[]) => {
    if (!activeFile) {
      return;
    }
    await Promise.all(
      notes.map((n) => removeUpLinkFromNote(n, activeFile, plugin.app, plugin.settings)),
    );
  };

  if (!activeFile) {
    return <NoFileSelectedScreen />;
  }

  return (
    <div className="file-links-helper">
      <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s overflow-auto p-m">
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

            <div className="overflow-auto">
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

              <LinkButtons
                pages={shownNotes}
                parentPage={activeFile}
                useSelectedFiles={false}
                addUpLinkToNotes={addUpLinkToNotes}
                removeUpLinkFromNotes={removeUpLinkFromNotes}
              />

              <ListOfItems pages={shownNotes} parentPage={activeFile} type="SIMPLE" />
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
