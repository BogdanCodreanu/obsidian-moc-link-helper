import { StrictMode } from 'react';
import { IconName, ItemView, MarkdownFileInfo, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { ReactView } from '../components/ReactView';
import { AppContext } from '../context/AppContext';
import { FileData } from 'src/utils/fileUtils';
import FileLinksHelperPlugin from 'src/main';
import { getCurrentOpenFile } from '../utils/workspaceUtils';

export const FILE_LINKS_HELPER_VIEW_ID = 'file-links-helper-view';

export const DELAY_TO_REFRESH = 1000;

class LinksHelperSideView extends ItemView {
  root: Root | null = null;

  private activeFile: FileData | null = null;
  private activeEditor: MarkdownFileInfo | null = null;

  private refreshTimeout: NodeJS.Timeout | null = null;
  private filesToRefresh: Set<string> = new Set();

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: FileLinksHelperPlugin,
  ) {
    super(leaf);

    // initAllFiles(this.app, this.settings);
    this.registerEvents();
  }

  async onOpen() {
    this.createReactRoot();

    this.app.workspace.trigger('file-links-helper:on-shown-view-changed', true);

    const currentFile = getCurrentOpenFile(this.app, this.plugin.allFiles);
    if (currentFile) {
      this.app.workspace.trigger('file-links-helper:on-change-active-file', currentFile);
    }
  }


  async onClose() {
    this.root?.unmount();
    this.app.workspace.trigger('file-links-helper:on-shown-view-changed', false);
  }

  // private startRefreshForFile = (filePath: string) => {
  //   this.filesToRefresh.add(filePath);

  //   if (this.refreshTimeout) {
  //     clearTimeout(this.refreshTimeout);
  //     this.refreshTimeout = null;
  //   }
  //   this.refreshTimeout = setTimeout(() => {
  //     const filesToRefresh = [...this.filesToRefresh];

  //     this.filesToRefresh.clear();
  //     this.refreshTimeout = null;
  //   }, DELAY_TO_REFRESH);
  // };

  private registerEvents() {
    this.registerEvent(
      this.app.workspace.on('file-links-helper:on-reinit-all-files', () => {
        this.createReactRoot();
      }),
    );
  }

  // private reselectFileIfActive(forceRecreate = false) {
  //   const isVisible = (this?.leaf as any)?.width > 0;
  //   if (!isVisible) {
  //     this.unmountRoot();
  //     return;
  //   }

  //   let recreateRoot = false;
  //   if (this.activeFile !== this.filesByPath[this.activeFile?.path ?? '']) {
  //     recreateRoot = true;
  //   }

  //   if (this.app.workspace.activeEditor?.file) {
  //     if (this.activeFile?.path !== this.app.workspace.activeEditor.file.path) {
  //       recreateRoot = true;
  //     }
  //     this.activeEditor = this.app.workspace.activeEditor;
  //     this.activeFile = this.filesByPath[this.app.workspace.activeEditor.file.path];
  //   }
  //   if (this.activeFile) {
  //     this.activeFile = this.filesByPath[this.activeFile.path];
  //   }

  //   if (recreateRoot || forceRecreate) {
  //     this.createReactRoot();
  //   }
  // }

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
  private createReactRoot() {
    this.unmountRoot();

    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <StrictMode>
        <AppContext.Provider
          value={{
            plugin: this.plugin,
            view: this,
            initialFile: undefined,
          }}
        >
          <ReactView />
        </AppContext.Provider>
      </StrictMode>,
    );
  }

  getIcon(): IconName {
    return 'cable';
  }
}

export default LinksHelperSideView;
