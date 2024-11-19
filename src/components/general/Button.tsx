interface IButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  className?: string;
  icon?: JSX.Element;
  label?: string;
  ariaLabel?: string;
}

const Button = (props: IButtonProps) => {
  return (
    <button
      className={`flex items-center gap-xs border border-base-40 p-m text-xs ${props.className}`}
      onClick={props.onClick}
      disabled={props.isDisabled}
      aria-label={props.ariaLabel}
    >
      {props.icon}
      {props.label}
    </button>
  );
};

export default Button;
