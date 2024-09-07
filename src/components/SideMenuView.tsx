import { useApp } from '../hooks/useApp';
import { useEffect, useState } from 'react';
import { getFilesFromText } from 'src/utils/text';
import FileItem from './FileItem';
import Button from './Button';
import { addUpLinkToNote, FileData, removeUpLinkFromNote } from 'src/utils/fileUtils';
import { Check, Link, TriangleAlert, Unlink } from 'lucide-react';

const UPDATE_INTERVAL = 500;

export const SideMenuView = () => {
  const { app, allFiles, activeFile, activeEditor } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [outFilesWithoutParent] = useState<FileData[]>(
    activeFile?.outLinks.filter((f) => !f.upFiles.map((f) => f.path).includes(activeFile.path)) ??
      [],
  );
  const [inLinksNotInFile] = useState<FileData[]>(
    activeFile?.inLinks.filter((f) => !f.upFiles.map((f) => f.path).includes(activeFile.path)) ??
      [],
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

  // const addFrontmatter = (file: TFile) => {
  //   app.vault.process(file, (data) => {
  //     console.log('Processing file', data);
  //     data.replace('TT', 'XXXX');
  //     return data;
  //   });

  //   app.fileManager.processFrontMatter(
  //     file,
  //     (f) => (f.test = [app.fileManager.generateMarkdownLink(currentFile!, file.path)]),
  //   );
  // };

  if (!activeFile) {
    return <div>No active file</div>;
  }

  const useSelectedFiles = selectedFiles.length > 0;

  const addUpLinkToNotes = async (notes: FileData[]) => {
    await Promise.all(notes.map((n) => addUpLinkToNote(n, activeFile, app, allFiles)));
  };

  const removeUpLinkFromNotes = async (notes: FileData[]) => {
    await Promise.all(notes.map((n) => removeUpLinkFromNote(n, activeFile, app, allFiles)));
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="text-lg text-text-accent">{activeFile?.nameWithoutExtension}</div>
        <hr />

        <div
          className={`flex flex-col gap-4 rounded-xl border-dotted transition-all ${useSelectedFiles ? 'border-2 border-base-50 border-opacity-100 bg-base-25 p-2' : 'border-none border-opacity-0'}`}
        >
          <div className="text-lg">
            {useSelectedFiles ? `Selected Files (${selectedFiles.length})` : 'Files'}
          </div>

          <div className="flex flex-col gap-2">
            {activeFile.outLinks.map((file, index) => (
              <FileItem
                type="OUT_LINK"
                key={index}
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

          {outFilesWithoutParent.length > 0 ? (
            <div
              className={`text-orange flex flex-row items-center gap-2 transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
            >
              <TriangleAlert size={16} />
              <div className="text-sm">{outFilesWithoutParent.length} notes not linked.</div>
            </div>
          ) : (
            <div
              className={`text-green flex flex-row items-center gap-2 transition-all ${useSelectedFiles ? 'scale-y-0 opacity-0' : ''}`}
            >
              <Check size={16} />
              <div className="text-sm">All notes linked.</div>
            </div>
          )}

          <div className="flex w-full flex-row justify-around gap-2">
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
        </div>
      </div>
    </div>
  );
};
