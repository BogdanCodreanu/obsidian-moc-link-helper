import { App } from 'obsidian';
import FileLinksHelperPlugin from '../main';
import { expandFile, FileData, getInFiles, getOutFiles, secondExpandFile } from './fileUtils';

export class CacheController {
  private app: App;
  private allFiles: Record<string, FileData>;
  private isViewOpen: boolean;

  constructor(private plugin: FileLinksHelperPlugin) {
    this.app = plugin.app;
    this.allFiles = plugin.allFiles;
    this.isViewOpen = false;

    this.app.workspace.on('file-links-helper:on-shown-view-changed', (isViewOpen) => {
      this.isViewOpen = isViewOpen;
    });
  }

  public registerCacheChangeEvents() {
    this.plugin.registerEvent(
      this.app.vault.on('create', (f) => {
        if (this.isViewOpen) {
          //   this.startRefreshForFile(f.path);
        } else {
          console.log('Create file saved', f.path);
        }
      }),
    );

    this.plugin.registerEvent(
      this.app.vault.on('delete', (f) => {
        if (this.isViewOpen) {
          // this.onDeletedFile(f);
          // this.createReactRoot();
        } else {
          console.log('Delete file saved', f.path);
        }
      }),
    );

    this.plugin.registerEvent(
      this.app.vault.on('rename', (f, oldPath) => {
        if (this.isViewOpen) {
          // this.onDeletedFile(this.filesByPath[oldPath]);
          // this.startRefreshForFile(f.path);
        } else {
          console.log('Rename file saved', f.path);
        }
      }),
    );

    this.plugin.registerEvent(
      this.app.metadataCache.on('changed', (file, _, cache) => {
        if (this.isViewOpen) {
          // this.startRefreshForFile(file.path);
        } else {
          console.log('Metadata cache changed', file.path);
        }
      }),
    );
  }

  onCreateFileCache(filePath: string) {
    const file = this.app.vault.getFileByPath(filePath);
    if (!file) {
      return;
    }

    const oldFile = this.allFiles[filePath];
    if (oldFile) {
      // remove old links
    }

    const newFile = expandFile(file, this.app, this.plugin.settings);
    this.allFiles[filePath] = newFile;
    secondExpandFile(newFile, this.allFiles, this.plugin.settings);

    const outLinks = getOutFiles(filePath, this.app, this.allFiles);
    outLinks.forEach((f) => newFile.outLinks.add(f.path));

    const inlinks = getInFiles(filePath, this.app, this.allFiles);
    inlinks.forEach((f) => newFile.inLinks.add(f.path));

    inlinks.forEach((link) => this.allFiles[link.path].outLinks.add(newFile.path));

    newFile.upFiles.forEach((f) => {
      this.allFiles[f].inLinks.add(filePath);
    });
  }

  onDeleteFileCache(filePath: string) {
    const deletedFile = this.allFiles[filePath];
    if (!deletedFile) {
      return;
    }

    deletedFile.inLinks.forEach((linkPath) => {
      this.allFiles[linkPath]?.outLinks.delete(filePath);
    });
    deletedFile.outLinks.forEach((linkPath) => {
      this.allFiles[linkPath]?.inLinks.delete(filePath);
    });

    delete this.allFiles[filePath];
  }

  refreshCacheForFiles(filePaths: string[]) {
    // first create new files if they don't exist
    filePaths.filter((f) => !this.allFiles[f]).forEach((f) => this.onCreateFileCache(f));

    // then delete and recreate
    filePaths.forEach((path) => {
      this.onDeleteFileCache(path);
      this.onCreateFileCache(path);
    });
  }
}
