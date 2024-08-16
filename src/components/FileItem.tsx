import { useApp } from 'src/hooks/useApp';
import { useEffect, useState } from 'react';
import { FileData } from 'src/utils/fileUtils';
import { getFilesFromText } from 'src/utils/text';

interface IFileItemProps {
  file: FileData;
  parentFile: FileData;
}

interface FileDataWithProps extends FileData {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { app, allFiles } = useApp();
  const [upLinks, setUpLinks] = useState<FileDataWithProps[]>([]);

  useEffect(() => {
    const upFiles = getFilesFromText(props.file.frontmatter?.up ?? [], allFiles);
    setUpLinks(
      upFiles.map((file) => ({ ...file, isParentFile: props.parentFile.path === file.path })),
    );
  }, [props.file, props.parentFile]);

  const onClickFile = (file: FileDataWithProps | FileData) => {
    if ((file as FileDataWithProps).isParentFile) {
      return;
    }

    app.workspace.openLinkText(file.path, file.path);
  };

  return (
    <div className="flex flex-col flex-wrap gap-1 rounded-lg border-1 border-base-60  bg-base-5 p-2 py-1">
      <div className="flex">
        <div
          className="flex cursor-pointer text-sm font-bold text-text-normal hover:text-text-accent hover:underline"
          onClick={() => onClickFile(props.file)}
        >
          {props.file.uniqueLinkedName ?? props.file.nameWithoutExtension}
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <div className="rounded-sm text-xs text-text-accent">up</div>
        {upLinks.length > 0 ? (
          <div className="flex flex-row flex-wrap gap-1">
            {upLinks.map((file, i, all) => (
              <div
                key={file.path}
                onClick={() => onClickFile(file)}
                className={`text-xs ${file.isParentFile ? 'font-bold' : 'cursor-pointer text-base-50 underline hover:text-text-accent'}`}
              >
                {file.nameWithoutExtension + (i < all.length - 1 ? ',' : '')}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-base-40">none</div>
        )}
      </div>
    </div>
  );
};

export default FileItem;
