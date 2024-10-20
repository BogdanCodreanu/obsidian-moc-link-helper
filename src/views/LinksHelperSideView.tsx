import { StrictMode } from 'react';
import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SideView } from '../components/SideView';
import { AppContext } from '../context/AppContext';
import FileLinksHelperPlugin from 'src/main';
import { getCurrentOpenFile } from '../utils/workspaceUtils';

export const FILE_LINKS_HELPER_VIEW_ID = 'moc-link-helper-view';

class LinksHelperSideView extends ItemView {
  root: Root | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: FileLinksHelperPlugin,
  ) {
    super(leaf);
    
    this.registerEvent(
      plugin.app.metadataCache.on('dataview:index-ready', () => {
        this.onOpen();
      }),
    );
  }

  async onOpen() {
    this.createReactRoot();

    if (this.plugin.isDataviewReady) {
      this.app.workspace.trigger('moc-link-helper:on-shown-view-changed', true);

      const currentFile = getCurrentOpenFile(this.plugin);
      if (currentFile) {
        this.app.workspace.trigger('moc-link-helper:on-change-active-file', currentFile);
      }
    }
  }

  async onClose() {
    this.root?.unmount();
    this.app.workspace.trigger('moc-link-helper:on-shown-view-changed', false);
  }

  getViewType() {
    return FILE_LINKS_HELPER_VIEW_ID;
  }

  getDisplayText() {
    return 'MOC Link Helper';
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
          <SideView />
        </AppContext.Provider>
      </StrictMode>,
    );
  }

  getIcon(): IconName {
    return 'cable';
  }
}

export default LinksHelperSideView;
