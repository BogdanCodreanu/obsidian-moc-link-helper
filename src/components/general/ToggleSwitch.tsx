import { ReactNode } from 'react';

interface ToggleSwitchProps {
  label: string;
  icon?: ReactNode;
  description?: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

const ToggleSwitch = ({
  label,
  icon,
  description,
  isEnabled,
  onToggle,
  className = '',
}: ToggleSwitchProps) => {
  return (
    <div className={`flex items-center gap-xs ${className}`} aria-label={description}>
      <label className="flex cursor-pointer items-center">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={isEnabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div
            className={`h-[20px] w-[36px] rounded-full bg-base-50 transition-colors peer-checked:bg-text-accent`}
          />
          <div
            className={`absolute left-[2px] top-[2px] h-[16px] w-[16px] rounded-full bg-base-0 transition-transform peer-checked:translate-x-[16px]`}
          />
        </div>
        {icon && <div className="ml-xs text-text-accent">{icon}</div>}
        <span className={`ml-xs text-sm ${isEnabled ? 'font-semibold' : ''} text-text-accent`}>
          {label}
        </span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
