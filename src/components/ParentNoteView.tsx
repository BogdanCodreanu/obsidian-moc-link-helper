import { Notebook, TextSelect, TextCursorInput, CheckCircle } from 'lucide-react';
import {
  addUpLinkToNote,
  DvPage,
  expandPage,
  generateMarkdownLink,
  removeUpLinkFromNote,
} from '../utils/fileUtils';
import Button from './general/Button';
import Description from './general/Description';
import Header from './general/Header';
import LinkButtons from './general/LinkButtons';
import PageTitle from './general/PageTitle';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import ListOfItems from './ListOfItems';
import { MarkdownFileInfo, Notice, debounce } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { useEffect, useMemo, useState } from 'react';
import { getFilesFromText } from '../utils/text';
import { useApp } from '../hooks/useApp';
import ToggleSwitch from './general/ToggleSwitch';

type SCREENS = 'INLINKS' | 'OUTLINKS';
type OutNotesView = 'All' | 'Notes' | 'MOC';

const SELECTION_UPDATE_INTERVAL = 500;

interface IParentNoteViewProps {
  activePage: DvPage;
  dataviewReady: boolean;
  isShown: boolean;
}

export const ParentNoteView = (props: IParentNoteViewProps) => {
  const { activePage, dataviewReady, isShown } = props;
  const { plugin } = useApp();
  const [screen, setScreen] = useState<SCREENS>('OUTLINKS');
  const [outNotesView, setOutNotesView] = useState<OutNotesView>('All');
  const [selectedPages, setSelectedPages] = useState<DvPage[]>([]);
  const [currentFileEditor, setCurrentFileEditor] = useState<MarkdownFileInfo | undefined>(
    undefined,
  );
  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [seeOnlyUnlinked, setSeeOnlyUnlinked] = useState(false);
  const [selectionEnabled, setSelectionEnabled] = useState(plugin.settings.selectionEnabled);

  const allOutNotes = useMemo<DvPage[]>(() => {
    if (!activePage || !dataviewReady) {
      return [];
    }
    return activePage.outPages.filter((p) =>
      seeOnlyUnlinked
        ? !p.upFiles.some((f) => f.file.path === activePage.file.path) &&
          (outNotesView === 'All' ? !p.isMoc : true)
        : true,
    );
  }, [activePage, dataviewReady, seeOnlyUnlinked, outNotesView]);

  const childOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => !p.isMoc);
  }, [allOutNotes]);

  const mocOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p.isMoc);
  }, [allOutNotes]);

  const inPagesNotInActiveFile = useMemo<DvPage[]>(() => {
    if (!activePage || !dataviewReady) {
      return [];
    }

    return activePage.inPages.filter(
      (p) =>
        p.upFiles.length > 0 &&
        p.upFiles.some((f) => f.file.path === activePage.file.path) &&
        !activePage.outPages.some((f) => f.file.path === p.file.path),
    );
  }, [activePage, dataviewReady]);

  const shownNotes =
    outNotesView === 'All' ? allOutNotes : outNotesView === 'Notes' ? childOutNotes : mocOutNotes;

  useEffect(() => {
    if (allOutNotes.length === 0) {
      setSeeOnlyUnlinked(false);
    }
  }, [allOutNotes]);

  useEffect(() => {
    setSeeOnlyUnlinked(false);
  }, [outNotesView]);


  const onSelectionModeChange = async (enabled: boolean) => {
    setSelectionEnabled(enabled);
    plugin.settings.selectionEnabled = enabled;
    await plugin.saveSettings();
  };

  // UPDATE SELECTION OF NOTES BASED ON TEXT SELECTION
  useEffect(() => {
    if (!isShown || !plugin.isViewVisible() || !dataviewReady || !selectionEnabled) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!isShown || !plugin.isViewVisible() || !dataviewReady || !selectionEnabled) {
        return;
      }

      const activeEditor = plugin.app.workspace.activeEditor;

      if (!activeEditor || !activeEditor.editor || !activePage) {
        if (selectedPages.length > 0) {
          const dv = getAPI();
          setSelectedPages((pages) =>
            pages.map((p) => expandPage(dv.page(p.file.path), plugin.settings, false)),
          );
        }
        return;
      }

      setCurrentFileEditor(activeEditor);

      const selections = activeEditor.editor.listSelections();

      if (selections.length > 1 || selections.length === 0) {
        return;
      }

      const minLine = Math.min(selections[0].head.line, selections[0].anchor.line);
      const maxLine = Math.max(selections[0].head.line, selections[0].anchor.line);
      const minChar = Math.min(selections[0].head.ch, selections[0].anchor.ch);
      const maxChar = Math.max(selections[0].head.ch, selections[0].anchor.ch);

      if (
        selectedLine >= 0 &&
        minLine === selectedLine &&
        maxLine === selectedLine &&
        minChar === 0
      ) {
        return;
      }
      setSelectedLine(-1);

      if (minLine !== maxLine || minChar !== maxChar) {
        const currentText = activeEditor.editor.getRange(
          { line: minLine, ch: 0 },
          { line: maxLine + 1, ch: 0 },
        );

        const files = getFilesFromText(currentText, activePage.outPages, plugin.settings);
        setSelectedPages(files);
      } else {
        setSelectedPages([]);
      }
    }, SELECTION_UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activePage, isShown, selectedLine, dataviewReady, selectionEnabled]);

  const onScreenChange = (screen: SCREENS) => {
    setScreen(screen);
  };

  const onOutNotesViewChange = (view: OutNotesView) => {
    setOutNotesView(view);
  };

  const addUpLinkToNotes = async (notes: DvPage[]) => {
    if (!activePage) {
      return;
    }
    const allFiles = plugin.app.vault.getAllLoadedFiles();
    await Promise.all(
      notes.map((n) => addUpLinkToNote(n, activePage, plugin.app, plugin.settings, allFiles)),
    );
  };

  const removeUpLinkFromNotes = async (notes: DvPage[]) => {
    if (!activePage) {
      return;
    }
    await Promise.all(
      notes.map((n) => removeUpLinkFromNote(n, activePage, plugin.app, plugin.settings)),
    );
  };

  const moveCursorToFile = (page: DvPage) => {
    if (!currentFileEditor || !currentFileEditor.editor || !activePage) {
      return;
    }

    const currentText = currentFileEditor.editor.getValue();
    const textSplit = currentText.split('\n');

    const matchedText = currentText.match(/^---\n[\s\S]*?\n---\n/);
    const frontmatter = matchedText ? matchedText[0] : '';
    const frontmatterLines = frontmatter.split('\n');

    for (let i = 0; i < frontmatterLines.length - 1; i++) {
      textSplit[i] = 'a';
    }

    const filesByLines: { [line: number]: DvPage[] } = {};
    const linesByFilePath: { [path: string]: number[] } = {};

    textSplit.forEach((line, index) => {
      const pages = getFilesFromText(line, activePage.outPages, plugin.settings);
      if (pages.length === 0) {
        return;
      }
      filesByLines[index] = pages;
      pages.forEach((page) => {
        if (!linesByFilePath[page.file.path]) {
          linesByFilePath[page.file.path] = [];
        }
        linesByFilePath[page.file.path].push(index);
      });
    });

    const lines = linesByFilePath[page.file.path];

    if (!lines) {
      new Notice('Cannot select note. It might be in the frontmatter.');
      return;
    }

    const line = lines[0];
    const lineText = currentFileEditor.editor.getLine(line);
    currentFileEditor.editor.setSelection({ line, ch: 0 }, { line, ch: lineText.length });
    currentFileEditor.editor.scrollIntoView(
      { from: { line, ch: 0 }, to: { line, ch: lineText.length } },
      true,
    );
    currentFileEditor.editor.focus();

    setSelectedLine(line);
  };

  const insertNoteAtCursorPosition = async (note: DvPage) => {
    if (!currentFileEditor || !currentFileEditor.editor || !activePage) {
      new Notice('No active editor or active file. Click inside the text file to fix.');
      return;
    }

    const cursor = currentFileEditor.editor.getCursor();
    const lineNumber = cursor.line;

    const file = plugin.app.vault.getFileByPath(activePage.file.path);
    const allFiles = plugin.app.vault.getAllLoadedFiles();
    if (!file) {
      return;
    }

    await plugin.app.vault.process(file, (text) => {
      return text.split('\n').reduce((acc, line, index) => {
        if (index === lineNumber) {
          return `${acc}${line}\n${generateMarkdownLink(note, allFiles)}\n`;
        }

        return `${acc}${line}\n`;
      }, '');
    });
  };

  const insertAllNotesAtCursorPosition = debounce(async (notes: DvPage[]) => {
    await Promise.all(notes.map((n) => insertNoteAtCursorPosition(n)));
  }, 400);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s p-m">
      <PageTitle page={activePage} />

      <ToggleButtonGroup
        options={[
          { label: 'Notes included', value: 'OUTLINKS' },
          {
            label: 'Missing notes',
            value: 'INLINKS',
            warning: inPagesNotInActiveFile.length > 0,
          },
        ]}
        selectedOption={screen}
        onOptionSelected={onScreenChange}
      />

      {screen === 'OUTLINKS' ? (
        <div
          className={`flex flex-col gap-xs overflow-auto rounded-xl border-dotted p-s ${
            selectedPages.length > 0
              ? 'border-2 border-base-50 border-opacity-100 bg-base-25 p-m'
              : ''
          }`}
        >
          {selectedPages && selectedPages.length > 0 ? (
            <>
              <Header title="Selected notes" icon={<Notebook size={16} />} />

              <LinkButtons
                pages={selectedPages}
                parentPage={activePage}
                useSelectedFiles={false}
                addUpLinkToNotes={addUpLinkToNotes}
                removeUpLinkFromNotes={removeUpLinkFromNotes}
                preserveBg
              />
              <ListOfItems pages={selectedPages} parentPage={activePage} type="SIMPLE" preserveBg />
            </>
          ) : (
            <>
              {plugin.settings.showHelpText && (
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
              )}

              <ToggleSwitch
                label={`Text selection`}
                icon={<TextSelect size={16} />}
                description="Enable selection of notes. This should be disabled when not used to avoid performance issues. It checks for text selection and reads all the note every 500ms."
                isEnabled={selectionEnabled}
                onToggle={onSelectionModeChange}
              />

              <div>
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
                <div className="flex flex-col gap-xs overflow-hidden rounded-lg rounded-t-none border-1 border-t-0 border-base-50 bg-base-25 p-s">
                  <LinkButtons
                    pages={shownNotes}
                    parentPage={activePage}
                    useSelectedFiles={false}
                    addUpLinkToNotes={addUpLinkToNotes}
                    removeUpLinkFromNotes={removeUpLinkFromNotes}
                    ignoreMoc={outNotesView === 'All'}
                    preserveBg
                    setSeeOnlyUnlinked={setSeeOnlyUnlinked}
                    seeOnlyUnlinked={seeOnlyUnlinked}
                    canFilterOnlyUnlinked={true}
                  />

                  {plugin.settings.showHelpText && outNotesView === 'All' && (
                    <Description
                      text={
                        <div>
                          Linking operations will not affect{' '}
                          <span className="font-semibold text-text-accent">
                            {plugin.settings.parentTag}
                          </span>{' '}
                          notes in <b>All</b> view.
                        </div>
                      }
                    />
                  )}

                  <ListOfItems
                    pages={shownNotes}
                    moveCursorToFile={activePage ? moveCursorToFile : undefined}
                    parentPage={activePage}
                    type="SIMPLE"
                    preserveBg
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : screen === 'INLINKS' ? (
        <div className={`flex flex-col gap-xs overflow-auto rounded-xl border-dotted p-s`}>
          {inPagesNotInActiveFile.length > 0 ? (
            <>
              {plugin.settings.showHelpText && (
                <Description
                  text={
                    <div>
                      Here are notes that have{' '}
                      <span className="font-semibold text-text-accent">
                        {plugin.settings.upPropName}
                      </span>{' '}
                      linking to this note, but aren't added here.
                    </div>
                  }
                />
              )}

              <div className="flex w-full flex-row justify-end">
                <Button
                  onClick={() => {
                    insertAllNotesAtCursorPosition(inPagesNotInActiveFile);
                  }}
                  icon={<TextCursorInput size={16} />}
                  label="Insert all at cursor"
                  className="mx-xs text-green"
                  isDisabled={!currentFileEditor}
                  ariaLabel={
                    !currentFileEditor
                      ? 'No active editor. Click inside the text file to fix.'
                      : undefined
                  }
                />
              </div>

              <ListOfItems
                pages={inPagesNotInActiveFile}
                parentPage={activePage}
                type="AS_UNADDED"
                preserveBg
                insertAtCursor={insertNoteAtCursorPosition}
              />
            </>
          ) : (
            <Description
              text="All notes that link to this note are already included."
              className="text-green"
              bigCenterIcon={<CheckCircle size={32} />}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};
