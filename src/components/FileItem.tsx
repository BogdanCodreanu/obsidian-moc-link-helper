import { useApp } from 'src/hooks/useApp';
import { useEffect, useState } from 'react';
import { FileData } from 'src/utils/fileUtils';
import { LayoutTemplate, Search, TextCursorInput, TriangleAlert } from 'lucide-react';
import Button from './general/Button';

interface IFileItemProps {
  file: FileData;
  parentFile: FileData;
  isSelected: boolean;
  displayAsUnadded?: boolean;
  addAtCursor?: (note: FileData) => void;
  titleOnly?: boolean;
  moveCursorToFile?: (file: FileData) => void;
}

interface FileDataWithProps extends FileData {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { plugin } = useApp();
  const { allFiles, settings, app } = plugin;
  const [upLinks, setUpLinks] = useState<FileDataWithProps[]>([]);
  const missingLink = !props.displayAsUnadded && upLinks.every((l) => !l.isParentFile);

  useEffect(() => {
    setUpLinks(
      [...props.file.upFiles].map((path) => ({
        ...allFiles[path],
        isParentFile: props.parentFile.path === path,
      })),
    );
  }, [props.file, props.parentFile]);

  const onClickFile = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    file: FileDataWithProps | FileData,
    newLeaf: boolean,
  ) => {
    event.preventDefault();
    if ((file as FileDataWithProps).isParentFile) {
      return;
    }

    app.workspace.openLinkText(file.path, file.path, newLeaf);
  };

  const title = (
    <div className="flex w-full flex-row justify-between gap-s">
      <div
        className={`flex cursor-pointer flex-row gap-xs text-sm font-bold text-text-normal hover:text-text-accent hover:underline ${props.displayAsUnadded ? 'text-xs font-normal' : ''}`}
        onClick={(ev) => onClickFile(ev, props.file, false)}
        onAuxClick={(ev) => onClickFile(ev, props.file, true)}
      >
        {props.file.isMoc && <LayoutTemplate size={16} />}
        {props.file.uniqueLinkedName}
      </div>
      {props.moveCursorToFile && (
        <div className="flex-grow-0">
          <Button
            ariaLabel="Scroll to line"
            onClick={() => props.moveCursorToFile?.(props.file)}
            icon={<Search size={16} />}
            className="h-[24px] w-[24px] p-s"
          />
        </div>
      )}
    </div>
  );

  if (props.titleOnly) {
    return (
      <div className="rounded-lg border-1 border-base-60 bg-base-5 p-s py-xs transition-all">
        {title}
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-xs">
      <div
        className={`flex w-full flex-col flex-wrap rounded-lg border-base-60 bg-base-5 p-s py-xs transition-all ${props.isSelected ? 'rounded-2xl border-2 border-text-accent' : 'border-1'} ${props.displayAsUnadded || missingLink ? 'border-2 border-orange' : ''} ${props.file.isMoc && !props.displayAsUnadded ? 'border-2 border-text-accent' : ''}`}
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
            {missingLink && <TriangleAlert className="text-orange" size={16} />}
            {upLinks.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-xs">
                {upLinks.map((file, i, all) => (
                  <div
                    key={file.path}
                    onClick={(event) => onClickFile(event, file, false)}
                    onAuxClick={(event) => onClickFile(event, file, true)}
                    className={`cursor-pointer text-xs hover:text-text-accent hover:underline ${file.isParentFile ? 'font-bold' : `text-base-60`}`}
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
    </div>
  );
};

export default FileItem;
