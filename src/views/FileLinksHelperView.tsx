import { StrictMode } from 'react';
import { IconName, ItemView, MarkdownFileInfo, TAbstractFile, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SideMenuView } from '../components/SideMenuView';
import { AppContext } from '../context/AppContext';
import {
  expandFile,
  FileData,
  getInFiles,
  getOutFiles,
  secondExpandFile,
} from 'src/utils/fileUtils';
import { MyPluginSettings } from 'src/main';

export const FILE_LINKS_HELPER_VIEW_ID = 'file-links-helper-view';

export const DELAY_TO_REFRESH = 3000;

class FileLinksHelperView extends ItemView {
  root: Root | null = null;

  private filesByPath: Record<string, FileData> = {};
  private activeFile: FileData | null = null;
  private activeEditor: MarkdownFileInfo | null = null;

  private settings: MyPluginSettings;

  private refreshTimeout: NodeJS.Timeout | null = null;
  private filesToRefresh: Set<string> = new Set();

  constructor(leaf: WorkspaceLeaf, settings: MyPluginSettings) {
    super(leaf);
    this.settings = settings;

    this.initAllFiles();
    this.registerEvents();
  }

  public initAllFiles() {
    const files = this.app.vault.getFiles();

    files.forEach((file) => {
      this.filesByPath[file.path] = expandFile(file, this.app, this.settings);
    });

    Object.values(this.filesByPath).forEach((file) =>
      secondExpandFile(file, this.filesByPath, this.settings),
    );

    files.forEach((file) => {
      const outLinks = getOutFiles(file.path, this.app, this.filesByPath);

      outLinks.forEach((f) => this.filesByPath[file.path].outLinks.add(f.path));

      outLinks.forEach((outFile) => {
        this.filesByPath[outFile.path].inLinks.add(this.filesByPath[file.path].path);
      });

      this.filesByPath[file.path].upFiles.forEach((f) => {
        this.filesByPath[f].inLinks.add(file.path);
        // this.filesByPath[f].outLinks.delete(file.path);
      });
    });

    if (this.app.workspace.activeEditor?.file) {
      this.activeFile = this.filesByPath[this.app.workspace.activeEditor.file.path];
    }
    console.log('all files', this.filesByPath);
    this.recreateRoot();
  }

  private onCreateFileCache = (filePath: string) => {
    const file = this.app.vault.getFileByPath(filePath);
    if (!file) {
      return;
    }
    const oldFile = this.filesByPath[filePath];
    if (oldFile) {
      // remove old links
    }

    const newFile = expandFile(file, this.app, this.settings);
    this.filesByPath[filePath] = newFile;
    secondExpandFile(newFile, this.filesByPath, this.settings);

    const outLinks = getOutFiles(filePath, this.app, this.filesByPath);
    outLinks.forEach((f) => newFile.outLinks.add(f.path));

    const inlinks = getInFiles(filePath, this.app, this.filesByPath);
    inlinks.forEach((f) => newFile.inLinks.add(f.path));

    inlinks.forEach((link) => this.filesByPath[link.path].outLinks.add(newFile.path));

    newFile.upFiles.forEach((f) => {
      this.filesByPath[f].inLinks.add(filePath);
      console.log('adding to inlinks', f, filePath);
    });

    console.log('created file cache', newFile);
  };

  private onDeletedFile = (f: TAbstractFile) => {
    const deletedFile = this.filesByPath[f.path];

    deletedFile.inLinks.forEach((linkPath) => {
      this.filesByPath[linkPath].outLinks.delete(f.path);
    });
    deletedFile.outLinks.forEach((linkPath) => {
      this.filesByPath[linkPath].inLinks.delete(f.path);
    });

    delete this.filesByPath[f.path];
  };

  private startRefreshForFile = (filePath: string) => {
    this.filesToRefresh.add(filePath);

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    this.refreshTimeout = setTimeout(() => {
      const filesToRefresh = [...this.filesToRefresh];

      // first create new files
      filesToRefresh
        .filter((f) => !this.filesByPath[f])
        .forEach((f) => {
          this.onCreateFileCache(f);
        });

      filesToRefresh.forEach((path) => {
        this.onDeletedFile({ path } as TAbstractFile);
        this.onCreateFileCache(path);
      });

      this.filesToRefresh.clear();
      this.refreshTimeout = null;
      this.reselectFileIfActive();
      this.recreateRoot();
    }, DELAY_TO_REFRESH);

    this.reselectFileIfActive();
  };

  private registerEvents() {
    this.registerEvent(
      this.app.vault.on('create', (f) => {
        this.startRefreshForFile(f.path);
      }),
    );

    this.registerEvent(
      this.app.vault.on('delete', (f) => {
        this.onDeletedFile(f);
        this.recreateRoot();
      }),
    );

    this.registerEvent(
      this.app.vault.on('rename', (f, oldPath) => {
        this.onDeletedFile(this.filesByPath[oldPath]);
        this.startRefreshForFile(f.path);
      }),
    );

    this.registerEvent(
      this.app.metadataCache.on('changed', (file, _, cache) => {
        this.startRefreshForFile(file.path);
      }),
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const isVisible = (this.leaf as any)?.width > 0;

        if (!isVisible) {
          this.unmountRoot();
        } else {
          if (this.app.workspace.activeEditor?.file) {
            this.reselectFileIfActive();
          } else {
            if (!this.root) {
              this.recreateRoot();
            }
          }
        }
      }),
    );

    this.registerEvent(
      this.app.workspace.on('file-links-helper-view-reinit' as any, () => {
        this.initAllFiles();
        this.recreateRoot();
      }),
    );
  }

  private reselectFileIfActive() {
    if (this.activeFile) {
      this.activeFile = this.filesByPath[this.activeFile.path];
    }
    if (this.app.workspace.activeEditor?.file) {
      this.activeEditor = this.app.workspace.activeEditor;
      this.activeFile = this.filesByPath[this.app.workspace.activeEditor.file.path];
    }
    this.recreateRoot();
  }

  getViewType() {
    return FILE_LINKS_HELPER_VIEW_ID;
  }

  getDisplayText() {
    return 'File Links Helper';
  }

  private unmountRoot() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
  private recreateRoot() {
    this.unmountRoot();

    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <StrictMode>
        <AppContext.Provider
          value={{
            app: this.app,
            allFiles: this.filesByPath,
            activeFile: this.activeFile,
            activeEditor: this.activeEditor,
            settings: this.settings,
            reloadTime: this.filesToRefresh.size > 0 ? DELAY_TO_REFRESH : 0,
          }}
        >
          <SideMenuView />
        </AppContext.Provider>
      </StrictMode>,
    );
  }

  async onOpen() {
    this.recreateRoot();
  }

  async onClose() {
    this.root?.unmount();
  }

  getIcon(): IconName {
    return 'cable';
  }
}

export default FileLinksHelperView;
