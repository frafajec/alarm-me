import React from 'react';
import { pad } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly date: Date;
  readonly setDate: (date: Date) => void;
};

// ---------------------------------------------------------------------------------
export default function Datum({ date, setDate }: TProps) {
  const [day, setDay] = React.useState(pad(date.getDate()));
  const [month, setMonth] = React.useState(pad(date.getMonth() + 1));
  const [year, setYear] = React.useState(pad(date.getFullYear()));

  React.useEffect(() => {
    setDay(pad(date.getDate()));
    setMonth(pad(date.getMonth() + 1));
    setYear(pad(date.getFullYear()));
  }, [date]);

  // day
  const onScrollDay: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getDate();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setDate(value);
    setDate(new Date(newDate));
  };
  const onChangeDay = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setDay(pad(newValue));
  };
  const onBlurDay = (e: React.FocusEvent<HTMLInputElement>) => {
    const lastDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let newValue = Math.max(Math.min(lastDayInMonth.getDate(), parseInt(e.target.value)), 1);
    let newDate = date.setDate(newValue);
    setDate(new Date(newDate));
  };

  // month
  const onScrollMonth: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getMonth();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setMonth(value);
    setDate(new Date(newDate));
  };
  const onChangeMonth = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setMonth(pad(newValue));
  };
  const onBlurMonth = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue = Math.max(Math.min(12, parseInt(e.target.value)), 1);
    let newDate = date.setMonth(newValue - 1);
    setDate(new Date(newDate));
  };

  // year
  const onScrollYear: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = date.getFullYear();
    value += e.deltaY > 0 ? 1 : -1;
    const newDate = date.setFullYear(value);
    setDate(new Date(newDate));
  };
  const onChangeYear = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    setYear(pad(newValue));
  };
  const onBlurYear = (e: React.FocusEvent<HTMLInputElement>) => {
    let today = new Date();
    let newValue = Math.max(
      Math.min(today.getFullYear() + 5, parseInt(e.target.value)),
      today.getFullYear()
    );
    let newDate = date.setFullYear(newValue);
    setDate(new Date(newDate));
  };

  return (
    <div className="flex items-center justify-center border border-t-0 border-gray-300 rounded px-1 text-lg -mt-1.5 dark:border-gray-500 dark:text-gray-400">
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch' }}
        value={day}
        onWheel={onScrollDay}
        onChange={onChangeDay}
        onBlur={onBlurDay}
      />
      <p className="">.</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch' }}
        value={month}
        onWheel={onScrollMonth}
        onChange={onChangeMonth}
        onBlur={onBlurMonth}
      />
      <p className="">.</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '4ch' }}
        value={year}
        onWheel={onScrollYear}
        onChange={onChangeYear}
        onBlur={onBlurYear}
      />
    </div>
  );
}
