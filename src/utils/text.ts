import { DvPage, expandPage } from './fileUtils';
import { getAPI } from 'obsidian-dataview';
import { PluginCustomSettings } from '../settings/pluginSettings';

export const getFilesFromText = (
  text: string | string[],
  allOutPages: DvPage[],
  settings: PluginCustomSettings,
): DvPage[] => {
  const links = getLinksFromText(Array.isArray(text) ? text.join(' ') : text);
  return getFilesFromLinks(links, allOutPages, settings);
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
  allPages: DvPage[],
  settings: PluginCustomSettings,
): DvPage[] => {
  const pages: DvPage[] = [];
  const linksSet = [...links];
  const dv = getAPI();

  const allPaths = allPages.map((p) => p.file.path);
  const allPathsWithoutExtension = allPaths.map((p) => p.replace(/\.[^/.]+$/, ''));

  for (const link of linksSet) {
    let matchingPaths = allPathsWithoutExtension.filter((p) => p.endsWith(link));

    // removal of confusions between similar filenames. like "Banana" and "nana"
    // here we compare for the whole parts inside slashes
    if (matchingPaths.length > 1) {
      const indexesNotMatching = new Set<number>();
      let i = 0;
      for (const possiblePath of matchingPaths) {
        const pathSplit = possiblePath.split('/');
        const linkSplit = link.split('/');

        while (linkSplit.length >= 1) {
          const lastPart = linkSplit.pop();
          const lastPartPath = pathSplit.pop();

          if (lastPart !== lastPartPath) {
            indexesNotMatching.add(i);
            break;
          }
        }
        i++;
      }

      matchingPaths = matchingPaths.filter((_, index) => !indexesNotMatching.has(index));
    }

    // removal of confusions between similar paths. like "Furniture/Toilet" - "Toilet" - "+/Toilet"
    // now it definitely has the ending part similar. We need to get the shortest one in length.
    if (matchingPaths.length > 1) {
      const lengths = matchingPaths.map((p) => p.length);
      const minLength = Math.min(...lengths);
      matchingPaths = matchingPaths.filter((p) => p.length === minLength);
    }

    const path = matchingPaths[0];

    if (path) {
      const page = expandPage(dv.page(path + '.md'), settings, false);
      pages.push({
        ...page,
        uniqueLinkedName: getEndingStringSimilarity(path, link),
      });
    }
  }

  return pages;
};
