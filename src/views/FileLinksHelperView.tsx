import { StrictMode } from 'react';
import { ItemView, MarkdownFileInfo, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SideMenuView } from '../components/SideMenuView';
import { AppContext } from '../context/AppContext';
import { expandFile, FileData } from 'src/utils/fileUtils';
import { MyPluginSettings } from 'src/main';

export const FILE_LINKS_HELPER_VIEW_ID = 'file-links-helper-view';

class FileLinksHelperView extends ItemView {
  root: Root | null = null;

  private filesByPath: Record<string, FileData> = {};
  private activeFile: FileData | null = null;
  private activeEditor: MarkdownFileInfo | null = null;

  constructor(leaf: WorkspaceLeaf, settings: MyPluginSettings) {
    super(leaf);
    this.initAlFiles();
    this.registerEvents();

    console.log('settings', settings);
  }

  private initAlFiles() {
    const files = this.app.vault.getFiles(); //.map((f) => expandFile(f, this.app, {}));

    files.forEach((file) => {
      this.filesByPath[file.path] = expandFile(file, this.app, this.filesByPath);
    });
  }

  private registerEvents() {
    // on settings change

    this.registerEvent(
      this.app.vault.on('create', (f) => {
        const file = this.app.vault.getFileByPath(f.path);
        if (!file) {
          return;
        }
        this.filesByPath[f.path] = expandFile(file, this.app, this.filesByPath);
        this.recreateRoot();
      }),
    );

    this.registerEvent(
      this.app.vault.on('delete', (f) => {
        delete this.filesByPath[f.path];
        console.log('all files after', this.filesByPath);
      }),
    );

    this.registerEvent(
      this.app.vault.on('rename', (f, oldPath) => {
        const file = this.app.vault.getFileByPath(f.path);
        if (!file) {
          return;
        }
        this.filesByPath[f.path] = expandFile(file, this.app, this.filesByPath);
        delete this.filesByPath[oldPath];

        console.log('all files after', this.filesByPath);
      }),
    );

    this.registerEvent(
      this.app.metadataCache.on('changed', (file, _, cache) => {
        this.filesByPath[file.path].frontmatter = cache.frontmatter;
        this.recreateRoot();
      }),
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        if (this.app.workspace.activeEditor?.file) {
          this.activeFile = this.filesByPath[this.app.workspace.activeEditor.file.path];
          this.activeEditor = this.app.workspace.activeEditor;
          this.recreateRoot();
        }
      }),
    );
  }

  getViewType() {
    return FILE_LINKS_HELPER_VIEW_ID;
  }

  getDisplayText() {
    return 'File Links Helper';
  }

  private recreateRoot() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <StrictMode>
        <AppContext.Provider
          value={{
            app: this.app,
            allFiles: this.filesByPath,
            activeFile: this.activeFile,
            activeEditor: this.activeEditor,
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
}

export default FileLinksHelperView;
