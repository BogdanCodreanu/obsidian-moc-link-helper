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
    const notes = await getReleaseNotes();
    const currentVersion = getCurrentVersion();

    const contentContainer = contentEl.createDiv();

    let stringContent = `# Changelog\n\n`;

    notes.forEach((note) => {
      stringContent += `## v${note.version}${note.version === currentVersion ? ' - Current version' : ''}\n${note.changes}\n\n`;
    });

    MarkdownRenderer.render(this.app, stringContent, contentContainer, '/', this.plugin);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
