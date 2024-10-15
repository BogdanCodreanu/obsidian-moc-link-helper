import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { addUpLinkToNote, DvPage, expandPage, removeUpLinkFromNote } from '../utils/fileUtils';
import PageTitle from './general/PageTitle';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import { debounce } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { Notebook, TextSelect } from 'lucide-react';
import Description from './general/Description';
import ListOfItems from './ListOfItems';
import LinkButtons from './general/LinkButtons';
import { getFilesFromText } from '../utils/text';
import Header from './general/Header';
import { getAPI } from 'obsidian-dataview';

type SCREENS = 'INLINKS' | 'OUTLINKS';
type OutNotesView = 'All' | 'Notes' | 'MOC';

const SELECTION_UPDATE_INTERVAL = 500;

export const SideView = () => {
  const { plugin, view } = useApp();

  const [activeFile, setActiveFile] = useState<DvPage | undefined>(undefined);
  const [screen, setScreen] = useState<SCREENS>('OUTLINKS');
  const [outNotesView, setOutNotesView] = useState<OutNotesView>('All');
  const [selectedPages, setSelectedPages] = useState<DvPage[]>([]);
  const [isShown, setIsShown] = useState(true);

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
        console.log('Set active file', file);
      }),
    );

    view.registerEvent(
      plugin.app.workspace.on('file-links-helper:on-shown-view-changed', (shown: boolean) => {
        setIsShown(shown);
        if (!shown) {
          setActiveFile(undefined);
        }
      }),
    );
  }, 200);

  useEffect(() => {
    if (!isShown || !plugin.isViewVisible()) {
      return;
    }

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
  }, [activeFile, isShown]);

  useEffect(() => {
    subscribeToEvents();
  }, []);

  // UPDATE ACTIVE FILE SELECTION
  useEffect(() => {
    if (!isShown || !plugin.isViewVisible()) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!isShown || !plugin.isViewVisible()) {
        return;
      }

      const activeEditor = plugin.app.workspace.activeEditor;

      if (!activeEditor || !activeEditor.editor || !activeFile) {
        if (selectedPages.length > 0) {
          const dv = getAPI();
          setSelectedPages((pages) =>
            pages.map((p) => expandPage(dv.page(p.file.path), plugin.settings, false)),
          );
        }
        return;
      }

      const selections = activeEditor.editor.listSelections();

      if (selections.length > 1 || selections.length === 0) {
        return;
      }

      const minLine = Math.min(selections[0].head.line, selections[0].anchor.line);
      const maxLine = Math.max(selections[0].head.line, selections[0].anchor.line);
      const minChar = Math.min(selections[0].head.ch, selections[0].anchor.ch);
      const maxChar = Math.max(selections[0].head.ch, selections[0].anchor.ch);

      if (minLine !== maxLine || minChar !== maxChar) {
        const currentText = activeEditor.editor.getRange(
          { line: minLine, ch: 0 },
          { line: maxLine + 1, ch: 0 },
        );

        const allFiles = plugin.app.vault.getAllLoadedFiles();
        const files = getFilesFromText(currentText, allFiles, plugin.settings);
        setSelectedPages(files);
      } else {
        setSelectedPages([]);
      }
    }, SELECTION_UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activeFile, isShown]);

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
          <div
            className={`flex flex-col gap-xs rounded-xl border-dotted p-s ${
              selectedPages.length > 0
                ? 'border-2 border-base-50 border-opacity-100 bg-base-25 p-m'
                : ''
            }`}
          >
            {selectedPages && selectedPages.length > 0 ? (
              <>
                <Header title="Selected Notes" icon={<Notebook size={16} />} />

                <LinkButtons
                  pages={selectedPages}
                  parentPage={activeFile}
                  useSelectedFiles={false}
                  addUpLinkToNotes={addUpLinkToNotes}
                  removeUpLinkFromNotes={removeUpLinkFromNotes}
                  preserveBg
                />
                <ListOfItems
                  pages={selectedPages}
                  parentPage={activeFile}
                  type="SIMPLE"
                  preserveBg
                />
              </>
            ) : (
              <>
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
              </>
            )}
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
