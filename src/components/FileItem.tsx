import { useApp } from 'src/hooks/useApp';
import { useEffect, useState } from 'react';
import { FileData } from 'src/utils/fileUtils';
import { TriangleAlert } from 'lucide-react';

interface IFileItemProps {
  file: FileData;
  parentFile: FileData;
  isDisabled: boolean;
  isSelected: boolean;
  type: 'OUT_LINK' | 'IN_LINK';
}

interface FileDataWithProps extends FileData {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { app } = useApp();
  const [upLinks, setUpLinks] = useState<FileDataWithProps[]>([]);

  useEffect(() => {
    setUpLinks(
      props.file.upFiles.map((file) => ({
        ...file,
        isParentFile: props.parentFile.path === file.path,
      })),
    );
  }, [props.file, props.parentFile]);

  const onClickFile = (file: FileDataWithProps | FileData, newLeaf: boolean) => {
    if (props.isDisabled) {
      return;
    }
    if ((file as FileDataWithProps).isParentFile) {
      return;
    }

    app.workspace.openLinkText(file.path, file.path, newLeaf);
  };

  return (
    <div
      className={`flex flex-col flex-wrap gap-1 rounded-lg border-base-60 bg-base-5 p-2 py-1 transition-all ${props.isDisabled ? 'scale-y-70 scale-90' : ''} ${props.isSelected ? 'rounded-2xl border-2 border-text-accent' : 'border-1'}`}
    >
      <div className="flex">
        <div
          className={`flex text-sm font-bold ${!props.isDisabled ? 'cursor-pointer text-text-normal hover:text-text-accent hover:underline' : 'text-base-60'}`}
          onClick={() => onClickFile(props.file, false)}
          onAuxClick={() => onClickFile(props.file, true)}
        >
          {props.file.uniqueLinkedName}
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <div className="rounded-sm text-xs text-text-accent">up</div>
        {upLinks.every((l) => !l.isParentFile) && (
          <TriangleAlert className="text-orange" size={16} />
        )}
        {upLinks.length > 0 ? (
          <div className="flex flex-row flex-wrap gap-1">
            {upLinks.map((file, i, all) => (
              <div
                key={file.path}
                onClick={() => onClickFile(file, false)}
                onAuxClick={() => onClickFile(file, true)}
                className={`text-xs ${file.isParentFile ? 'font-bold' : `text-base-60 ${!props.isDisabled ? 'cursor-pointer underline hover:text-text-accent' : ''}`}`}
              >
                {file.uniqueLinkedName + (i < all.length - 1 ? ',' : '')}
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
