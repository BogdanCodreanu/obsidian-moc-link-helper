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
        const isSelected = props.selectedOption === option.value;

        return (
          <button
            key={index}
            className={`flex w-full items-center gap-xs p-m text-xs ${
              isSelected
                ? 'cursor-default !bg-base-25 font-bold !shadow-none'
                : 'text-text-accent !bg-base-5'
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
            } ${
              props.mergeBottom
                ? '!rounded-b-none border border-b-0 border-solid border-base-50 !shadow-inner'
                : ''
            } ${props.mergeBottom && !isSelected ? 'border-b-1' : ''} ${
              (index !== 0 && !option.warning)? 'border-l-0' : ''
            }`}
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
