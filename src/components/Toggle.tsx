import React from 'react';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly title?: string;
};

const toggleBaseClass =
  'absolute block w-4 h-4 mt-1 ml-1 rounded-full shadow focus-within:shadow-outline inset-y-0 left-0 transition-transform duration-300 ease-in-out';
const checkedClass = 'bg-cyan transform translate-x-full';
const uncheckedClass = 'bg-black dark:bg-white';
// ---------------------------------------------------------------------------------
export default function Toggle({ checked, onChange, title }: TProps) {
  const cls = `${toggleBaseClass} ${checked ? checkedClass : uncheckedClass}`;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(!checked);
  };

  return (
    <label
      htmlFor="checked"
      className={`flex items-center cursor-pointer transform mx-px`}
      onClick={onClick}
      title={title}
    >
      <span className="relative">
        <span className="block w-10 h-6 bg-gray-300 dark:bg-black rounded-full shadow-inner" />
        <span className={cls}>
          <input id="checked" type="checkbox" className="absolute opacity-0 w-0 h-0" />
        </span>
      </span>
    </label>
  );
}
