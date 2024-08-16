import { useApp } from '../hooks/useApp';
import { useEffect, useState } from 'react';
import { getFilesFromText } from 'src/utils/text';
import FileItem from './FileItem';
import { FileData } from 'src/utils/fileUtils';

const UPDATE_INTERVAL = 500;

export const SideMenuView = () => {
  const { app, allFiles, activeFile, activeEditor } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [outFiles, setOutFiles] = useState<FileData[]>([]);

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

      const links = app.metadataCache.getFileCache(activeFile)?.links;
      console.log('Links', links);
      
      setOutFiles(getFilesFromText(links?.map((l) => l.original) ?? [], allFiles));

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

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="text-lg text-text-accent">{activeFile?.nameWithoutExtension}</div>
        <hr />

        <div className="text-lg">
          {useSelectedFiles ? `Selected Files (${selectedFiles.length})` : 'Files'}
        </div>

        <div className="flex flex-col gap-2">
          {(useSelectedFiles ? selectedFiles : outFiles).map((file, index) => (
            <FileItem key={index} file={file} parentFile={activeFile} />
          ))}
        </div>
      </div>
    </div>
  );
};
