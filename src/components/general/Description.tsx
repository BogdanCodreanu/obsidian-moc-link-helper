interface IDescriptionProps {
  text: JSX.Element | string;
  smallerText?: string;
  bigCenterIcon?: JSX.Element;
  className?: string;
}

const Description = (props: IDescriptionProps) => {
  return (
    <div className={`gap-m flex w-full flex-col items-center justify-center text-base-70 ${props.className}`}>
      {props.bigCenterIcon}
      <div className="mx-xs mb-s text-xs">
        {props.text}
      </div>
      {props.smallerText && <div className="text-xs text-base-60">{props.smallerText}</div>}
    </div>
  );
};

export default Description;
