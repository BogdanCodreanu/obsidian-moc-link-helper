import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
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

    this.registerView(FILE_LINKS_HELPER_VIEW_ID, (leaf) => new FileLinksHelperView(leaf, this.settings));

    this.addCommand({
      id: 'file-links-helper-show-view',
      name: 'Show File Links Helper',
      callback: () => {
        this.activateView();
      },
    });

    // This adds an editor command that can perform some operation on the current editor instance
    // this.addCommand({
    // 	id: "sample-editor-command",
    // 	name: "Sample editor command",
    // 	editorCallback: (editor: Editor, view: MarkdownView) => {
    // 		console.log(editor.getSelection());
    // 		editor.replaceSelection("Sample Editor Command");
    // 	},
    // });

    // This adds a complex command that can check whether the current state of the app allows execution of the command
    // this.addCommand({
    // 	id: "open-sample-modal-complex",
    // 	name: "Open sample modal (complex)",
    // 	checkCallback: (checking: boolean) => {
    // 		// Conditions to check
    // 		const markdownView =
    // 			this.app.workspace.getActiveViewOfType(MarkdownView);
    // 		if (markdownView) {
    // 			// If checking is true, we're simply "checking" if the command can be run.
    // 			// If checking is false, then we want to actually perform the operation.
    // 			if (!checking) {
    // 				new SampleModal(this.app).open();
    // 			}

    // 			// This command will only show up in Command Palette when the check function returns true
    // 			return true;
    // 		}
    // 	},
    // });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    // this.registerDomEvent(document, "click", (evt: MouseEvent) => {
    // 	console.log("click", evt);
    // });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    // this.registerInterval(
    // 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    // );
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

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf!);
  }
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Up Property Name')
      .setDesc('The frontmatter property of the file that contains the up links to parent files')
      .addText((text) =>
        text
          .setPlaceholder('up')
          .setValue(this.plugin.settings.upPropName)
          .onChange(async (value) => {
            this.plugin.settings.upPropName = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Parent Tag')
      .setDesc('The tag that is used to mark a file as a parent file')
      .addText((text) =>
        text
          .setPlaceholder('#MOC')
          .setValue(this.plugin.settings.parentTag)
          .onChange(async (value) => {
            this.plugin.settings.parentTag = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
