import { Bird, Check, Link, TriangleAlert, Unlink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DvPage } from 'src/utils/fileUtils';
import Button from './Button';

interface ILinkButtonsProps {
  pages: DvPage[];
  parentPage: DvPage;
  useSelectedFiles: boolean;

  addUpLinkToNotes: (notes: DvPage[]) => void;
  removeUpLinkFromNotes: (notes: DvPage[]) => void;

  ignoreMoc?: boolean;

  preserveBg?: boolean;
}

const LinkButtons = (props: ILinkButtonsProps) => {
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setDisabled(false);
  }, [props.pages, props.parentPage]);

  const notLinkedPages = useMemo(() => {
    return props.pages.filter(
      (p) =>
        (props.ignoreMoc ? !p.isMoc : true) &&
        (p.upFiles.length === 0 ||
          !p.upFiles.some((f) => f.file.path === props.parentPage.file.path)),
    );
  }, [props.pages]);

  const linkedPages = useMemo(
    () =>
      props.pages.filter(
        (p) =>
          (props.ignoreMoc ? !p.isMoc : true) &&
          p.upFiles.length > 0 && p.upFiles.some((f) => f.file.path === props.parentPage.file.path),
      ),
    [props.pages],
  );

  const onLinkAll = () => {
    setDisabled(true);
    props.addUpLinkToNotes(notLinkedPages);
  };

  const onUnlinkAll = () => {
    setDisabled(true);
    props.removeUpLinkFromNotes(linkedPages);
  };

  return (
    <div
      className={`flex flex-col gap-s p-s ${props.preserveBg ? '' : 'border-x border-solid border-base-50 bg-base-25'}`}
    >
      <div className="flex flex-row">
        {/* NOTES LINK STATUS */}
        {props.pages.length === 0 ? (
          <div className="gap-cd flex w-full flex-col items-center justify-center text-base-70">
            <Bird size={32} />
            <div className="mx-xs mb-s text-sm">No notes are referenced in here.</div>
          </div>
        ) : notLinkedPages.length > 0 ? (
          <div className={`flex w-full flex-row items-center gap-s text-orange`}>
            <TriangleAlert size={16} />
            <div className="text-sm">{notLinkedPages.length} notes not linked.</div>
          </div>
        ) : (
          <div className={`flex w-full flex-row items-center gap-s text-green`}>
            <Check size={16} />
            <div className="text-sm">All notes linked.</div>
          </div>
        )}
      </div>

      {/* BUTTONS */}
      <div className={`flex w-full flex-row justify-stretch gap-s`}>
        <Button
          onClick={onLinkAll}
          icon={<Link size={16} />}
          label={props.useSelectedFiles ? 'Link selected files' : 'Link all'}
          isDisabled={notLinkedPages.length === 0 || disabled}
          className="w-full bg-base-0 text-green"
        />
        <Button
          onClick={onUnlinkAll}
          icon={<Unlink size={16} />}
          label={props.useSelectedFiles ? 'Unlink selected files' : 'Unlink all'}
          isDisabled={linkedPages.length === 0 || disabled}
          className="w-full bg-base-0 text-orange"
        />
      </div>
    </div>
  );
};

export default LinkButtons;
