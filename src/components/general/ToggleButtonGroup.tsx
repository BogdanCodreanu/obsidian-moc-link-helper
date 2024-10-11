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
                ? 'cursor-default !bg-base-20 font-bold'
                : 'text-text-accent'
            } ${
              index === 0
                ? 'rounded-l-lg rounded-r-none border-r-0'
                : index === props.options.length - 1
                  ? 'rounded-l-none rounded-r-lg border-l-0'
                  : '!rounded-none'
            } ${
              option.warning
                ? 'border border-l border-r border-solid border-orange !text-orange'
                : ''
            } ${props.mergeBottom ? 'rounded-b-none border-b-0 ' : ''}`}
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
