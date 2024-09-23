import { App, SuggestModal } from "obsidian"

export class TagSuggestModal extends SuggestModal<string> {

    constructor(app: App) {
        super(app)
        // this.containerEl.setAttr("id", `${this.view.fileClass.name}-tagNames-suggest-modal`)
    }

    getSuggestions(query: string): string[] {
        
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

          return allVaultTags;
    }

    onChooseSuggestion(item: string, evt: MouseEvent | KeyboardEvent) {
        // const options = this.view.fileClass.getFileClassOptions()
        // const tagNames = options.tagNames || []
        // tagNames.push(item.replace(/^#(.*)/, "$1"))
        // options.tagNames = tagNames
        // this.view.fileClass.updateOptions(options)
        console.log('Chose suggestion2', item);
    }

    renderSuggestion(value: string, el: HTMLElement) {
        el.setText(value)
    }
}