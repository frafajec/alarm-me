import { ModalTab } from '@src/typings';
import React from 'react';

type TProps = {
  readonly tab: ModalTab;
  readonly setTab: (tab: ModalTab) => void;
  readonly alt?: boolean;
};
// ---------------------------------------------------------------------------------
export default function Tabs({ tab, setTab, alt }: TProps) {
  const baseClass = `flex-auto cursor-pointer py-1 px-3 transition-all select-none
    border ${alt ? 'border-orange hover:bg-orange' : 'border-cyan hover:bg-cyan'}
    hover:text-white focus:outline-none focus:shadow-outline  dark:hover:text-black
    `;
  const selectedClass = `${alt ? 'bg-orange' : 'bg-cyan'} text-white font-bold dark:text-black`;

  return (
    <div className="flex -mt-px h-full text-center">
      <p
        className={`${baseClass} rounded-bl-2xl ${
          tab == ModalTab.onetime ? selectedClass : 'dark:text-gray-400'
        }`}
        onClick={() => setTab(ModalTab.onetime)}
      >
        One time
      </p>
      <p
        className={`${baseClass} rounded-br-2xl ${
          tab == ModalTab.repetitive ? selectedClass : 'dark:text-gray-400'
        }`}
        onClick={() => setTab(ModalTab.repetitive)}
      >
        Repetitive
      </p>
    </div>
  );
}
