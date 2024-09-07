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
      className={`flex items-center gap-1 p-2 text-xs ${props.className}`}
      onClick={props.onClick}
      disabled={props.isDisabled}
    >
      {props.icon}
      {props.label}
    </button>
  );
};

export default Button;
