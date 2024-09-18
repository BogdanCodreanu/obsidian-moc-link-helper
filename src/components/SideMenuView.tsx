import { useApp } from '../hooks/useApp';
import { useEffect, useState } from 'react';
import { getFilesFromText } from 'src/utils/text';
import FileItem from './FileItem';
import Button from './Button';
import {
  addUpLinkToNote,
  FileData,
  fileHasUpTowardsFile,
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

const UPDATE_INTERVAL = 200;

export const SideMenuView = () => {
  const { app, allFiles, activeFile, activeEditor, settings } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [outFilesWithoutParent] = useState<FileData[]>(
    activeFile?.outLinks.filter((f) => !fileHasUpTowardsFile(f, activeFile)) ?? [],
  );
  const [inLinksNotInFile] = useState<FileData[]>(
    activeFile?.inLinks.filter(
      (f) => fileHasUpTowardsFile(f, activeFile) && !parentFileHasOutTowardsFile(activeFile, f),
    ) ?? [],
  );

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

      if (minLine !== maxLine) {
        const currentText = activeEditor.editor.getRange(
          { line: minLine, ch: 0 },
          { line: maxLine + 1, ch: 0 },
        );
        const files = getFilesFromText(currentText, allFiles);
        setSelectedFiles(files);
      } else {
        setSelectedFiles([]);
      }
    }, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [app, activeEditor]);

  if (!activeFile) {
    return <div>No active file</div>;
  }

  const useSelectedFiles = selectedFiles.length > 0;

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
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-s font-bold text-orange">
        <TriangleAlert size={16} />
        <div>Notes not added</div>
      </div>
      <div className="mx-xs mb-s text-xs text-base-60">
        Here are notes that have{' '}
        <span className="font-semibold text-text-accent">{settings.upPropName}</span> linking to
        this note, but aren't added here.
      </div>
      <div className="mx-xs mb-s flex flex-col gap-xs">
        {inLinksNotInFile.map((file, index) => (
          <FileItem
            key={file.path}
            file={file}
            parentFile={activeFile}
            isDisabled={false}
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
      className={`mx-xs flex flex-col gap-xs rounded-xl border-dotted transition-all ${useSelectedFiles ? 'border-2 border-base-50 border-opacity-100 bg-base-25 p-m' : 'border-none border-opacity-0'}`}
    >
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

      {/* NOTES LINK STATUS */}
      {activeFile.outLinks.length === 0 ? (
        <div className="gap-cd flex w-full flex-col items-center justify-center text-base-70">
          <Bird size={32} />
          <div className="mx-xs mb-s text-sm">No notes are referenced in here.</div>
        </div>
      ) : outFilesWithoutParent.length > 0 ? (
        <div
          className={`flex flex-row items-center gap-s text-orange transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
        >
          <TriangleAlert size={16} />
          <div className="text-sm">{outFilesWithoutParent.length} notes not linked.</div>
        </div>
      ) : (
        <div
          className={`flex flex-row items-center gap-s text-green transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
        >
          <Check size={16} />
          <div className="text-sm">All notes linked.</div>
        </div>
      )}

      {/* SELECTABLE NOTES */}
      <div className={`mx-xs mb-xs flex flex-col gap-xs ${useSelectedFiles ? 'mt-[-15px]' : ''}`}>
        {activeFile.outLinks.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            parentFile={activeFile}
            isDisabled={
              selectedFiles.length !== 0 &&
              selectedFiles.findIndex((f) => f.path === file.path) === -1
            }
            isSelected={selectedFiles.findIndex((f) => f.path === file.path) !== -1}
          />
        ))}
      </div>

      {/* BUTTONS */}
      {activeFile.outLinks.length > 0 ? (
        <div className={`flex w-full flex-row flex-wrap justify-around gap-s`}>
          <Button
            onClick={() =>
              addUpLinkToNotes(
                useSelectedFiles
                  ? selectedFiles.filter(
                      (f) => !f.upFiles.map((f) => f.path).includes(activeFile.path),
                    )
                  : outFilesWithoutParent,
              )
            }
            icon={<Link size={16} />}
            label={useSelectedFiles ? 'Link selected files' : 'Link all'}
            isDisabled={
              useSelectedFiles
                ? selectedFiles.every((f) =>
                    f.upFiles.map((u) => u.path).some((p) => p === activeFile.path),
                  )
                : outFilesWithoutParent.length === 0
            }
            className="text-green"
          />
          <Button
            onClick={() =>
              removeUpLinkFromNotes(
                useSelectedFiles
                  ? selectedFiles.filter((f) =>
                      f.upFiles.map((f) => f.path).includes(activeFile.path),
                    )
                  : activeFile.outLinks,
              )
            }
            icon={<Unlink size={16} />}
            label={useSelectedFiles ? 'Unlink selected files' : 'Unlink all'}
            isDisabled={
              useSelectedFiles
                ? !selectedFiles.some((f) =>
                    f.upFiles.map((u) => u.path).some((p) => p === activeFile.path),
                  )
                : outFilesWithoutParent.length === activeFile.outLinks.length
            }
            className="text-orange"
          />
        </div>
      ) : null}
    </div>
  );

  const childNoteComponent = (
    <div className="mx-xs flex flex-col gap-s">
      <div className="text-xs text-base-60">
        This is a child note. To work with notes that link to here, tag this note with{' '}
        <span className="font-semibold text-text-accent">#{settings.parentTag}</span>.
      </div>
      <hr />
      {activeFile.upFiles.length > 0 ? (
        <div className="mt-s flex flex-col gap-s">
          <div className="flex flex-row items-center gap-s font-bold">
            <LayoutTemplate size={16} />
            Parent Notes
          </div>
          <div className='flex flex-col gap-xs mx-xs'>
            {activeFile.upFiles.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                parentFile={activeFile}
                isDisabled={false}
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
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row items-center gap-s text-lg text-text-accent">
          {activeFile.isMoc ? <LayoutTemplate /> : <NotebookText />}
          <div>{activeFile?.nameWithoutExtension}</div>
        </div>
        <div className="mb-l" />

        {activeFile.isMoc ? (
          <>
            {inLinksNotInFile.length > 0 && (
              <div className="mx-xs mb-l">{inLinksNotInFileComponent}</div>
            )}

            {outNotesInParent}
          </>
        ) : (
          childNoteComponent
        )}
      </div>
    </div>
  );
};
