import { App, ButtonComponent, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import FileLinksHelperView, { FILE_LINKS_HELPER_VIEW_ID } from './views/FileLinksHelperView';

export interface MyPluginSettings {
  upPropName: string;
  parentTag: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  upPropName: 'up',
  parentTag: '#MOC',
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

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

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  onunload() {}

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

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async onSettingsUpdate() {
    await this.plugin.saveSettings();
    const leaves = this.app.workspace.getLeavesOfType(FILE_LINKS_HELPER_VIEW_ID);
    if (leaves.length === 0) {
      return;
    }

    const sideview = leaves[0].view as FileLinksHelperView;
    if (sideview) {
      this.app.workspace.trigger('file-links-helper-view-reinit', sideview);
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const currentSettings = { ...this.plugin.settings };
    let saveButton: ButtonComponent | null = null;

    const showSave = () => {
      saveButton?.setDisabled(false);
      saveButton?.setClass('p-xl');
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
            this.app.vault.getFiles().flatMap((file) => {
              const cache = this.app.metadataCache.getFileCache(file);
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

    //add button with text description

    new Setting(containerEl)
    .setName('Save Settings')
    .setDesc('Click the button to save the settings and update the plugin')
    .addButton((button) => {
      saveButton = button;
      return button
        .setButtonText('Save Settings')
        .setCta()
        .setDisabled(true)
        .onClick(async () => {
          Object.assign(this.plugin.settings, currentSettings);
          await this.onSettingsUpdate();
        });
    });
  }
}
