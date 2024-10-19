import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
import FileLinksHelperPlugin from '../main';
import { getCurrentOpenFile } from '../utils/workspaceUtils';

export interface PluginCustomSettings {
  upPropName: string;
  parentTag: string;
  showHelpText: boolean;
}

export const DEFAULT_SETTINGS: PluginCustomSettings = {
  upPropName: 'up',
  parentTag: '#MOC',
  showHelpText: true,
};

export class SettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: FileLinksHelperPlugin,
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async onSettingsUpdate(newSettings: PluginCustomSettings) {
    Object.assign(this.plugin.settings, newSettings);
    await this.plugin.saveSettings();

    const currentOpen = getCurrentOpenFile(this.plugin);

    if (currentOpen) {
      this.app.workspace.trigger('file-links-helper:on-change-active-file', currentOpen);
    }
  }

  display(): void {
    const { containerEl, app } = this;
    containerEl.empty();

    const currentSettings = { ...this.plugin.settings };
    let saveButton: ButtonComponent | null = null;

    const showSave = () => {
      saveButton?.setDisabled(false);
      saveButton?.buttonEl.removeClass('settings-save-button-disabled');
      saveButton?.setClass('settings-save-button');
    };

    new Setting(containerEl)
      .setName('Up Property Name')
      .setDesc('The frontmatter property of the file that contains the up links to parent files')
      .addText((text) =>
        text
          .setPlaceholder('up')
          .setValue(currentSettings.upPropName)
          .onChange(async (value) => {
            currentSettings.upPropName = value;
            showSave();
          }),
      );

    new Setting(containerEl)
      .setName('Parent Tag')
      .setDesc('The tag that is used to mark a file as a parent file')
      .addDropdown((cb) => {
        const allVaultTags: string[] = [
          ...new Set<string>(
            app.vault.getFiles().flatMap((file) => {
              const cache = app.metadataCache.getFileCache(file);
              return [
                ...(cache?.frontmatter?.tags ?? []),
                ...(cache?.tags?.map((t) => t.tag) ?? []),
              ];
            }),
          ).add('MOC'),
        ];
        const tags: { [key: string]: string } = {};
        allVaultTags.forEach((tag) => {
          tags[tag] = tag;
        });

        cb.addOptions(tags)
          .setValue(currentSettings.parentTag)
          .onChange(async (value) => {
            while (value.startsWith('#')) {
              value = value.substring(1);
            }
            currentSettings.parentTag = value;
            showSave();
          });
      });

    new Setting(containerEl)
      .setName('Save Settings')
      .setDesc('Click the button to save the settings and update the plugin')
      .addButton((button) => {
        saveButton = button;
        return button
          .setIcon('save')
          .setCta()
          .setClass('settings-save-button-disabled')
          .setDisabled(true)
          .onClick(async () => {
            await this.onSettingsUpdate(currentSettings);

            saveButton?.buttonEl.removeClass('settings-save-button');
            saveButton?.setClass('settings-save-button-disabled');
            saveButton?.setDisabled(true);
          });
      });

    new Setting(containerEl).setHeading().setName('Workspace UI');

    new Setting(containerEl)
      .setName('Show help text')
      .setDesc('Show a help text in the plugin sidebar')
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.showHelpText).onChange(async (value) => {
          currentSettings.showHelpText = value;
          this.plugin.settings.showHelpText = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
