import { LayoutTemplate, Link2Off } from "lucide-react";
import { PluginCustomSettings } from "../settings/pluginSettings";
import FileItem from "./FileItem";
import { FileData } from "../utils/fileUtils";

interface IChildNoteViewProps {
    settings: PluginCustomSettings;
    upFiles: FileData[];
    activeFile: FileData;
}

const ChildNoteView = (props: IChildNoteViewProps) => {
  return (
    <div className="mx-xs flex flex-col gap-s">
      <div className="text-xs text-base-60">
        This is a child note. To work with notes that link to here, tag this note with{' '}
        <span className="font-semibold text-text-accent">{props.settings.parentTag}</span>.
      </div>
      <hr />
      {props.upFiles.length > 0 ? (
        <div className="mt-s flex flex-col gap-s">
          <div className="flex flex-row items-center gap-s font-bold">
            <LayoutTemplate size={16} />
            Parent Notes
          </div>
          <div className="mx-xs flex flex-col gap-xs">
            {props.upFiles.map((file, index) => (
              <FileItem
                key={file?.path ?? index}
                file={file}
                parentFile={props.activeFile}
                isSelected={false}
                titleOnly
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center pt-xl text-base-70">
          <Link2Off size={32} />
          <div className="mx-xs mb-s text-sm">Unlinked Note</div>
        </div>
      )}
    </div>
  );
};

export default ChildNoteView;