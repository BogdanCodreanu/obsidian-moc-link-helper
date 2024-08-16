import { FileData } from './fileUtils';

export const getFilesFromText = (
  text: string | string[],
  allFiles: Record<string, FileData>,
): FileData[] => {
  const links = getLinksFromText(Array.isArray(text) ? text.join(' ') : text);
  return getFilesFromLinks(links, allFiles);
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
  allFiles: Record<string, FileData>,
): FileData[] => {
  const files: FileData[] = [];
  const linksSet = [...links];

  // This is the optimized code
  for (const file of Object.values(allFiles)) {
    const filePathWithoutExtension = file.path.replace(/\.[^/.]+$/, '');
    const foundLink = linksSet.findIndex((l) => filePathWithoutExtension.endsWith(l));

    if (foundLink !== -1) {
      files.push({
        ...file,
        uniqueLinkedName: getEndingStringSimilarity(filePathWithoutExtension, linksSet[foundLink]),
      });
      linksSet.splice(foundLink, 1);
    }
  }

  return files;
};

export const arrayOrSingleToArray = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
