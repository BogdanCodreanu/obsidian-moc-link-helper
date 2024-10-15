import { useApp } from 'src/hooks/useApp';
import { useEffect, useState } from 'react';
import { LayoutTemplate, Search, TextCursorInput, TriangleAlert } from 'lucide-react';
import Button from './general/Button';
import { DvPage } from '../utils/fileUtils';

interface IFileItemProps {
  page: DvPage;
  parentPage: DvPage;
  isSelected: boolean;
  displayAsUnadded?: boolean;
  addAtCursor?: (note: DvPage) => void;
  titleOnly?: boolean;
  moveCursorToFile?: (file: DvPage) => void;
}

interface FileDataWithProps extends DvPage {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { plugin } = useApp();
  const { settings, app } = plugin;
  const [upLinks, setUpLinks] = useState<FileDataWithProps[]>([]);
  const missingLink = !props.displayAsUnadded && upLinks.every((l) => !l.isParentFile);

  useEffect(() => {
    setUpLinks(
      props.page.upFiles.map((page) => ({
        ...page,
        isParentFile: props.parentPage.file.path === page.file.path,
      })),
    );
  }, [props.page, props.parentPage]);

  const onClickFile = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    page: FileDataWithProps | DvPage,
    newLeaf: boolean,
  ) => {
    event.preventDefault();
    if ((page as FileDataWithProps).isParentFile) {
      return;
    }

    app.workspace.openLinkText(page.file.path, page.file.path, newLeaf);
  };

  const title = (
    <div className="flex w-full flex-row justify-between gap-s">
      <div
        className={`flex cursor-pointer flex-row gap-xs text-sm font-bold text-text-normal hover:text-text-accent hover:underline ${props.displayAsUnadded ? 'text-xs font-normal' : ''}`}
        onClick={(ev) => onClickFile(ev, props.page, false)}
        onAuxClick={(ev) => onClickFile(ev, props.page, true)}
      >
        {props.page.isMoc && <LayoutTemplate size={16} />}
        {props.page.file.name}
      </div>
      {props.moveCursorToFile && (
        <div className="flex-grow-0">
          <Button
            ariaLabel="Scroll to line"
            onClick={() => props.moveCursorToFile?.(props.page)}
            icon={<Search size={16} />}
            className="h-[24px] w-[24px] p-s"
          />
        </div>
      )}
    </div>
  );

  if (props.titleOnly) {
    return <div className="rounded-lg border-1 border-base-60 bg-base-5 p-s py-xs">{title}</div>;
  }

  return (
    <div className="flex flex-row items-center gap-xs">
      <div
        className={`flex w-full flex-col flex-wrap rounded-lg border-base-60 bg-base-5 p-s py-xs ${props.isSelected ? 'rounded-2xl border-2 border-text-accent' : 'border-1'} ${props.displayAsUnadded || missingLink ? 'border-2 border-orange' : ''} ${props.page.isMoc && !props.displayAsUnadded ? 'border-2 border-text-accent' : ''}`}
      >
        <div className="flex flex-row items-center justify-between">
          {title}

          {props.displayAsUnadded && (
            <Button
              onClick={() => props.addAtCursor?.(props.page)}
              icon={<TextCursorInput size={14} />}
              className="h-[24px] w-[24px] p-s text-green"
            />
          )}
        </div>
        {!props.displayAsUnadded && (
          <div className="flex flex-row items-center gap-xs">
            <div className="rounded-sm text-xs text-text-accent">{settings.upPropName}</div>
            {missingLink && !props.page.isMoc && (
              <TriangleAlert className="text-orange" size={16} />
            )}
            {upLinks.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-xs">
                {upLinks.map((file, i, all) => (
                  <div
                    key={file.file.path + i}
                    onClick={(event) => onClickFile(event, file, false)}
                    onAuxClick={(event) => onClickFile(event, file, true)}
                    className={`cursor-pointer text-xs hover:text-text-accent hover:underline ${file.isParentFile ? 'font-bold' : `text-base-60`}`}
                  >
                    {file.file.name + (i < all.length - 1 ? ',' : '')}
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
