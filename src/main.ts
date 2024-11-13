import { debounce, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import LinksHelperSideView, { FILE_LINKS_HELPER_VIEW_ID } from './views/LinksHelperSideView';
import { DEFAULT_SETTINGS, PluginCustomSettings, SettingsTab } from './settings/pluginSettings';
import { getCurrentOpenFile, getFileFromLeaf } from './utils/workspaceUtils';
import { DvPage } from './utils/fileUtils';
import { getAPI } from 'obsidian-dataview';

export default class FileLinksHelperPlugin extends Plugin {
  public settings: PluginCustomSettings;
  public isDataviewReady = false;

  private triggerChange = debounce((page: DvPage) => {
    this.app.workspace.trigger('moc-link-helper:on-change-active-file', page);
  }, 200);

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.registerView(FILE_LINKS_HELPER_VIEW_ID, (leaf) => new LinksHelperSideView(leaf, this));

    this.addSettingTab(new SettingsTab(this.app, this));

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

    this.registerEvent(
      this.app.metadataCache.on('dataview:index-ready', () => {
        this.isDataviewReady = true;
        this.onLeafChange(undefined);
      }),
    );

    this.registerEvent(this.app.workspace.on('active-leaf-change', this.onLeafChange.bind(this)));

    this.registerEvent(
      this.app.metadataCache.on('dataview:metadata-change', this.onMetadataChange.bind(this)),
    );

    this.addRibbonIcon('cable', 'Open MOC Link Helper View', this.activateView.bind(this));
    this.addCommand({
      id: 'open-view',
      name: 'Open View',
      callback: this.activateView.bind(this),
    });
  }

  private onLayoutReady() {
    // @ts-ignore
    if (getAPI()?.index?._loaded) {
      this.isDataviewReady = true;
      this.onLeafChange(undefined);
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(FILE_LINKS_HELPER_VIEW_ID);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({
        type: FILE_LINKS_HELPER_VIEW_ID,
        active: true,
      });
    }

    workspace.revealLeaf(leaf!);
  }

  private onLeafChange(leaf: WorkspaceLeaf | undefined) {
    if (!leaf || !this.isDataviewReady) {
      return;
    }
    const page = getFileFromLeaf(leaf, this);

    if (page) {
      this.app.workspace.trigger('moc-link-helper:on-change-active-file', page);
    }

    this.app.workspace.trigger('moc-link-helper:on-shown-view-changed', this.isViewVisible());
  }

  public isViewVisible() {
    const leaves = this.app.workspace.getLeavesOfType(FILE_LINKS_HELPER_VIEW_ID);
    if (leaves.length > 0) {
      const leaf = leaves[0];
      leaf.getViewState();
      return (leaf as any).width > 0;
    } else {
      return false;
    }
  }

  private onMetadataChange(type: string, file: TFile, oldPath: string) {
    if (!this.isDataviewReady) {
      return;
    }

    const currentOpen = getCurrentOpenFile(this);

    if (currentOpen) {
      this.triggerChange(currentOpen);
    }
  }
}
