import { useEffect, useMemo, useState } from 'react';
import { getCurrentVersion, getLatestVersion, isNewerVersion } from '../utils/versions';
import React from 'react';
import { ArrowRight, CircleArrowUp } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { ChangelogModal } from '../settings/ChangelogModal';

export const UpdateChecker = () => {
  const currentVersion = useMemo<string>(() => getCurrentVersion(), []);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const { plugin } = useApp();

  useEffect(() => {
    getLatestVersion()
      .then((version) => {
        setLatestVersion(version);
      })
      .catch(() => {});
  }, []);

  const openChangelog = () => {
    new ChangelogModal(plugin.app, plugin).open();
  };

  if (!latestVersion || !isNewerVersion(currentVersion, latestVersion)) {
    return (
      <div className="absolute flex w-full flex-row text-base-60 hover:cursor-pointer hover:underline">
        <div
          className="mt-[-10px] flex flex-row items-center gap-xs"
          aria-label="View changelog"
          onClick={openChangelog}
        >
          <span className="text-[10px]">v{currentVersion}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute flex w-full flex-row text-green hover:cursor-pointer hover:underline">
      <div
        className="mt-[-10px] flex flex-row items-center gap-xs"
        aria-label="Plugin update available"
        onClick={openChangelog}
      >
        <span className="text-[10px]">v{currentVersion} </span>
        <ArrowRight size={12} />
        <span className="text-[10px]"> v{latestVersion}</span>
        <CircleArrowUp size={16} />
      </div>
    </div>
  );
};
