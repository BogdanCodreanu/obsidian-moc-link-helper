import manifest from '../../manifest.json';

const REPO_URL = 'https://api.github.com/repos/BogdanCodreanu/obsidian-moc-link-helper';

export const getLatestVersion = async (): Promise<string> => {
  const response = await fetch(REPO_URL + '/releases/latest');
  const data = await response.json();
  return data.tag_name as string;
};

export const getReleaseNotes = async (): Promise<{ version: string; changes: string }[]> => {
  const response = await fetch(REPO_URL + '/releases');
  const data = await response.json();
  return data.map((release: any) => ({
    version: release.tag_name,
    changes: release.body,
  }));
};

export const getCurrentVersion = (): string => {
  const appVersion = manifest.version;
  return appVersion;
};

export const isNewerVersion = (currentVersion: string, latestVersion: string): boolean => {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const curr = current[i] || 0; // default to 0 if undefined
    const lat = latest[i] || 0;

    if (lat > curr) return true;
    if (lat < curr) return false;
  }
  return false;
};
