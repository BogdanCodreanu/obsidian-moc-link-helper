import { Link2Off } from "lucide-react";
import { addUpLinkToNote, DvPage } from "../utils/fileUtils";
import Description from "./general/Description";
import PageTitle from "./general/PageTitle";
import ListOfItems from "./ListOfItems";
import { useApp } from "../hooks/useApp";
import { useMemo } from "react";

interface IChildNoteViewProps {
    activePage: DvPage;
    dataviewReady: boolean;
}

export const ChildNoteView = (props: IChildNoteViewProps) => {
    const {activePage, dataviewReady} = props;
  const { plugin } = useApp();

  const indirectParents = useMemo<DvPage[]>(() => {
    if (!activePage || !dataviewReady || activePage.isMoc) {
      return [];
    }

    const inMocPagesNotAdded = activePage.inPages
      .filter((p) => p.isMoc)
      .filter((p) => !activePage.upFiles.map((f) => f.file.path).includes(p.file.path))
      .filter((p) => {
        const nrOfOccurancesTowardsActivePage = p.file.outlinks.filter(
          (out) => out.path === activePage.file.path,
        ).length;

        if (nrOfOccurancesTowardsActivePage === 1 && p.upFiles.some((up) => up.file.path === activePage.file.path)) {
          return false;
        }
        return true;
      });

    return inMocPagesNotAdded;
  }, [activePage, dataviewReady]);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[12px] flex flex-col gap-s overflow-auto p-m">
      <PageTitle page={activePage} />
      <Description
        text={
          <div className="text-xs text-base-60">
            This is a child note. To work with notes that link to here, tag this note with{' '}
            <span className="font-semibold text-text-accent">{plugin.settings.parentTag}</span>.
          </div>
        }
      />
      <hr />

      {activePage.upFiles.length > 0 ? (
        <div className="mt-s flex flex-col gap-s">
          <div className="flex flex-row items-center gap-s text-lg font-bold">Parent notes</div>
          <ListOfItems
            pages={activePage.upFiles}
            parentPage={activePage}
            type="TITLE_ONLY"
            preserveBg
          />
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center pt-xl text-base-70">
          <Link2Off size={32} />
          <div className="mx-xs mb-s text-sm">Unlinked note</div>
        </div>
      )}

      {indirectParents.length > 0 && (
        <>
          <div className="mx-m mt-s flex flex-col gap-s rounded-md border-1 border-base-70 p-m">
            <div className="flex flex-row items-center gap-s text-lg font-bold text-base-70">
              Indirect parents
            </div>
            {plugin.settings.showHelpText && (
              <Description
                text={
                  <div>
                    Parent notes that contain this note, but aren't added as{' '}
                    <span className="font-semibold text-text-accent">
                      {plugin.settings.upPropName}
                    </span>
                    .
                  </div>
                }
              />
            )}
            <ListOfItems
              pages={indirectParents}
              parentPage={activePage}
              type="AS_MISSING_PARENT"
              preserveBg
              addUpLink={(page) =>
                addUpLinkToNote(
                  activePage,
                  page,
                  plugin.app,
                  plugin.settings,
                  plugin.app.vault.getAllLoadedFiles(),
                )
              }
            />
          </div>
        </>
      )}
    </div>
  );
};
