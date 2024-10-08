interface IStatusTextProps {
  text: string;
  color: 'text-orange' | 'text-green';
  startingIcon?: JSX.Element;
}

const StatusText = (props: IStatusTextProps) => {
  return (
    <div className={`flex w-full flex-row items-center gap-s ${props.color}`}>
      {props.startingIcon}
      <div className="text-sm">{props.text}</div>
    </div>
  );
};

export default StatusText;
