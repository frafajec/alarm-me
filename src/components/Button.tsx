import React from 'react';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly children: React.ReactNode;
  readonly onClick: () => void;
  readonly className?: string;
  readonly outline?: boolean;
  readonly disabled?: boolean;
  readonly alt?: boolean;
};
// ---------------------------------------------------------------------------------
const outlineStyle =
  'border border-cyan bg-white dark:bg-transparent text-sm text-cyan rounded-full py-1.5 px-8 transition duration-500 ease select-none hover:text-white dark:hover:text-black hover:bg-cyan focus:outline-none focus:shadow-outline';
const outlineStyleAlt =
  'border border-orange bg-white dark:bg-transparent text-sm text-orange rounded-full py-1.5 px-8 transition duration-500 ease select-none hover:text-white dark:hover:text-black hover:bg-orange focus:outline-none focus:shadow-outline';
const fillStyle =
  'border border-cyan bg-cyan text-sm text-white dark:text-black rounded-full py-1.5 px-8 transition duration-500 ease select-none hover:bg-cyanDark hover:border-cyanDark focus:outline-none focus:shadow-outline';
const fillStyleAlt =
  'border border-orange bg-orange text-sm text-white dark:text-black rounded-full py-1.5 px-8 transition duration-500 ease select-none hover:bg-orangeDark hover:border-orangeDark focus:outline-none focus:shadow-outline';
const disabledStyle =
  ' border-gray-300 text-gray-600 bg-gray-300 disabled hover:text-gray-600 hover:bg-gray-300 focus:bg-gray-300 focus:text-gray-600 hover:border-gray-300 focus:border-gray-300 cursor-auto';
export default function Button({
  children,
  onClick,
  className = '',
  outline,
  disabled,
  alt,
}: TProps) {
  let cls = outline ? (alt ? outlineStyleAlt : outlineStyle) : alt ? fillStyleAlt : fillStyle;
  if (disabled) cls += disabledStyle;

  const onClickInternal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button className={cls + ' ' + className} onClick={onClickInternal} disabled={disabled}>
      {children}
    </button>
  );
}
