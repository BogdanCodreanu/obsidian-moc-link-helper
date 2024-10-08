import { FileData } from '../utils/fileUtils';
import FileItem from './FileItem';

interface IListOfItemsProps {
  parentFile: FileData;
  files: FileData[];
  type: 'SIMPLE' | 'AS_SELECTED' | 'AS_UNADDED';

  moveCursorToFile?: (file: FileData) => void;
  insertAtCursor?: (file: FileData) => void;
}

const ListOfItems = (props: IListOfItemsProps) => {
  return (
    <div className={`mx-xs flex flex-grow-0 flex-col gap-xs overflow-auto`}>
      {props.files.map((file, index) => (
        <FileItem
          key={file?.path ?? index}
          file={file}
          parentFile={props.parentFile}
          isSelected={props.type === 'AS_SELECTED'}
          displayAsUnadded={props.type === 'AS_UNADDED'}
          moveCursorToFile={props.moveCursorToFile}
          addAtCursor={props.insertAtCursor}
        />
      ))}
    </div>
  );
};

export default ListOfItems;
