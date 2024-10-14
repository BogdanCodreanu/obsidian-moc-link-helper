import { TriangleAlert } from 'lucide-react';

interface IToggleButtonGroupProps {
  options: {
    label: string;
    value: string;
    warning?: boolean;
  }[];
  selectedOption: string;
  onOptionSelected: (option: string) => void;
  mergeBottom?: boolean;
}

const ToggleButtonGroup = (props: IToggleButtonGroupProps) => {
  return (
    <div className="flex w-full flex-row">
      {props.options.map((option, index) => {
        return (
          <button
            key={index}
            className={`flex w-full items-center gap-xs p-m text-xs ${
              option.value === props.selectedOption
                ? 'cursor-default !bg-base-25 font-bold !shadow-none'
                : 'text-text-accent'
            } ${
              index === 0
                ? 'rounded-l-lg rounded-r-none'
                : index === props.options.length - 1
                  ? 'rounded-l-none rounded-r-lg'
                  : '!rounded-none'
            } ${
              option.warning
                ? 'border border-l border-r border-solid border-orange !text-orange'
                : ''
            } ${props.mergeBottom ? 'border border-solid border-base-50 !rounded-b-none border-b-0 !shadow-inner' : ''}`}
            onClick={() => props.onOptionSelected(option.value)}
          >
            {option.warning && <TriangleAlert size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ToggleButtonGroup;
