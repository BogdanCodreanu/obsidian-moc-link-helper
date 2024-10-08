import { useApp } from '../hooks/useApp';
import { useEffect, useState } from 'react';
import { getFilesFromText } from 'src/utils/text';
import Button from './general/Button';
import {
  addUpLinkToNote,
  FileData,
  fileHasUpTowardsFile,
  fileIsValid,
  generateMarkdownLink,
  parentFileHasOutTowardsFile,
  removeUpLinkFromNote,
} from 'src/utils/fileUtils';
import {
  Bird,
  Check,
  FolderSync,
  LayoutTemplate,
  Link,
  Notebook,
  NotebookText,
  TextCursorInput,
  TextSelect,
  TriangleAlert,
  Unlink,
} from 'lucide-react';
import { MarkdownFileInfo } from 'obsidian';
import Description from './general/Description';
import StatusText from './general/StatusText';
import Header from './general/Header';
import ListOfItems from './ListOfItems';
import ChildNoteView from './ChildNoteView';

const SELECTION_UPDATE_INTERVAL = 200;
const REFRESH_ANIMATION_DURATION = 'duration-[1000ms]';

export const ReactView = () => {
  const { plugin, view } = useApp();
  const { app, settings, allFiles } = plugin;

  const [delayToStartRefreshAnimation, setDelayToStartRefreshAnimation] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [, setFilesByLines] = useState<{ [line: number]: FileData[] }>({});
  const [linesByFilePath, setLinesByFilePath] = useState<{ [path: string]: number[] }>({});

  const [activeFile, setActiveFile] = useState<FileData | undefined>(undefined);
  const [allNotesIncluded, setAllNotesIncluded] = useState<FileData[]>([]);
  const [noMocNotesIncluded, setNoMocNotesIncluded] = useState<FileData[]>([]);
  const [mocNotesIncluded, setMocNotesIncluded] = useState<FileData[]>([]);

  const [activeEditor, setActiveEditor] = useState<MarkdownFileInfo | undefined>(undefined);
  const useSelectedFiles = selectedFiles.length > 0;

  const outFiles = activeFile
    ? [...activeFile.outLinks].map((p) => allFiles[p]).filter(fileIsValid)
    : [];
  const childNoMOCNotes = outFiles.filter((f) => !f.isMoc);

  const inFiles = activeFile
    ? [...activeFile.inLinks].map((p) => allFiles[p]).filter(fileIsValid)
    : [];
  const upFiles = activeFile
    ? [...activeFile.upFiles].map((p) => allFiles[p]).filter(fileIsValid)
    : [];

  const [outFilesWithoutParent] = useState<FileData[]>(
    childNoMOCNotes.filter((f) => !fileHasUpTowardsFile(f, activeFile!)),
  );
  const [inLinksNotInFile] = useState<FileData[]>(
    inFiles.filter(
      (f) => fileHasUpTowardsFile(f, activeFile!) && !parentFileHasOutTowardsFile(activeFile!, f),
    ),
  );

  // register file change events
  useEffect(() => {
    view.registerEvent(
      app.workspace.on('file-links-helper:on-change-active-file', (file) => {
        console.log('file changed', file);

        onChangeActiveFile(file);
      }),
    );
  }, []);

  const onChangeActiveFile = (file: FileData) => {
    if (file.path === activeFile?.path) {
      return;
    }

    setActiveFile(file);
    getFiles(file);
  };

  const getFiles = (mainFile: FileData | undefined) => {
    const outFiles = mainFile ? [...mainFile.outLinks].map((p) => allFiles[p]).filter(fileIsValid) : [];
    // console.log('out files 1', [...file.outLinks]);
    // console.log('out files 2', [...file.outLinks].map((p) => allFiles[p]));
    // console.log('out files 3', outFiles);
    // console.log("all files", allFiles);

    setAllNotesIncluded(outFiles);
    setNoMocNotesIncluded(outFiles.filter((f) => !f.isMoc));
    setMocNotesIncluded(outFiles.filter((f) => f.isMoc));
  }

  useEffect(() => {
    // if (reloadTime > 0) {
    //   setTimeout(() => {
    //     setDelayToStartRefreshAnimation(true);
    //   }, 100);
    // }
  }, []);

  // INTERPRET ALL LINK POSITIONS
  useEffect(() => {
    if (!activeEditor || !activeEditor.editor || !activeFile || !activeFile.isMoc) {
      return;
    }

    const currentText = activeEditor.editor.getValue();
    const textSplit = currentText.split('\n');

    const matchedText = currentText.match(/^---\n[\s\S]*?\n---\n/);
    const frontmatter = matchedText ? matchedText[0] : '';
    const frontmatterLines = frontmatter.split('\n');

    for (let i = 0; i < frontmatterLines.length; i++) {
      textSplit[i] = 'a';
    }

    const newFilesByLines: { [line: number]: FileData[] } = {};
    const newLinesByFilePath: { [path: string]: number[] } = {};

    textSplit.forEach((line, index) => {
      const files = getFilesFromText(line, allFiles);
      if (files.length === 0) {
        return;
      }
      newFilesByLines[index] = files;
      files.forEach((file) => {
        if (!newLinesByFilePath[file.path]) {
          newLinesByFilePath[file.path] = [];
        }
        newLinesByFilePath[file.path].push(index);
      });
    });

    setFilesByLines(newFilesByLines);
    setLinesByFilePath(newLinesByFilePath);

    console.log('recreated root');
  }, [activeFile, activeEditor]);

  // UPDATE ACTIVE FILE SELECTION
  useEffect(() => {
    if (!activeEditor || !activeEditor.editor || !activeFile || !activeFile.isMoc) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!activeEditor || !activeEditor.editor || !activeFile) {
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
        const files = getFilesFromText(currentText, allFiles);
        setSelectedFiles(files);
      } else {
        setSelectedFiles([]);
      }
    }, SELECTION_UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [activeFile, activeEditor]);

  const moveCursorToFile = (file: FileData) => {
    if (!activeEditor || !activeEditor.editor) {
      return;
    }

    const lines = linesByFilePath[file.path];

    if (!lines) {
      return;
    }

    const line = lines[0];
    const lineText = activeEditor.editor.getLine(line);
    activeEditor.editor.setSelection({ line, ch: 0 }, { line, ch: lineText.length });
    activeEditor.editor.scrollIntoView(
      { from: { line, ch: 0 }, to: { line, ch: lineText.length } },
      true,
    );
    activeEditor.editor.focus();
  };

  const addUpLinkToNotes = async (notes: FileData[]) => {
    await Promise.all(notes.map((n) => addUpLinkToNote(n, activeFile!, app, allFiles, settings)));
  };

  const removeUpLinkFromNotes = async (notes: FileData[]) => {
    await Promise.all(
      notes.map((n) => removeUpLinkFromNote(n, activeFile!, app, allFiles, settings)),
    );
  };

  const insertNoteAtCursorPosition = async (note: FileData) => {
    if (!activeEditor || !activeEditor.editor) {
      return;
    }

    const cursor = activeEditor.editor.getCursor();
    const lineNumber = cursor.line;

    await app.vault.process(activeFile!, (text) => {
      return text.split('\n').reduce((acc, line, index) => {
        if (index === lineNumber) {
          return `${acc}${line}\n${generateMarkdownLink(note, allFiles)}\n`;
        }

        return `${acc}${line}\n`;
      }, '');
    });
  };

  const insertAllNotesAtCursorPosition = async (notes: FileData[]) => {
    await Promise.all(notes.map((n) => insertNoteAtCursorPosition(n)));
  };

  const refreshLinks = async () => {
    app.workspace.trigger('file-links-helper:on-reinit-all-files');
  };

  const loadingBar = (
    <div className="w-sm mt-xs h-1.5 rounded-full border-1 border-text-accent">
      {/* <div
        className={`h-1 rounded-sm bg-text-accent transition-all ${REFRESH_ANIMATION_DURATION} ease-linear ${delayToStartRefreshAnimation ? 'w-full' : reloadTime > 0 ? 'w-0' : 'w-full'}`}
      ></div> */}
    </div>
  );

  if (!activeFile) {
    return (
      <div className="flex flex-col gap-s pt-xl">
        {loadingBar}
        <Description
          text={'No file selected.'}
          smallerText="If Obsidian just started, click here, then click back on the text editor."
          bigCenterIcon={<Bird size={32} />}
        />
      </div>
    );
  }

  const inLinksNotInFileComponent = (
    <div className="mx-xs mb-l flex max-h-[30vh] flex-shrink-0 flex-col overflow-auto">
      <StatusText
        text={`Notes not added (${10})`}
        startingIcon={<TriangleAlert size={16} />}
        color="text-orange"
      />

      <Description
        text={
          <div>
            Here are notes that have{' '}
            <span className="font-semibold text-text-accent">{settings.upPropName}</span> linking to
            this note, but aren't added here.
          </div>
        }
      />

      <ListOfItems
        parentFile={activeFile}
        files={inLinksNotInFile}
        type="AS_UNADDED"
        insertAtCursor={insertNoteAtCursorPosition}
      />

      <div className="flex w-full flex-row justify-end">
        <Button
          onClick={() => {
            insertAllNotesAtCursorPosition(inLinksNotInFile);
          }}
          icon={<TextCursorInput size={16} />}
          label="Insert all at cursor"
          className="mx-xs text-green"
        />
      </div>
    </div>
  );

  const outNotesInParent = (
    <div
      className={`mx-xs flex flex-col gap-xs overflow-auto rounded-xl border-dotted transition-all ${useSelectedFiles ? 'border-2 border-base-50 border-opacity-100 bg-base-25 p-m' : 'border-none border-opacity-0'}`}
    >
      {/* HEADER */}
      <Header title={useSelectedFiles ? 'Selected Notes' : 'Notes'} icon={<Notebook size={16} />} />

      {/* DESCRIPTION */}
      <Description
        text={
          <div>
            Notes included in this{' '}
            <span className="font-semibold text-text-accent">{settings.parentTag}</span> parent
            note. You can quickly modify their{' '}
            <span className="font-semibold text-text-accent">{settings.upPropName}</span> link in
            relation to this parent note. You can also
            <span className="mx-xs inline-block">
              <TextSelect size={15} />
            </span>
            select text to choose specific notes.
          </div>
        }
      />

      <div
        className={`mb-xs flex flex-row-reverse items-end gap-xs ${useSelectedFiles ? 'mb-xl' : ''}`}
      >
        {/* BUTTONS */}
        {allNotesIncluded.length > 0 ? (
          <div
            className={`flex w-full flex-row flex-wrap justify-end gap-s ${useSelectedFiles ? 'justify-evenly' : ''}`}
          >
            <Button
              onClick={() =>
                addUpLinkToNotes(
                  useSelectedFiles
                    ? selectedFiles.filter((f) => ![...f.upFiles].includes(activeFile.path))
                    : outFilesWithoutParent,
                )
              }
              icon={<Link size={16} />}
              label={useSelectedFiles ? 'Link selected files' : 'Link all'}
              isDisabled={
                useSelectedFiles
                  ? selectedFiles.every((f) => [...f.upFiles].some((p) => p === activeFile.path))
                  : outFilesWithoutParent.length === 0
              }
              className="text-green"
            />
            <Button
              onClick={() =>
                removeUpLinkFromNotes(
                  useSelectedFiles
                    ? selectedFiles.filter((f) => [...f.upFiles].includes(activeFile.path))
                    : allNotesIncluded,
                )
              }
              icon={<Unlink size={16} />}
              label={useSelectedFiles ? 'Unlink selected files' : 'Unlink all'}
              isDisabled={
                useSelectedFiles
                  ? !selectedFiles.some((f) => [...f.upFiles].some((p) => p === activeFile.path))
                  : outFilesWithoutParent.length === allNotesIncluded.length
              }
              className="text-orange"
            />
          </div>
        ) : null}

        {/* NOTES LINK STATUS */}
        {!useSelectedFiles &&
          (allNotesIncluded.length === 0 ? (
            <div className="gap-cd flex w-full flex-col items-center justify-center text-base-70">
              <Bird size={32} />
              <div className="mx-xs mb-s text-sm">No notes are referenced in here.</div>
            </div>
          ) : outFilesWithoutParent.length > 0 ? (
            <div
              className={`flex w-full flex-row items-center gap-s text-orange transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
            >
              <TriangleAlert size={16} />
              <div className="text-sm">{outFilesWithoutParent.length} child notes not linked.</div>
            </div>
          ) : (
            <div
              className={`flex w-full flex-row items-center gap-s text-green transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
            >
              <Check size={16} />
              <div className="text-sm">All child notes linked.</div>
            </div>
          ))}
      </div>

      {/* SELECTABLE NOTES */}
      <ListOfItems
        files={useSelectedFiles ? selectedFiles : allNotesIncluded}
        parentFile={activeFile}
        type={useSelectedFiles ? 'AS_SELECTED' : 'SIMPLE'}
        moveCursorToFile={moveCursorToFile}
      />
    </div>
  );

  return (
    <div className="fixed bottom-0 top-[12px] flex flex-col">
      <div className="sticky top-[12px] pb-s pr-[12px]">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row items-center gap-s text-lg text-text-accent">
            {activeFile.isMoc ? <LayoutTemplate /> : <NotebookText />}
            <div>{activeFile?.nameWithoutExtension}</div>
          </div>
          <Button onClick={refreshLinks} ariaLabel="Refresh links" icon={<FolderSync />} />
        </div>

        {loadingBar}
      </div>

      {activeFile.isMoc ? (
        <>
          {inLinksNotInFile.length > 0 && inLinksNotInFileComponent}

          {outNotesInParent}
        </>
      ) : (
        <ChildNoteView settings={settings} upFiles={upFiles} activeFile={activeFile} />
      )}
    </div>
  );
};
