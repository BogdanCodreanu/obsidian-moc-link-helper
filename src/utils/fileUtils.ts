import { App, FrontMatterCache, TFile } from 'obsidian';
import { getFilesFromText } from './text';
import { MyPluginSettings } from '../main';

export interface FileData extends TFile {
  frontmatter?: FrontMatterCache;
  nameWithoutExtension: string;
  uniqueLinkedName: string;
  outLinks: FileData[];
  inLinks: FileData[];
  unresolvedLinks: string[];
  tags: string[];
  upFiles: FileData[]; // the files in the 'up' prop
  isMoc: boolean;
}

export const expandFile = (file: TFile, app: App, settings: MyPluginSettings): FileData => {
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
    outLinks: (file as FileData).outLinks ?? [],
    inLinks: (file as FileData).inLinks ?? [],
    unresolvedLinks: (file as FileData).unresolvedLinks ?? [],
    tags: frontmatter?.tags ?? [],
    upFiles: (file as FileData).upFiles ?? [],
    isMoc: tags.includes(settings.parentTag) ?? false,
  };
};

export const secondExpandFile = (
  file: FileData,
  allFiles: Record<string, FileData>,
  settings: MyPluginSettings,
) => {
  file.uniqueLinkedName = generateUniqueLinkedName(file, allFiles);
  file.upFiles = getUpFiles(file, allFiles, settings);
};

export const getUpFiles = (
  file: FileData,
  allFiles: Record<string, FileData>,
  settings: MyPluginSettings,
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

export const getOutFiles = (
  filePath: string,
  app: App,
  allFiles: Record<string, FileData>,
): FileData[] => {
  const outLinks =
    Object.keys(app.metadataCache.resolvedLinks[filePath])
      ?.map((l) => allFiles[l])
      .filter((f) => !!f) ?? [];

  return outLinks;
};

export const addUpLinkToNote = async (
  childNote: FileData,
  parentNote: FileData,
  app: App,
  allFiles: Record<string, FileData>,
  settings: MyPluginSettings,
) => {
  if (!childNote.upFiles.map((f) => f.path).includes(parentNote.path)) {
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
  settings: MyPluginSettings,
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
  return file.upFiles.map((f) => f.path).includes(towardsFile.path);
};

export const parentFileHasOutTowardsFile = (
  parentFile: FileData,
  towardsFile: FileData,
): boolean => {
  return parentFile.outLinks.map((f) => f.path).includes(towardsFile.path);
};
