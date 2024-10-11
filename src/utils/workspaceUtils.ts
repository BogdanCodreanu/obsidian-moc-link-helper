import { TFile, WorkspaceLeaf } from 'obsidian';
import { DvPage, expandPage } from './fileUtils';
import { getAPI } from 'obsidian-dataview';
import FileLinksHelperPlugin from '../main';

export const getCurrentOpenFile = (plugin: FileLinksHelperPlugin) : DvPage | undefined => {
  const mostRecent = plugin.app.workspace.getActiveFile();
  if (mostRecent) {
    const page = getAPI().page(mostRecent.path);
    expandPage(page, plugin.settings)
    return page;
  }
  return undefined;
};


export const getFileFromLeaf = (leaf: WorkspaceLeaf, plugin: FileLinksHelperPlugin): DvPage | undefined  =>{
  if (leaf.view.getViewType() === 'markdown') {
    if ('file' in leaf.view && (leaf.view as any).file instanceof TFile) {
      const file = (leaf.view as any).file;
      const page = getAPI().page(file.path);
      expandPage(page, plugin.settings)
      return page;
    }
  }
  return undefined;
}