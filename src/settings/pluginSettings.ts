import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
import FileLinksHelperPlugin from '../main';


export interface PluginCustomSettings {
  upPropName: string;
  parentTag: string;
  showIconToOpenPlugin: boolean;
}


export const DEFAULT_SETTINGS: PluginCustomSettings = {
  upPropName: 'up',
  parentTag: '#MOC',
  showIconToOpenPlugin: true,
};

export class SettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: FileLinksHelperPlugin,
    private onChangeIconShow: () => void,
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async onSettingsUpdate(newSettings: PluginCustomSettings) {
    Object.assign(this.plugin.settings, newSettings);
    await this.plugin.saveSettings();
    this.app.workspace.trigger('file-links-helper:on-reinit-all-files');
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
        // const search = new (class extends SuggestModal<string> {
        //   // constructor(private view: FileClassSettingsView) {
        //   //     super(view.plugin.app)
        //   //     this.containerEl.setAttr("id", `${this.view.fileClass.name}-tagNames-suggest-modal`)
        //   // }

        //   getSuggestions(query: string): string[] {
        //     // const tags = Object.keys(this.view.plugin.app.metadataCache.getTags())
        //     // return tags.filter(t => t.toLowerCase().includes(query.toLowerCase()))
        //     return ['test1', 'test2', 'test5'];
        //   }

        //   onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
        //     console.log('Chose suggestion2', item);
        //     cb.inputEl.value = item;
        //     cb.inputEl.trigger('input');
        //     this.close();

        //     //this.view.fileClass.getFileClassOptions()
        //     // const tagNames = options.tagNames || []
        //     // tagNames.push(item.replace(/^#(.*)/, "$1"))
        //     // options.tagNames = tagNames
        //     // this.view.fileClass.updateOptions(options)
        //   }

        //   renderSuggestion(value: string, el: HTMLElement) {
        //     el.setText(value);
        //   }
        // })(this.app);

        // cb.inputEl.oninput = () => {
        //   console.log('input');
        //   search.open();
        // };
        // cb.inputEl.onfocus = () => {
        //   console.log('focus');
        //   search.open();
        // };
        // cb.inputEl.onblur = () => {
        //   console.log('blur');
        //   search.close();
        // }
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
      .setName('Show icon to open plugin')
      .setDesc('Show an icon next to the file name of parent notes to open the plugin')
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.showIconToOpenPlugin).onChange(async (value) => {
          currentSettings.showIconToOpenPlugin = value;
          this.plugin.settings.showIconToOpenPlugin = value;
          await this.plugin.saveSettings();
          this.onChangeIconShow();
        });
      });

    // new Setting(containerEl)
    //   .setName('Parent Tag')
    //   .setDesc('The tag that is used to mark a file as a parent file')
    //   .addSearch((cb) => {
    //     const tag = new TagSuggestModal(this.app);

    //     cb.inputEl.onclick = () => {
    //       tag.open();
    //     }
    //     cb.inputEl.oninput = () => {
    //       tag.open();
    //     }
    //     cb.inputEl.onreset = () => {
    //       tag.open();
    //     }

    //     cb.setPlaceholder('MOC')
    //       .setValue(currentSettings.parentTag)
    //       .onChange(async (value) => {
    //         while (value.startsWith('#')) {
    //           value = value.substring(1);
    //         }
    //         currentSettings.parentTag = value;
    //         modifiedSettings = true;
    //       });
    //   });
  }
}
