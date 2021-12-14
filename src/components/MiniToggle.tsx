import React from 'react';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly checked: boolean;
  readonly onChange?: (checked: boolean) => void;
};

const toggleBaseClass =
  'absolute block w-2 h-2 mt-1 ml-1 rounded-full shadow focus-within:shadow-outline inset-y-0 left-0 transition-transform duration-300 ease-in-out';
const checkedClass = 'bg-cyan transform translate-x-full';
const uncheckedClass = 'bg-black dark:bg-white';
// ---------------------------------------------------------------------------------
export default function MiniToggle({ checked, onChange }: TProps) {
  const cls = `${toggleBaseClass} ${checked ? checkedClass : uncheckedClass}`;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(!checked);
  };

  return (
    <label
      htmlFor="checked"
      className={`flex items-center cursor-pointer transform mx-px -rotate-90`}
      onClick={onClick}
      title="Disable/Enable alarm"
    >
      <span className="relative">
        <span
          className={`block w-6 h-4 ${
            !!onChange ? 'bg-white dark:bg-black' : 'bg-gray-400 dark:bg-gray-800'
          } rounded-full shadow-inner`}
        />
        <span className={cls}>
          <input id="checked" type="checkbox" className="absolute opacity-0 w-0 h-0" />
        </span>
      </span>
    </label>
  );
}
