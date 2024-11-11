import { DvPage } from '../utils/fileUtils';
import FileItem from './FileItem';
import Description from './general/Description';

export type LIST_ITEM_TYPE =
  | 'SIMPLE'
  | 'AS_SELECTED'
  | 'AS_UNADDED'
  | 'AS_MISSING_PARENT'
  | 'TITLE_ONLY';

interface IListOfItemsProps {
  parentPage: DvPage;
  pages: DvPage[];
  type: LIST_ITEM_TYPE;

  moveCursorToFile?: (file: DvPage) => void;
  insertAtCursor?: (file: DvPage) => void;
  addUpLink?: (file: DvPage) => void;

  preserveBg?: boolean;
}

const ListOfItems = (props: IListOfItemsProps) => {
  return (
    <div
      className={`flex flex-grow-0 flex-col gap-xs overflow-auto ${props.preserveBg ? '' : 'rounded-lg !rounded-t-none border border-t-0 border-solid border-base-50 bg-base-25 p-s pt-m'}`}
    >
      {props.pages.map((page, index) => (
        <FileItem
          key={page?.file.path ?? index}
          page={page}
          parentPage={props.parentPage}
          titleOnly={props.type === 'TITLE_ONLY'}
          isSelected={props.type === 'AS_SELECTED'}
          displayAsUnadded={props.type === 'AS_UNADDED'}
          moveCursorToFile={props.moveCursorToFile}
          addAtCursor={props.insertAtCursor}
          addUpLink={props.addUpLink}
          asMissingParent={props.type === 'AS_MISSING_PARENT'}
        />
      ))}
      {props.pages.length === 0 && <Description text="No notes of such type present." />}
    </div>
  );
};

export default ListOfItems;
