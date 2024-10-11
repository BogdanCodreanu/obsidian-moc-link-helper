import 'obsidian';
import { DvPage } from '../utils/fileUtils';

declare module 'obsidian' {
  interface Workspace {
    on(
      name: 'file-links-helper:on-shown-view-changed',
      callback: (isVisible: boolean) => void,
    ): EventRef;
    on(
      name: 'file-links-helper:on-change-active-file',
      callback: (file: DvPage) => void,
    ): EventRef;

    trigger(name: 'file-links-helper:on-shown-view-changed', isVisible: boolean): void;
    trigger(name: 'file-links-helper:on-change-active-file', file: DvPage): void;
  }

  interface MetadataCache {
    on(name: 'dataview:index-ready', callback: () => void): EventRef;
    on(
      name: 'dataview:metadata-change',
      callback: (type: 'update' | 'rename' | 'delete', file: TFile, oldPath: string) => void,
    ): EventRef;
  }
}
