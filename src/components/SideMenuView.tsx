import { useApp } from '../hooks/useApp';
import { useEffect, useState } from 'react';
import { getFilesFromText } from 'src/utils/text';
import FileItem from './FileItem';
import Button from './Button';
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
  LayoutTemplate,
  Link,
  Link2Off,
  Notebook,
  NotebookText,
  TextCursorInput,
  TextSelect,
  TriangleAlert,
  Unlink,
} from 'lucide-react';

const SELECTION_UPDATE_INTERVAL = 200;
const REFRESH_ANIMATION_DURATION = 'duration-[1000ms]';

export const SideMenuView = () => {
  const { app, allFiles, activeFile, activeEditor, settings, reloadTime } = useApp();
  const [delayToStartRefreshAnimation, setDelayToStartRefreshAnimation] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [, setFilesByLines] = useState<{ [line: number]: FileData[] }>({});
  const [linesByFilePath, setLinesByFilePath] = useState<{ [path: string]: number[] }>({});

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

  useEffect(() => {
    if (reloadTime > 0) {
      setTimeout(() => {
        setDelayToStartRefreshAnimation(true);
      }, 100);
    }
  }, []);

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

  useEffect(() => {
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
  }, [app, activeEditor]);

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

  const useSelectedFiles = selectedFiles.length > 0;

  const loadingBar = (
    <div className="w-sm mt-xs h-1.5 rounded-full border-1 border-text-accent">
      <div
        className={`h-1 rounded-sm bg-text-accent transition-all ${REFRESH_ANIMATION_DURATION} ease-linear ${delayToStartRefreshAnimation ? 'w-full' : reloadTime > 0 ? 'w-0' : 'w-full'}`}
      ></div>
    </div>
  );

  if (!activeFile) {
    return (
      <div className="pt-xl">
        {loadingBar}
        <div className="gap-cd flex w-full flex-col items-center justify-center text-base-70">
          <Bird size={32} />
          <div className="mx-xs mb-s text-sm">No selected file.</div>
          {reloadTime > 0 && (
            <div className="text-xs text-base-60">Waiting for file to re-cache.</div>
          )}
        </div>
      </div>
    );
  }

  const addUpLinkToNotes = async (notes: FileData[]) => {
    await Promise.all(notes.map((n) => addUpLinkToNote(n, activeFile, app, allFiles, settings)));
  };

  const removeUpLinkFromNotes = async (notes: FileData[]) => {
    await Promise.all(
      notes.map((n) => removeUpLinkFromNote(n, activeFile, app, allFiles, settings)),
    );
  };

  const insertNoteAtCursorPosition = async (note: FileData) => {
    if (!activeEditor || !activeEditor.editor) {
      return;
    }

    const cursor = activeEditor.editor.getCursor();
    const lineNumber = cursor.line;

    await app.vault.process(activeFile, (text) => {
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

  const inLinksNotInFileComponent = (
    <div className="mx-xs mb-l flex max-h-[30vh] flex-shrink-0 flex-col overflow-auto">
      <div className="flex flex-row items-center gap-s font-bold text-orange">
        <TriangleAlert size={16} />
        <div>Notes not added ({inLinksNotInFile.length})</div>
      </div>
      <div className="mx-xs mb-s text-xs text-base-60">
        Here are notes that have{' '}
        <span className="font-semibold text-text-accent">{settings.upPropName}</span> linking to
        this note, but aren't added here.
      </div>
      <div className="mx-xs mb-s flex flex-col gap-xs overflow-auto">
        {inLinksNotInFile.map((file, index) => (
          <FileItem
            key={file?.path ?? index}
            file={file}
            parentFile={activeFile}
            isSelected={false}
            displayAsUnadded
            addAtCursor={insertNoteAtCursorPosition}
          />
        ))}
      </div>

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
      <div className="flex flex-row items-center gap-s font-bold">
        <Notebook size={16} />
        {useSelectedFiles ? `Selected Notes (${selectedFiles.length})` : 'Notes'}
      </div>

      {/* DESCRIPTION */}
      <div className="mx-xs mb-s text-xs text-base-60">
        Notes included in this{' '}
        <span className="font-semibold text-text-accent">{settings.parentTag}</span> parent note.
        You can quickly modify their{' '}
        <span className="font-semibold text-text-accent">{settings.upPropName}</span> link in
        relation to this parent note. You can also
        <span className="mx-xs inline-block">
          <TextSelect size={15} />
        </span>
        select text to choose specific notes.
      </div>

      <div
        className={`mb-xs flex flex-row-reverse items-end gap-xs ${useSelectedFiles ? 'mb-xl' : ''}`}
      >
        {/* BUTTONS */}
        {outFiles.length > 0 ? (
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
                    : outFiles,
                )
              }
              icon={<Unlink size={16} />}
              label={useSelectedFiles ? 'Unlink selected files' : 'Unlink all'}
              isDisabled={
                useSelectedFiles
                  ? !selectedFiles.some((f) => [...f.upFiles].some((p) => p === activeFile.path))
                  : outFilesWithoutParent.length === outFiles.length
              }
              className="text-orange"
            />
          </div>
        ) : null}

        {/* NOTES LINK STATUS */}
        {!useSelectedFiles &&
          (outFiles.length === 0 ? (
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
      <div className={`mx-xs flex flex-grow-0 flex-col gap-xs overflow-auto pb-xxl`}>
        {(useSelectedFiles ? selectedFiles : outFiles).map((file, index) => (
          <FileItem
            key={file?.path ?? index}
            file={file}
            parentFile={activeFile}
            isSelected={selectedFiles.findIndex((f) => f.path === file.path) !== -1}
            moveCursorToFile={moveCursorToFile}
          />
        ))}
      </div>
    </div>
  );

  const childNoteComponent = (
    <div className="mx-xs flex flex-col gap-s">
      <div className="text-xs text-base-60">
        This is a child note. To work with notes that link to here, tag this note with{' '}
        <span className="font-semibold text-text-accent">{settings.parentTag}</span>.
      </div>
      <hr />
      {upFiles.length > 0 ? (
        <div className="mt-s flex flex-col gap-s">
          <div className="flex flex-row items-center gap-s font-bold">
            <LayoutTemplate size={16} />
            Parent Notes
          </div>
          <div className="mx-xs flex flex-col gap-xs">
            {upFiles.map((file, index) => (
              <FileItem
                key={file?.path ?? index}
                file={file}
                parentFile={activeFile}
                isSelected={false}
                titleOnly
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center pt-xl text-base-70">
          <Link2Off size={32} />
          <div className="mx-xs mb-s text-sm">Unlinked Note</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed bottom-0 top-0 flex flex-col">
      <div className="sticky top-0 pb-s pr-[12px]">
        <div className="flex flex-row items-center gap-s text-lg text-text-accent">
          {activeFile.isMoc ? <LayoutTemplate /> : <NotebookText />}
          <div>{activeFile?.nameWithoutExtension}</div>
        </div>
        {loadingBar}
      </div>

      {activeFile.isMoc ? (
        <>
          {inLinksNotInFile.length > 0 && inLinksNotInFileComponent}

          {outNotesInParent}
        </>
      ) : (
        childNoteComponent
      )}
    </div>
  );
};
