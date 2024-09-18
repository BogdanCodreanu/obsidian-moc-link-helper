interface IButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  className?: string;
  icon?: JSX.Element;
  label?: string;
}

const Button = (props: IButtonProps) => {
  return (
    <button
      className={`flex items-center gap-xs p-m text-xs ${props.className}`}
      onClick={props.onClick}
      disabled={props.isDisabled}
    >
      {props.icon}
      {props.label}
    </button>
  );
};

export default Button;
