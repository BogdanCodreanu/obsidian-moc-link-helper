import { createContext } from "react";
import { App, MarkdownFileInfo } from "obsidian";
import { FileData } from "src/utils/fileUtils";
import { MyPluginSettings } from "../main";


export interface IAppContext {
    app: App;
    allFiles: Record<string, FileData>;
    activeFile: FileData | null;
    activeEditor: MarkdownFileInfo | null;
    settings: MyPluginSettings;
    reloadTime: number;
}

export const AppContext = createContext<IAppContext | undefined>(undefined);
