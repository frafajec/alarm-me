import React from 'react';
import { RepetitionDay, RepetitionDayOrder } from '@src/typings';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly visible: boolean;
  readonly repetitionDays: number[];
  readonly setRepetitionDays: (repetitionDays: number[]) => void;
  readonly alt?: boolean;
};

// ---------------------------------------------------------------------------------
export default function Repetitive({ visible, repetitionDays, setRepetitionDays, alt }: TProps) {
  const checkedAll = repetitionDays.length === 7;

  // handlers
  const onCheckAll = () => {
    if (checkedAll) {
      setRepetitionDays([]);
    } else {
      setRepetitionDays(RepetitionDayOrder);
    }
  };

  const onDayClick = (key: number) => {
    let newDays = [...repetitionDays];
    const index = newDays.indexOf(key);
    // add or remove select day from the array
    index > -1 ? newDays.splice(index, 1) : newDays.push(key);
    // remap the days in their respective order
    newDays = RepetitionDayOrder.map(orderIndex =>
      newDays.includes(orderIndex) ? orderIndex : undefined
    ).filter(n => n != undefined) as number[];
    // set nre repetitive days
    setRepetitionDays(newDays);
  };

  const style = {
    height: visible ? 43 : 0,
  };

  const pillClass = (checked: boolean) => `
    flex flex-col items-center justify-center py-1 w-8
    border ${
      alt ? 'hover:border-orange focus:border-orange' : 'hover:border-cyan focus:border-cyan'
    }
    dark:text-gray-400
    transition-all rounded-xl ${checked ? (alt ? 'border-orange' : 'border-cyan') : ''}
  `;
  const pillInputClass = `
    cursor-pointer ${alt ? 'text-orange' : 'text-cyan'} rounded-md focus:ring-0 bg-transparent
  `;

  return (
    <div className="flex justify-evenly transition-all overflow-hidden mt-1" style={style}>
      <div className={pillClass(checkedAll)}>
        <label htmlFor="repetitive-all" className="cursor-pointer  px-1 rounded-2xl">
          All
        </label>
        <input
          id="repetitive-all"
          type="checkbox"
          className={pillInputClass}
          checked={checkedAll}
          onClick={onCheckAll}
        />
      </div>

      <div className="w-px bg-gray-600 dark:bg-gray-400" />

      {RepetitionDayOrder.map(key => {
        const id = `repetitive-day-${key}`;
        const checked = repetitionDays.includes(key);

        return (
          <div className={pillClass(checked)}>
            <label key={id} htmlFor={id} className="cursor-pointer  px-1 rounded-2xl">
              {RepetitionDay[key]}
            </label>
            <input
              id={id}
              type="checkbox"
              className={pillInputClass}
              checked={checked}
              onClick={() => onDayClick(key)}
            />
          </div>
        );
      })}
    </div>
  );
}
