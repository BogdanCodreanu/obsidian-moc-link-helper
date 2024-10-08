interface IHeaderProps {
  title: string;
  subtitle?: string;
  icon?: JSX.Element;
}

const Header = (props: IHeaderProps) => {
  return (
    <div className="flex flex-row items-center gap-s font-bold">
        {props.icon}
        <div className="text-xl">{props.title}</div>
        {props.subtitle && <div className="text-base-40">{props.subtitle}</div>}
    </div>
  );
};

export default Header;
