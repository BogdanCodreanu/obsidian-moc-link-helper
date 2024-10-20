import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import {
  addUpLinkToNote,
  DvPage,
  expandPage,
  generateMarkdownLink,
  removeUpLinkFromNote,
} from '../utils/fileUtils';
import PageTitle from './general/PageTitle';
import NoFileSelectedScreen from './general/NoFileSelectedScreen';
import ToggleButtonGroup from './general/ToggleButtonGroup';
import { debounce, MarkdownFileInfo, Notice } from 'obsidian';
import { getCurrentOpenFile } from '../utils/workspaceUtils';
import { CheckCircle, Frown, Link2Off, Notebook, TextCursorInput, TextSelect } from 'lucide-react';
import Description from './general/Description';
import ListOfItems from './ListOfItems';
import LinkButtons from './general/LinkButtons';
import { getFilesFromText } from '../utils/text';
import Header from './general/Header';
import { getAPI } from 'obsidian-dataview';
import Button from './general/Button';

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
  const [currentFileEditor, setCurrentFileEditor] = useState<MarkdownFileInfo | undefined>(
    undefined,
  );
  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [dataviewReady, setDataviewReady] = useState(plugin.isDataviewReady);

  const allOutNotes = useMemo<DvPage[]>(() => {
    if (!activeFile || !dataviewReady) {
      return [];
    }
    return activeFile.outPages;
  }, [activeFile, dataviewReady]);

  const childOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => !p.isMoc);
  }, [allOutNotes]);

  const mocOutNotes = useMemo<DvPage[]>(() => {
    return allOutNotes.filter((p) => p.isMoc);
  }, [allOutNotes]);

  const inPagesNotInActiveFile = useMemo<DvPage[]>(() => {
    if (!activeFile || !dataviewReady) {
      return [];
    }

    return activeFile.inPages.filter(
      (p) =>
        p.upFiles.length > 0 &&
        p.upFiles.some((f) => f.file.path === activeFile.file.path) &&
        !activeFile.outPages.some((f) => f.file.path === p.file.path),
    );
  }, [activeFile, dataviewReady]);

  const shownNotes =
    outNotesView === 'All' ? allOutNotes : outNotesView === 'Notes' ? childOutNotes : mocOutNotes;

  const subscribeToEvents = debounce(() => {
    view.registerEvent(
      plugin.app.workspace.on('moc-link-helper:on-change-active-file', (file: DvPage) => {
        setActiveFile(file);
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
          setActiveFile(undefined);
        }
      }),
    );
  }, 200);

  useEffect(() => {
    if (!isShown || !plugin.isViewVisible() || !dataviewReady) {
      return;
    }

    if (!activeFile) {
      const interval = setInterval(() => {
        if (!activeFile && dataviewReady) {
          const page = getCurrentOpenFile(plugin);
          if (page) {
            expandPage(page, plugin.settings);
            setActiveFile(page);
          }
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [activeFile, isShown, dataviewReady]);

  useEffect(() => {
    if (!dataviewReady) {
      return;
    }
    subscribeToEvents();
  }, [dataviewReady]);

  // UPDATE ACTIVE FILE SELECTION
  useEffect(() => {
    if (!isShown || !plugin.isViewVisible() || !dataviewReady) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!isShown || !plugin.isViewVisible() || !dataviewReady) {
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

        const allFiles = plugin.app.vault.getAllLoadedFiles();
        const files = getFilesFromText(currentText, allFiles, plugin.settings);
        setSelectedPages(files);
      } else {
        setSelectedPages([]);
      }
    }, SELECTION_UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activeFile, isShown, selectedLine, dataviewReady]);

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

  const moveCursorToFile = (page: DvPage) => {
    if (!currentFileEditor || !currentFileEditor.editor) {
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

    const allFiles = plugin.app.vault.getAllLoadedFiles();

    textSplit.forEach((line, index) => {
      const pages = getFilesFromText(line, allFiles, plugin.settings);
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
    if (!currentFileEditor || !currentFileEditor.editor || !activeFile) {
      new Notice('No active editor or active file. Click inside the text file to fix.');
      return;
    }

    const cursor = currentFileEditor.editor.getCursor();
    const lineNumber = cursor.line;

    const file = plugin.app.vault.getFileByPath(activeFile.file.path);
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

  if (!dataviewReady) {
    return (
      <div className="moc-link-helper">
        <Description
          bigCenterIcon={<Frown size={32} />}
          text="Dataview plugin not detected. This plugin requires Dataview to work. If you just installed the plugin, please reload the app."
        />
      </div>
    );
  }

  if (!activeFile) {
    return (
      <div className="moc-link-helper">
        <NoFileSelectedScreen />
      </div>
    );
  }

  if (!activeFile.isMoc) {
    return (
      <div className="moc-link-helper">
        <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s overflow-auto p-m">
          <PageTitle page={activeFile} />
          <Description
            text={
              <div className="text-xs text-base-60">
                This is a child note. To work with notes that link to here, tag this note with{' '}
                <span className="font-semibold text-text-accent">{plugin.settings.parentTag}</span>.
              </div>
            }
          />
          <hr />

          {activeFile.upFiles.length > 0 ? (
            <div className="mt-s flex flex-col gap-s">
              <div className="flex flex-row items-center gap-s text-lg font-bold">Parent Notes</div>
              <ListOfItems
                pages={activeFile.upFiles}
                parentPage={activeFile}
                type="TITLE_ONLY"
                preserveBg
              />
            </div>
          ) : (
            <div className="flex w-full flex-col items-center justify-center pt-xl text-base-70">
              <Link2Off size={32} />
              <div className="mx-xs mb-s text-sm">Unlinked Note</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="moc-link-helper">
      <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s p-m">
        <PageTitle page={activeFile} />

        <ToggleButtonGroup
          options={[
            { label: 'Notes Included', value: 'OUTLINKS' },
            {
              label: 'Missing Notes',
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

                <div className="flex flex-col overflow-hidden">
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
                    ignoreMoc={outNotesView === 'All'}
                  />

                  <ListOfItems
                    pages={shownNotes}
                    moveCursorToFile={activeFile ? moveCursorToFile : undefined}
                    parentPage={activeFile}
                    type="SIMPLE"
                  />
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
                  parentPage={activeFile}
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
    </div>
  );
};
