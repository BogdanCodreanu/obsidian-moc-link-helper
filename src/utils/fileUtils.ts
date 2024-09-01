import { App, FrontMatterCache, TFile } from 'obsidian';

export interface FileData extends TFile {
  frontmatter?: FrontMatterCache;
  nameWithoutExtension: string;
  uniqueLinkedName?: string;
  outLinks?: FileData[];
  inLinks?: FileData[];
}

export const expandFile = (file: TFile, app: App, allFiles: Record<string, FileData>): FileData => {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  const name = file.name;
  const nameWithoutExtension = name.replace(/\.[^/.]+$/, '');

  return {
    ...file,
    frontmatter,
    nameWithoutExtension,
  };
};

export const fromFilenameToFile = (
  filename: string,
  allFiles: Record<string, FileData>,
): FileData | null => {
  const wantedEndingString = `${filename}.md`;

  const file = Object.values(allFiles).find((f) => f.path.endsWith(wantedEndingString));
  return file || null;
};
