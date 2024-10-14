import { debounce, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import LinksHelperSideView, { FILE_LINKS_HELPER_VIEW_ID } from './views/LinksHelperSideView';
import { DEFAULT_SETTINGS, PluginCustomSettings, SettingTab } from './settings/pluginSettings';
import { IconButtonToOpenPlugin } from './settings/iconButtonToOpenPlugin';
import { getCurrentOpenFile, getFileFromLeaf } from './utils/workspaceUtils';
import { DvPage } from './utils/fileUtils';

export default class FileLinksHelperPlugin extends Plugin {
  public settings: PluginCustomSettings;
  private iconButtonToOpenPlugin: IconButtonToOpenPlugin;
  private triggerChange = debounce((page: DvPage) => {
    this.app.workspace.trigger('file-links-helper:on-change-active-file', page);
    console.log("METADATA CHANGED");
  }, 200);

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.iconButtonToOpenPlugin = new IconButtonToOpenPlugin(
      this.app,
      this.settings,
      this,
      this.activateView.bind(this),
    );

    this.registerView(FILE_LINKS_HELPER_VIEW_ID, (leaf) => new LinksHelperSideView(leaf, this));

    this.addSettingTab(
      new SettingTab(
        this.app,
        this,
        (() => this.iconButtonToOpenPlugin.removeAllIcons(true)).bind(this),
      ),
    );

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

    this.registerEvent(
      this.app.metadataCache.on('dataview:index-ready', () => {
        console.log('index ready');
      }),
    );
  }

  private async onLayoutReady() {
    this.iconButtonToOpenPlugin?.removeAllIcons(true);

    // wait 1 second to make sure the files are loaded
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.registerEvent(this.app.workspace.on('active-leaf-change', this.onLeafChange.bind(this)));

    this.registerEvent(
      this.app.metadataCache.on('dataview:metadata-change', this.onMetadataChange.bind(this)),
    );

    this.addCommand({
      id: 'file-links-helper:open-view',
      name: 'Open File Links Helper View',
      callback: this.activateView.bind(this),
    });
  }

  onunload() {
    this.iconButtonToOpenPlugin.removeAllIcons(false);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async closeView() {
    const { workspace } = this.app;
    const leaves = workspace.getLeavesOfType(FILE_LINKS_HELPER_VIEW_ID);
    leaves.forEach((leaf) => leaf.detach());
  }

  private async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(FILE_LINKS_HELPER_VIEW_ID);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({
        type: FILE_LINKS_HELPER_VIEW_ID,
        active: true,
      });
      // set active note to the new leaf HERE
    }

    workspace.revealLeaf(leaf!);
  }

  private onLeafChange(leaf: WorkspaceLeaf) {
    if (!leaf) return;
    const page = getFileFromLeaf(leaf, this);

    if (page) {
      this.app.workspace.trigger('file-links-helper:on-change-active-file', page);
    }
  }

  private onMetadataChange(type: string, file: TFile, oldPath: string) {
    const currentOpen = getCurrentOpenFile(this);

    if (currentOpen) {
      this.triggerChange(currentOpen);
    }
  }
}
