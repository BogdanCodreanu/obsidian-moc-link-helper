import { Plugin, WorkspaceLeaf } from 'obsidian';
import FileLinksHelperView, { FILE_LINKS_HELPER_VIEW_ID } from './views/FileLinksHelperView';
import { SampleSettingTab } from './settings/pluginSettings';
import { IconButtonToOpenPlugin } from './settings/iconButtonToOpenPlugin';

export interface MyPluginSettings {
  upPropName: string;
  parentTag: string;
  showIconToOpenPlugin: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  upPropName: 'up',
  parentTag: '#MOC',
  showIconToOpenPlugin: true,
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;
  iconButtonToOpenPlugin: IconButtonToOpenPlugin;

  async onload() {
    await this.loadSettings();
    this.iconButtonToOpenPlugin = new IconButtonToOpenPlugin(
      this.app,
      this.settings,
      this,
      this.activateView,
    );

    this.registerView(
      FILE_LINKS_HELPER_VIEW_ID,
      (leaf) => new FileLinksHelperView(leaf, this.settings),
    );

    this.addCommand({
      id: 'file-links-helper-show-view',
      name: 'Show File Links Helper',
      callback: () => {
        this.activateView();
      },
    });

    this.addSettingTab(
      new SampleSettingTab(this.app, this, () => this.iconButtonToOpenPlugin.removeAllIcons(true)),
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (!leaf) return;
        const file = IconButtonToOpenPlugin.GetFileFromLeaf(leaf);
        if (file) {
          this.iconButtonToOpenPlugin.onOpenFile(file);
        }
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      setTimeout(() => {
        this.iconButtonToOpenPlugin.removeAllIcons(true);
      }, 1000);
    });

    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        this.iconButtonToOpenPlugin.onOpenFile(file, true);
      }),
    );
  }

  onunload() {
    this.iconButtonToOpenPlugin.removeAllIcons(false);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
      await leaf?.setViewState({ type: FILE_LINKS_HELPER_VIEW_ID, active: true });
    }

    workspace.revealLeaf(leaf!);
  }
}
