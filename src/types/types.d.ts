
import "obsidian";
import { FileData } from "../utils/fileUtils";

declare module "obsidian" {
    interface Workspace {
        on(name: "file-links-helper:on-shown-view-changed", callback: (isVisible: boolean) => void): EventRef;
        on(name: "file-links-helper:on-reinit-all-files", callback: () => void): EventRef;
        on(name: "file-links-helper:on-change-active-file", callback: (file: FileData) => void): EventRef;

        trigger(name: "file-links-helper:on-shown-view-changed", isVisible: boolean): void;
        trigger(name: "file-links-helper:on-reinit-all-files"): void;
        trigger(name: "file-links-helper:on-change-active-file", file: FileData): void;
    }
}