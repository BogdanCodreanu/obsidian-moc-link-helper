import { useApp } from 'src/hooks/useApp';
import { useEffect, useState } from 'react';
import { FileData } from 'src/utils/fileUtils';
import { TextCursorInput, TriangleAlert } from 'lucide-react';
import Button from './Button';

interface IFileItemProps {
  file: FileData;
  parentFile: FileData;
  isDisabled: boolean;
  isSelected: boolean;
  displayAsUnadded?: boolean;
  addAtCursor?: (note: FileData) => void;
  titleOnly?: boolean;
}

interface FileDataWithProps extends FileData {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { app, settings } = useApp();
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

  const title = (
    <div
      className={`flex text-sm font-bold ${props.displayAsUnadded ? 'text-xs font-normal' : ''} ${!props.isDisabled ? 'cursor-pointer text-text-normal hover:text-text-accent hover:underline' : 'text-base-60'}`}
      onClick={() => onClickFile(props.file, false)}
      onAuxClick={() => onClickFile(props.file, true)}
    >
      {props.file.uniqueLinkedName}
    </div>
  );

  if (props.titleOnly) {
    return (
      <div className="rounded-lg border-base-60 border-1 bg-base-5 p-s py-xs transition-all">{title}</div>
    );
  }

  return (
    <div
      className={`flex flex-col flex-wrap rounded-lg border-base-60 bg-base-5 p-s py-xs transition-all ${props.isDisabled ? 'scale-y-70 scale-90' : ''} ${props.isSelected ? 'rounded-2xl border-2 border-text-accent' : 'border-1'} ${props.displayAsUnadded ? 'border-orange' : ''}`}
    >
      <div className="flex flex-row items-center justify-between">
        {title}

        {props.displayAsUnadded && (
          <Button
            onClick={() => props.addAtCursor?.(props.file)}
            icon={<TextCursorInput size={14} />}
            className="h-[24px] w-[24px] p-s text-green"
          />
        )}
      </div>
      {!props.displayAsUnadded && (
        <div className="flex flex-row items-center gap-xs">
          <div className="rounded-sm text-xs text-text-accent">{settings.upPropName}</div>
          {upLinks.every((l) => !l.isParentFile) && (
            <TriangleAlert className="text-orange" size={16} />
          )}
          {upLinks.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-xs">
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
      )}
    </div>
  );
};

export default FileItem;
