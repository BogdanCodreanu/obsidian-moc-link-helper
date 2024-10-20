import { App, FrontMatterCache, TAbstractFile, TFile } from 'obsidian';
import { PluginCustomSettings } from '../settings/pluginSettings';
import { getAPI } from 'obsidian-dataview';

export interface FileData extends TFile {
  frontmatter?: FrontMatterCache;
  nameWithoutExtension: string;
  uniqueLinkedName: string;
  outLinks: Set<string>;
  inLinks: Set<string>;
  unresolvedLinks: string[];
  tags: string[];
  upFiles: Set<string>; // the files in the 'up' prop
  isMoc: boolean;
  isInactiveLink?: boolean;
}

export interface DvLink {
  path: string;
}

export interface DvPage {
  tags: string[];
  up: DvLink[];
  file: {
    path: string;
    name: string;
    inlinks: any;
    outlinks: any;
  };
  isMoc: boolean;
  upFiles: DvPage[];
  outPages: DvPage[];
  inPages: DvPage[];
  uniqueLinkedName: string;
}

export const expandPage = (
  page: DvPage,
  settings: PluginCustomSettings,
  isActiveParentFile = true,
): DvPage => {
  if (!page) {
    return page;
  }
  const dv = getAPI();

  const pageUpProp = (page as any)[settings.upPropName] as DvLink[];

  page.isMoc = page.tags ? page.tags.includes(settings.parentTag) : false;
  page.upFiles = pageUpProp ? pageUpProp.map((u) => dv.page(u.path)).filter((p) => !!p) : [];

  page.outPages = [...new Set(page.file.outlinks.map((l: DvLink) => l.path))]
    .map((p: string) => dv.page(p))
    .map((p: DvPage) => {
      if (isActiveParentFile) {
        return expandPage(p, settings, false);
      }
      return p;
    })
    .filter((p: DvPage) => !!p);

  page.inPages = [...new Set(page.file.inlinks.map((l: DvLink) => l.path))]
    .map((p: string) => dv.page(p))
    .map((p: DvPage) => {
      if (isActiveParentFile) {
        return expandPage(p, settings, false);
      }
      return p;
    })
    .filter((p: DvPage) => !!p);

  if (isActiveParentFile) {
    page.upFiles.forEach((up) => {
      expandPage(up, settings, false);
    });
  }

  if (isActiveParentFile) {
    const nrOfOccurances: { [key: string]: number } = {};
    page.file.outlinks.forEach((out: DvLink) => {
      if (!nrOfOccurances[out.path]) {
        nrOfOccurances[out.path] = 0;
      }
      nrOfOccurances[out.path]++;
    });

    Object.keys(nrOfOccurances).forEach((key) => {
      if (nrOfOccurances[key] === 1) {
        const isUpLink = page.upFiles.some((up) => up.file.path === key);
        if (isUpLink) {
          // remove from outPages
          page.outPages = page.outPages.filter((p) => p.file.path !== key);
        }
      }
    });
  }
  return page;
};

export const addUpLinkToNote = async (
  childPage: DvPage,
  parentPage: DvPage,
  app: App,
  settings: PluginCustomSettings,
  allFiles: TAbstractFile[],
) => {
  if (!childPage.upFiles.map((f) => f.file.path).includes(parentPage.file.path)) {
    const file = app.vault.getFileByPath(childPage.file.path);
    if (!file) {
      return;
    }

    const link = generateMarkdownLink(parentPage, allFiles);

    await app.fileManager.processFrontMatter(file, (fm) => {
      if (!fm[settings.upPropName]) {
        fm[settings.upPropName] = [];
      }

      if (typeof fm[settings.upPropName] === 'string' || !Array.isArray(fm[settings.upPropName])) {
        fm[settings.upPropName] = [fm[settings.upPropName]];
      }

      if (!fm[settings.upPropName].includes(link)) {
        fm[settings.upPropName].push(generateMarkdownLink(parentPage, allFiles));
      }
      return fm;
    });
  }
};

export const removeUpLinkFromNote = async (
  childPage: DvPage,
  parentPage: DvPage,
  app: App,
  settings: PluginCustomSettings,
) => {
  const file = app.vault.getFileByPath(childPage.file.path);
  if (!file) {
    return;
  }
  await app.fileManager.processFrontMatter(file, (fm) => {
    if (!fm[settings.upPropName]) {
      return fm;
    }
    // up can be string or string[]
    if (typeof fm[settings.upPropName] === 'string') {
      fm[settings.upPropName] = [];
    }

    if (Array.isArray(fm[settings.upPropName])) {
      const parentPathWithoutExtension = parentPage.file.path.replace(/\.[^/.]+$/, '');
      fm[settings.upPropName] = (fm[settings.upPropName] as string[]).filter((u) => {
        const uWithoutBrackets = u.replace('[[', '').replace(']]', '');
        return !parentPathWithoutExtension.endsWith(uWithoutBrackets);
      });
      return fm;
    }

    return fm;
  });
};

export const generateMarkdownLink = (page: DvPage, allFiles: TAbstractFile[]): string => {
  return `[[${generateUniqueLinkedName(page, allFiles)}]]`;
};

export const generateUniqueLinkedName = (page: DvPage, allFiles: TAbstractFile[]): string => {
  const allPaths = allFiles.map((f) => f.path);
  const filePathParts = page.file.path.split('/');

  let lastPart = filePathParts.pop();
  let pathsEndingSame = allPaths.filter((f) => f.endsWith(lastPart!));

  while (lastPart && pathsEndingSame.length > 1) {
    if (pathsEndingSame.length === 1) {
      const withoutExtension = lastPart.replace(/\.[^/.]+$/, '');
      return withoutExtension;
    }

    lastPart = `${filePathParts.pop()}/${lastPart}`;
    pathsEndingSame = allPaths.filter((f) => f.endsWith(lastPart!));
  }

  if (pathsEndingSame.length === 1) {
    const withoutExtension = (lastPart ?? page.file.path).replace(/\.[^/.]+$/, '');
    return withoutExtension;
  }

  const pathWithoutExtension = page.file.path.replace(/\.[^/.]+$/, '');
  return pathWithoutExtension;
};
