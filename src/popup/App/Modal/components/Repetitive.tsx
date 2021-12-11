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
  const onCheckAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (checkedAll) {
      setRepetitionDays([]);
    } else {
      setRepetitionDays(RepetitionDayOrder);
    }
  };

  const onDayClick = (e: React.MouseEvent, key: number) => {
    e.preventDefault();
    e.stopPropagation();

    let newDays = [...repetitionDays];
    const index = newDays.indexOf(key);
    // add or remove select day from the array
    index > -1 ? newDays.splice(index, 1) : newDays.push(key);
    // remap the days in their respective order
    newDays = RepetitionDayOrder.map(orderIndex =>
      newDays.includes(orderIndex) ? orderIndex : undefined
    ).filter(n => n != undefined) as number[];
    // set repetitive days
    setRepetitionDays(newDays);
  };

  const style = {
    height: visible ? 32 : 0,
  };

  const pillClass = (checked: boolean) => `
    cursor-pointer rounded-2xl
    flex flex-col items-center justify-center w-8
    border ${
      alt ? 'hover:border-orange focus:border-orange' : 'hover:border-cyan focus:border-cyan'
    }
    dark:text-gray-400
    transition-all rounded-xl ${checked ? (alt ? 'border-orange' : 'border-cyan') : ''}
  `;
  const pillInputClass = `
    cursor-pointer ${
      alt ? 'text-orange' : 'text-cyan'
    } rounded-md focus:ring-0 bg-transparent hidden
  `;

  return (
    <div className="flex justify-evenly transition-all overflow-hidden mt-1" style={style}>
      <label className={pillClass(checkedAll)}>
        All
        <input
          id="repetitive-all"
          type="checkbox"
          className={pillInputClass}
          defaultChecked={checkedAll}
          onClick={onCheckAll}
        />
      </label>

      <div className="w-px bg-gray-600 dark:bg-gray-400" />

      {RepetitionDayOrder.map(key => {
        const id = `repetitive-day-${key}`;
        const checked = repetitionDays.includes(key);

        return (
          <label className={pillClass(checked)}>
            {RepetitionDay[key]}
            <input
              id={id}
              type="checkbox"
              className={pillInputClass}
              defaultChecked={checked}
              onClick={e => onDayClick(e, key)}
            />
          </label>
        );
      })}
    </div>
  );
}
