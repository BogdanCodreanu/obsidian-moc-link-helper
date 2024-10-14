import { StrictMode } from 'react';
import { IconName, ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { SideView } from '../components/SideView';
import { AppContext } from '../context/AppContext';
import FileLinksHelperPlugin from 'src/main';
import { getCurrentOpenFile } from '../utils/workspaceUtils';

export const FILE_LINKS_HELPER_VIEW_ID = 'file-links-helper-view';

export const DELAY_TO_REFRESH = 1000;

class LinksHelperSideView extends ItemView {
  root: Root | null = null;


  constructor(
    leaf: WorkspaceLeaf,
    private plugin: FileLinksHelperPlugin,
  ) {
    super(leaf);
  }

  async onOpen() {
    this.createReactRoot();

    this.app.workspace.trigger('file-links-helper:on-shown-view-changed', true);
    console.log('Opened');
    

    const currentFile = getCurrentOpenFile(this.plugin);
    if (currentFile) {
      this.app.workspace.trigger('file-links-helper:on-change-active-file', currentFile);
    }
  }

  async onClose() {
    this.root?.unmount();
    this.app.workspace.trigger('file-links-helper:on-shown-view-changed', false);

    console.log('Closed');
    
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
