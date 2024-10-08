import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import LinksHelperSideView, { FILE_LINKS_HELPER_VIEW_ID } from './views/LinksHelperSideView';
import { DEFAULT_SETTINGS, PluginCustomSettings, SettingTab } from './settings/pluginSettings';
import { IconButtonToOpenPlugin } from './settings/iconButtonToOpenPlugin';
import { FileData, getFileFromLeaf, initAllFiles } from './utils/fileUtils';
import { CacheController } from './utils/cacheController';
import { getCurrentOpenFile } from './utils/workspaceUtils';

export default class FileLinksHelperPlugin extends Plugin {
  public settings: PluginCustomSettings;
  public allFiles: Record<string, FileData> = {};
  private iconButtonToOpenPlugin: IconButtonToOpenPlugin;
  private cacheController: CacheController;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.iconButtonToOpenPlugin = new IconButtonToOpenPlugin(
      this.app,
      this.settings,
      this,
      this.activateView.bind(this),
    );
    this.cacheController = new CacheController(this);

    this.registerView(FILE_LINKS_HELPER_VIEW_ID, (leaf) => new LinksHelperSideView(leaf, this));

    this.addSettingTab(
      new SettingTab(
        this.app,
        this,
        (() => this.iconButtonToOpenPlugin.removeAllIcons(true)).bind(this),
      ),
    );

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  private async onLayoutReady() {
    this.iconButtonToOpenPlugin?.removeAllIcons(true);

    // wait 1 second to make sure the files are loaded
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await this.startInitialLoad();

    this.registerEvent(this.app.workspace.on('active-leaf-change', this.onLeafChange.bind(this)));
    this.registerEvent(this.app.metadataCache.on('changed', this.onMetadataCacheChange.bind(this)));

    this.app.workspace.trigger('file-links-helper:on-reinit-all-files');

    const currentFile = getCurrentOpenFile(this.app, this.allFiles);
    if (currentFile) {
      this.app.workspace.trigger('file-links-helper:on-change-active-file', currentFile);
    }
  }

  onunload() {
    this.iconButtonToOpenPlugin.removeAllIcons(false);
  }

  private async startInitialLoad() {
    let allFiles: Record<string, FileData> = {};
    const maxTries = 10;
    const waitTime = 1000;

    for (let i = 0; i < maxTries; i++) {
      allFiles = initAllFiles(this.app, this.settings);

      if (Object.keys(allFiles).length > 0) {
        this.allFiles = allFiles;
        return allFiles;
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // warn user that the plugin could not load the files
    new Notice(
      "File Links Helper: Could not load files. Please use the reinitialize button in the plugin's view.",
    );
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

  private onMetadataCacheChange(file: TFile) {
    // this.iconButtonToOpenPlugin.onOpenFile(file, true);
    console.log('Metadata cache changed', file);
  }

  private onLeafChange(leaf: WorkspaceLeaf) {
    if (!leaf) return;
    const file = getFileFromLeaf(leaf);

    if (file) {
      this.iconButtonToOpenPlugin.onOpenFile(file);
      const fileData = this.allFiles[file.path];
      if (fileData) {
        this.app.workspace.trigger('file-links-helper:on-change-active-file', fileData);
      }
    }
  }
}
