import { createContext } from "react";
import FileLinksHelperPlugin from "../main";
import LinksHelperSideView from "../views/LinksHelperSideView";
import { FileData } from "../utils/fileUtils";


export interface IAppContext {
    plugin: FileLinksHelperPlugin
    view: LinksHelperSideView;
    initialFile: FileData | undefined;
}

export const AppContext = createContext<IAppContext | undefined>(undefined);
