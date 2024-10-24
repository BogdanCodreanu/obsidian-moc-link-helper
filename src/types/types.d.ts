import 'obsidian';
import { DvPage } from '../utils/fileUtils';

declare module 'obsidian' {
  interface Workspace {
    on(
      name: 'moc-link-helper:on-shown-view-changed',
      callback: (isVisible: boolean) => void,
    ): EventRef;
    on(
      name: 'moc-link-helper:on-change-active-file',
      callback: (file: DvPage) => void,
    ): EventRef;

    trigger(name: 'moc-link-helper:on-shown-view-changed', isVisible: boolean): void;
    trigger(name: 'moc-link-helper:on-change-active-file', file: DvPage): void;
  }

  interface MetadataCache {
    on(name: 'dataview:index-ready', callback: () => void): EventRef;
    on(
      name: 'dataview:metadata-change',
      callback: (type: 'update' | 'rename' | 'delete', file: TFile, oldPath: string) => void,
    ): EventRef;
  }
}
