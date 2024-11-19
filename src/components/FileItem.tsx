import { useApp } from 'src/hooks/useApp';
import { useMemo } from 'react';
import { DiamondPlus, LayoutTemplate, Search, TextCursorInput, TriangleAlert } from 'lucide-react';
import Button from './general/Button';
import { DvPage } from '../utils/fileUtils';
import { LIST_ITEM_TYPE } from './ListOfItems';

interface IFileItemProps {
  page: DvPage;
  parentPage: DvPage;
  addAtCursor?: (note: DvPage) => void;
  moveCursorToFile?: (file: DvPage) => void;
  addUpLink?: (file: DvPage) => void;

  type: LIST_ITEM_TYPE;
}

interface FileDataWithProps extends DvPage {
  isParentFile: boolean;
}

const FileItem = (props: IFileItemProps) => {
  const { plugin } = useApp();
  const { settings, app } = plugin;

  const upLinks = useMemo(
    () =>
      props.page.upFiles.map((page) => ({
        ...page,
        isParentFile: props.parentPage.file.path === page.file.path,
      })),
    [props.page, props.parentPage],
  );

  const hasMissingLinkTowardsActiveFile =
    props.type !== 'AS_UNADDED' &&
    props.type !== 'AS_MISSING_PARENT' &&
    upLinks.every((l) => !l.isParentFile);
  const isSelected = props.type === 'AS_SELECTED';

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
        className={`flex cursor-pointer flex-row gap-xs text-sm font-bold text-text-normal hover:text-text-accent hover:underline ${
          props.type === 'AS_UNADDED' ? 'text-xs font-normal' : ''
        }`}
        onClick={(ev) => onClickFile(ev, props.page, false)}
        onAuxClick={(ev) => onClickFile(ev, props.page, true)}
      >
        {props.page.isMoc && <LayoutTemplate size={16} />}
        {props.page.uniqueLinkedName ?? props.page.file.name}
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

  if (props.type === 'TITLE_ONLY') {
    return <div className="rounded-lg border-1 border-base-60 bg-base-5 p-s py-xs">{title}</div>;
  }

  if (props.type === 'AS_UNADDED') {
    return (
      <div className="flex flex-row items-center gap-xs">
        <div className="flex w-full flex-col flex-wrap rounded-lg border-2 border-orange bg-base-5 p-s py-xs">
          <div className="flex flex-row items-center justify-between">
            {title}
            {props.addAtCursor && (
              <Button
                onClick={() => props.addAtCursor?.(props.page)}
                ariaLabel="Insert at cursor"
                icon={<TextCursorInput size={12} />}
                className="h-[24px] w-[24px] p-s text-green"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (props.type === 'AS_MISSING_PARENT') {
    return (
      <div className="flex flex-row items-center gap-xs">
        <div className="flex w-full flex-col flex-wrap rounded-lg border border-base-60 bg-base-5 p-s py-xs">
          <div className="flex flex-row items-center justify-between">
            {title}
            {!!props.addUpLink && (
              <Button
                onClick={() => props.addUpLink?.(props.page)}
                ariaLabel="Add link"
                icon={<DiamondPlus size={16} />}
                className="h-[24px] w-[24px] p-s text-green"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-xs">
      <div
        className={`flex w-full flex-col flex-wrap rounded-lg border-base-60 bg-base-5 p-s py-xs ${
          isSelected ? 'rounded-2xl border-2 border-text-accent' : 'border-1'
        } ${hasMissingLinkTowardsActiveFile ? 'border-2 border-orange' : ''} ${
          props.page.isMoc ? 'border-2 border-text-accent' : ''
        }`}
      >
        <div className="flex flex-row items-center justify-between">{title}</div>

        <div className="flex flex-row items-center gap-xs">
          <div className="rounded-sm text-xs text-text-accent">{settings.upPropName}</div>
          {hasMissingLinkTowardsActiveFile && !props.page.isMoc && (
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
      </div>
    </div>
  );
};

export default FileItem;
