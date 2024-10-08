import { App } from 'obsidian';
import { FileData } from './fileUtils';

export const getCurrentOpenFile = (app: App, filesByPath: Record<string, FileData>) => {
  // if (app.workspace.activeEditor?.file) {
  //   return filesByPath[app.workspace.activeEditor.file.path];
  // }
  const mostRecent = app.workspace.getActiveFile();
  return mostRecent ? filesByPath[mostRecent.path] : undefined;
};
