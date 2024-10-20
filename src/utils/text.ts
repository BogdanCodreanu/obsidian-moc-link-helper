import { TAbstractFile } from 'obsidian';
import { DvPage, expandPage } from './fileUtils';
import { getAPI } from 'obsidian-dataview';
import { PluginCustomSettings } from '../settings/pluginSettings';

export const getFilesFromText = (
  text: string | string[],
  allFiles: TAbstractFile[],
  settings: PluginCustomSettings,
): DvPage[] => {
  const links = getLinksFromText(Array.isArray(text) ? text.join(' ') : text);
  return getFilesFromLinks(links, allFiles, settings);
};

const getLinksFromText = (text: string): string[] => {
  const regex = /\[\[(.*?)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].split(/[#|^]/)[0].trim();
    if (name.length > 0) {
      // Check if the name is not empty or just spaces
      matches.push(name);
    }
  }
  return matches;
};

const getEndingStringSimilarity = (s1: string, s2: string): string => {
  let result = '';
  let j = s2.length - 1;
  for (let i = s1.length - 1; i >= 0; i--) {
    if (s1[i] === s2[j]) {
      j--;
      result = s1[i] + result;
    } else {
      break;
    }
  }
  return result;
};

const getFilesFromLinks = (
  links: string[],
  allFiles: TAbstractFile[],
  settings: PluginCustomSettings,
): DvPage[] => {
  const pages: DvPage[] = [];
  const linksSet = [...links];
  const dv = getAPI();

  for (const file of allFiles) {
    const filePathWithoutExtension = file.path.replace(/\.[^/.]+$/, '');
    const foundLink = linksSet.findIndex((l) => filePathWithoutExtension.endsWith(l));

    if (foundLink !== -1) {
      const page = expandPage(dv.page(file.path), settings, false);
      pages.push({
        ...page,
        uniqueLinkedName: getEndingStringSimilarity(filePathWithoutExtension, linksSet[foundLink]),
      });
      linksSet.splice(foundLink, 1);
    }
  }

  return pages;
};
