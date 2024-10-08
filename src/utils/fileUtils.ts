import { App, FrontMatterCache, TFile, WorkspaceLeaf } from 'obsidian';
import { getFilesFromText } from './text';
import { PluginCustomSettings } from '../settings/pluginSettings';

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

export const initAllFiles = (app: App, settings: PluginCustomSettings) => {
  const files = app.vault.getFiles();
  const filesByPath: Record<string, FileData> = {};


  files.forEach((file) => {
    filesByPath[file.path] = expandFile(file, app, settings);
  });

  Object.values(filesByPath).forEach((file) =>
    secondExpandFile(file, filesByPath, settings),
  );


  files.forEach((file) => {
    const outLinks = getOutFiles(file.path, app, filesByPath);

    outLinks.forEach((f) => filesByPath[file.path].outLinks.add(f.path));

    outLinks.forEach((outFile) => {
      filesByPath[outFile.path].inLinks.add(filesByPath[file.path].path);
    });

    filesByPath[file.path].upFiles.forEach((f) => {
      filesByPath[f].inLinks.add(file.path);
      // filesByPath[f].outLinks.delete(file.path);
    });
  });

  console.log("Init all files", filesByPath["Main MOC.md"]);
  
  return filesByPath;
}

export const expandFile = (file: TFile, app: App, settings: PluginCustomSettings): FileData => {
  const cache = app.metadataCache.getFileCache(file);
  const frontmatter = cache?.frontmatter;
  const tags = [...(cache?.tags?.map((t) => t.tag) ?? []), ...(frontmatter?.tags ?? [])];
  const name = file.name;
  const nameWithoutExtension = name.replace(/\.[^/.]+$/, '');

  return {
    ...file,
    uniqueLinkedName: nameWithoutExtension,
    frontmatter,
    nameWithoutExtension,
    outLinks: new Set<string>(),
    inLinks: new Set<string>(),
    unresolvedLinks: (file as FileData).unresolvedLinks ?? [],
    tags: frontmatter?.tags ?? [],
    upFiles: new Set<string>(),
    isMoc: tags.includes(settings.parentTag) ?? false,
  };
};

export const secondExpandFile = (
  file: FileData,
  allFiles: Record<string, FileData>,
  settings: PluginCustomSettings,
) => {
  file.uniqueLinkedName = generateUniqueLinkedName(file, allFiles);
  getUpFiles(file, allFiles, settings)
    .map((f) => f.path)
    .forEach((f) => file.upFiles.add(f));

  // const upFilesNotInOutlinks = [...file.upFiles].filter((f) => ![...file.outLinks].includes(f));

  // upFilesNotInOutlinks.forEach((f) => file.outLinks.add(f));
};

export const fileIsValid = (file: FileData): boolean => {
  return !!file && !!file.path;
};

export const getUpFiles = (
  file: FileData,
  allFiles: Record<string, FileData>,
  settings: PluginCustomSettings,
): FileData[] => {
  const upFiles = getFilesFromText(file.frontmatter?.[settings.upPropName] ?? [], allFiles);
  return upFiles;
};

export const fromFilenameToFile = (
  filename: string,
  allFiles: Record<string, FileData>,
): FileData | null => {
  const wantedEndingString = `${filename}.md`;

  const file = Object.values(allFiles).find((f) => f.path.endsWith(wantedEndingString));
  return file || null;
};

export const getInFiles = (
  filePath: string,
  app: App,
  allFiles: Record<string, FileData>,
): FileData[] => {
  const inLinks = Object.keys(app.metadataCache.resolvedLinks)
    .filter((path) => Object.keys(app.metadataCache.resolvedLinks[path] ?? []).includes(filePath))
    .map((l) => allFiles[l])
    .filter((f) => f.path !== filePath);

  return inLinks;
};

export const getOutFiles = (
  filePath: string,
  app: App,
  allFiles: Record<string, FileData>,
): FileData[] => {
  const links = app.metadataCache.resolvedLinks[filePath] ?? [];

  const outLinks =
    Object.keys(links)
      .filter((link) => {
        if (links[link] <= 1 && allFiles[filePath].upFiles.has(link)) {
          return false;
        }
        return true;
      })
      .map((l) => allFiles[l])
      .filter((f) => !!f)
      .filter((f) => f.path !== filePath) ?? [];

  return outLinks;
};

export const addUpLinkToNote = async (
  childNote: FileData,
  parentNote: FileData,
  app: App,
  allFiles: Record<string, FileData>,
  settings: PluginCustomSettings,
) => {
  if (![...childNote.upFiles].includes(parentNote.path)) {
    await app.fileManager.processFrontMatter(childNote, (fm) => {
      if (!fm[settings.upPropName]) {
        fm[settings.upPropName] = [];
      }
      fm[settings.upPropName].push(generateMarkdownLink(parentNote, allFiles));
      return fm;
    });
  }
};

export const removeUpLinkFromNote = async (
  childNote: FileData,
  parentNote: FileData,
  app: App,
  allFiles: Record<string, FileData>,
  settings: PluginCustomSettings,
) => {
  await app.fileManager.processFrontMatter(childNote, (fm) => {
    if (!fm[settings.upPropName]) {
      return fm;
    }
    // up can be string or string[]
    if (typeof fm[settings.upPropName] === 'string') {
      fm[settings.upPropName] = [];
    }

    if (Array.isArray(fm[settings.upPropName])) {
      const parentPathWithoutExtension = parentNote.path.replace(/\.[^/.]+$/, '');
      fm[settings.upPropName] = (fm[settings.upPropName] as string[]).filter((u) => {
        const uWithoutBrackets = u.replace('[[', '').replace(']]', '');
        return !parentPathWithoutExtension.endsWith(uWithoutBrackets);
      });
      return fm;
    }

    return fm;
  });
};

export const generateMarkdownLink = (
  file: FileData,
  allFiles: Record<string, FileData>,
): string => {
  return `[[${generateUniqueLinkedName(file, allFiles)}]]`;
};

export const generateUniqueLinkedName = (
  file: FileData,
  allFiles: Record<string, FileData>,
): string => {
  const filePathParts = file.path.split('/');

  let lastPart = filePathParts.pop();
  let pathsEndingSame = Object.keys(allFiles).filter((f) => f.endsWith(lastPart!));

  while (lastPart && pathsEndingSame.length > 1) {
    if (pathsEndingSame.length === 1) {
      const withoutExtension = lastPart.replace(/\.[^/.]+$/, '');
      return withoutExtension;
    }

    lastPart = `${filePathParts.pop()}/${lastPart}`;
    pathsEndingSame = Object.keys(allFiles).filter((f) => f.endsWith(lastPart!));
  }

  if (pathsEndingSame.length === 1) {
    const withoutExtension = (lastPart ?? file.path).replace(/\.[^/.]+$/, '');
    return withoutExtension;
  }

  const pathWithoutExtension = file.path.replace(/\.[^/.]+$/, '');
  return pathWithoutExtension;
};

export const fileHasUpTowardsFile = (file: FileData, towardsFile: FileData): boolean => {
  if (!file || !towardsFile) {
    return false;
  }
  return [...file.upFiles].includes(towardsFile.path);
};

export const parentFileHasOutTowardsFile = (
  parentFile: FileData,
  towardsFile: FileData,
): boolean => {
  return [...parentFile.outLinks].includes(towardsFile.path);
};



export const getFileFromLeaf = (leaf: WorkspaceLeaf): TFile | undefined  =>{
  if (leaf.view.getViewType() === 'markdown') {
    if ('file' in leaf.view && (leaf.view as any).file instanceof TFile) {
      return (leaf.view as any).file;
    }
  }
  return undefined;
}