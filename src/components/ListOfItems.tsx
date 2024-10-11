import { DvPage } from '../utils/fileUtils';
import FileItem from './FileItem';

interface IListOfItemsProps {
  parentPage: DvPage;
  pages: DvPage[];
  type: 'SIMPLE' | 'AS_SELECTED' | 'AS_UNADDED';

  moveCursorToFile?: (file: DvPage) => void;
  insertAtCursor?: (file: DvPage) => void;
}

const ListOfItems = (props: IListOfItemsProps) => {
  return (
    <div className={`mx-xs flex flex-grow-0 flex-col gap-xs overflow-auto`}>
      {props.pages.map((page, index) => (
        <div key={page.file.path + index}>{page.file.name}</div>
        // <FileItem
        //   key={page?.file.path ?? index}
        //   page={page}
        //   parentPage={props.parentPage}
        //   isSelected={props.type === 'AS_SELECTED'}
        //   displayAsUnadded={props.type === 'AS_UNADDED'}
        //   moveCursorToFile={props.moveCursorToFile}
        //   addAtCursor={props.insertAtCursor}
        // />
      ))}
    </div>
  );
};

export default ListOfItems;
