import { StrictMode } from 'react';
import { ItemView, MarkdownFileInfo, TAbstractFile, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SideMenuView } from '../components/SideMenuView';
import { AppContext } from '../context/AppContext';
import {
  expandFile,
  FileData,
  fromFilenameToFile,
  getOutFiles,
  getUpFiles,
  secondExpandFile,
} from 'src/utils/fileUtils';
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
    const files = this.app.vault.getFiles();

    files.forEach((file) => {
      this.filesByPath[file.path] = expandFile(file, this.app);
    });

    Object.values(this.filesByPath).forEach((file) =>
      secondExpandFile(file, this.app, this.filesByPath),
    );

    files.forEach((file) => {
      const outLinks = getOutFiles(file.path, this.app, this.filesByPath);

      this.filesByPath[file.path].outLinks = outLinks;

      outLinks.forEach((outFile) => {
        this.filesByPath[outFile.path].inLinks.push(this.filesByPath[file.path]);
      });

      this.filesByPath[file.path].unresolvedLinks = Object.keys(
        this.app.metadataCache.unresolvedLinks[file.path],
      );
    });

    console.log('all files', this.filesByPath);
  }

  private onCreatedFile = (f: TAbstractFile) => {
    const file = this.app.vault.getFileByPath(f.path);
    if (!file) {
      return;
    }
    this.filesByPath[f.path] = expandFile(file, this.app);
    secondExpandFile(this.filesByPath[f.path], this.app, this.filesByPath);
  };

  private onDeletedFile = (f: TAbstractFile) => {
    const deletedFile = this.filesByPath[f.path];

    deletedFile.inLinks.forEach((link) => {
      link.outLinks = link.outLinks.filter((outlink) => outlink.path !== f.path);
    });
    deletedFile.outLinks.forEach((link) => {
      link.inLinks = link.inLinks.filter((inlink) => inlink.path !== f.path);
    });

    delete this.filesByPath[f.path];
  };

  private registerEvents() {
    this.registerEvent(
      this.app.vault.on('create', (f) => {
        this.onCreatedFile(f);
        this.recreateRoot();
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
        this.onCreatedFile(f);
        this.recreateRoot();
      }),
    );

    this.registerEvent(
      this.app.metadataCache.on('changed', (file, _, cache) => {
        const transformedFile = this.filesByPath[file.path];
        transformedFile.frontmatter = cache.frontmatter;
        transformedFile.tags = cache.tags?.map((t) => t.tag) ?? [];

        const newOutLinks = [...new Set(cache.links?.map((l) => l.link) ?? [])]
          .map((l) => fromFilenameToFile(l, this.filesByPath))
          .filter((f) => !!f);

        const oldOutlinks = transformedFile.outLinks;
        const newOutLinksPaths = newOutLinks.map((f) => f.path);
        const oldOutLinksPaths = oldOutlinks.map((f) => f.path);

        oldOutlinks.forEach((link) => {
          const indexOfInLink =
            link.inLinks.findIndex((inlink) => inlink.path === transformedFile.path) ?? -1;
          if (indexOfInLink > -1 && newOutLinksPaths.indexOf(link.path) === -1) {
            link.inLinks = link.inLinks.splice(indexOfInLink, 1);
          }
        });

        newOutLinks.forEach((link) => {
          const indexOfInLink =
            link.inLinks.findIndex((inlink) => inlink.path === transformedFile.path) ?? -1;
          if (
            indexOfInLink === -1 &&
            oldOutLinksPaths.indexOf(link.path) === -1 &&
            link.path !== transformedFile.path
          ) {
            link.inLinks.push(transformedFile);
          }
        });

        this.filesByPath[file.path].outLinks = newOutLinks;

        this.filesByPath[file.path].upFiles = getUpFiles(
          this.filesByPath[file.path],
          this.filesByPath,
        );

        console.log('all files after', this.filesByPath);

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
