import { createContext } from "react";
import { App, MarkdownFileInfo } from "obsidian";
import { FileData } from "src/utils/fileUtils";


export interface IAppContext {
    app: App;
    allFiles: Record<string, FileData>;
    activeFile: FileData | null;
    activeEditor: MarkdownFileInfo | null;
}

export const AppContext = createContext<IAppContext | undefined>(undefined);
