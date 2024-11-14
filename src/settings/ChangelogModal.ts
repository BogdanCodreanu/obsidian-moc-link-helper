import { App, MarkdownRenderer, Modal } from 'obsidian';
import { getCurrentVersion, getReleaseNotes } from '../utils/versions';
import FileLinksHelperPlugin from '../main';

export class ChangelogModal extends Modal {
  constructor(
    app: App,
    private plugin: FileLinksHelperPlugin,
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    try {
      const notes = await getReleaseNotes();
      const currentVersion = getCurrentVersion();
      const latestVersion = notes[0].version;

      const isNewerAvailable = currentVersion !== latestVersion;

      const contentContainer = contentEl.createDiv();

      let stringContent = `# ${isNewerAvailable ? 'Plugin update available\n*Update the plugin via community plugins in settings.*' : 'Changelog'}\n\n`;

      notes.forEach((note) => {
        stringContent += `## v${note.version}${note.version === currentVersion ? ' - Current version' : ''}\n${note.changes}\n\n`;
      });

      MarkdownRenderer.render(this.app, stringContent, contentContainer, '/', this.plugin);
    } catch (e) {
      console.error(e);
      contentEl.createEl('p', { text: 'Failed to retrieve changelog' });
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
