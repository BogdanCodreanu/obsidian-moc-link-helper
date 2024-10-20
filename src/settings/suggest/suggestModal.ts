import { App, setIcon, SuggestModal } from 'obsidian';

export class TagSuggestModal extends SuggestModal<string> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private onChoose: (item: string) => void,
  ) {
    super(app);

  }

  createSearchButton(element: HTMLElement) {
    const searchButton = element.createEl('button', { cls: 'tag-suggest-search-button' });
    setIcon(searchButton, 'scan-search');
    searchButton.addEventListener('click', () => {
      this.open();
    });
  }

  registerEvents(inputEl: HTMLInputElement) {
    inputEl.addEventListener('click', () => {
      this.open();
    });
  }

  getSuggestions(query: string): string[] {
    const allVaultTags: string[] = [
      ...new Set<string>(
        this.app.vault.getFiles().flatMap((file) => {
          const cache = this.app.metadataCache.getFileCache(file);
          return [...(cache?.frontmatter?.tags ?? []), ...(cache?.tags?.map((t) => t.tag) ?? [])];
        }),
      ).add('MOC'),
    ].filter((tag) => tag.includes(query));

    const tags: { [key: string]: string } = {};
    allVaultTags.forEach((tag) => {
      tags[tag] = tag;
    });

    return allVaultTags;
  }

  onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
    // const options = this.view.fileClass.getFileClassOptions()
    // const tagNames = options.tagNames || []
    // tagNames.push(item.replace(/^#(.*)/, "$1"))
    // options.tagNames = tagNames
    // this.view.fileClass.updateOptions(options)
    this.onChoose(item);
  }

  renderSuggestion(value: string, el: HTMLElement) {
    el.setText(value);
  }
}
