import { App, TFile, WorkspaceLeaf } from 'obsidian';
import FileLinksHelperPlugin from '../main';
import { PluginCustomSettings } from './pluginSettings';
import { getFileFromLeaf } from '../utils/workspaceUtils';

const ICON_BUTTON_CLASS = 'file-links-helper-parent-file-icon';

export class IconButtonToOpenPlugin {
  constructor(
    private app: App,
    private settings: PluginCustomSettings,
    private plugin: FileLinksHelperPlugin,
    private activateView: () => void,
  ) {}

  onOpenFile(file: TFile, possibleRemoveIcon = false) {
    if (!this.settings.showIconToOpenPlugin) {
      return;
    }

    if (this.fileHasTargetTag(file)) {
      this.addIconToFileTitle(undefined);
    } else if (possibleRemoveIcon) {
      this.removeIconFromFile(file);
    }
  }

  private fileHasTargetTag(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const tags = [...(cache?.tags?.map((t) => t.tag) ?? []), ...(cache?.frontmatter?.tags ?? [])];
    return tags.some((tag) => tag === this.settings.parentTag) || false;
  }

  private removeIconFromFile(file: TFile) {
    const leaf = this.app.workspace.getLeaf();
    if (!leaf) return;

    const view = leaf.view;
    if (!view) return;

    const titleEl = view.containerEl.querySelector('.inline-title');
    if (!titleEl) return;

    const icon = titleEl.querySelector(`.${ICON_BUTTON_CLASS}`);
    if (icon) {
      icon.remove();
    }
  }

  private addIconToFileTitle(leaf: WorkspaceLeaf | undefined) {
    const activeLeaf = leaf || this.app.workspace.getLeaf();

    if (!activeLeaf) return;

    // Get the view of the active leaf
    const view = activeLeaf.view;
    if (!view) return;

    // Find the title element within the view
    const titleEl = view.containerEl.querySelector('.inline-title');
    if (!titleEl) return;

    // Check if the icon already exists to avoid duplicates
    if (titleEl.querySelector(`.${ICON_BUTTON_CLASS}`)) return;

    // Create the icon button
    const iconButton = document.createElement('div');
    iconButton.addClass(ICON_BUTTON_CLASS);
    iconButton.setAttribute('aria-label', `Open Links Helper`);

    // Add the icon to the button
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttrs({
      viewBox: '0 0 24 24',
      width: '18',
      height: '18',
      stroke: 'currentColor',
      fill: 'none',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    icon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-template"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/></svg>';
    iconButton.appendChild(icon);

    // Add click event listener
    iconButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering file open
      this.handleIconClick();
      const file = getFileFromLeaf(activeLeaf);
      if (file) {
        const fileData = this.plugin.allFiles[file.path];
        if (fileData) {
          this.app.workspace.trigger('file-links-helper:on-change-active-file', fileData);
        }
      }
      // this.app.workspace.revealLeaf(activeLeaf);
    });

    // Add the button next to the title
    titleEl.prepend(iconButton);
  }

  private handleIconClick() {
    this.activateView();
  }

  public removeAllIcons(recreate: boolean) {
    const icons = document.querySelectorAll(`.${ICON_BUTTON_CLASS}`);
    icons.forEach((icon) => icon.remove());

    if (recreate && this.settings.showIconToOpenPlugin) {
      this.app.workspace.iterateAllLeaves((leaf) => {
        const file = getFileFromLeaf(leaf, this.plugin);
        if (file) {
          this.onOpenFile(file);
        }
      });
    }
  }
}
