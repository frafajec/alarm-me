import React from 'react';
import { pad } from '@src/utils';
import { useAppSelector } from '@src/popup/store';
import { timeFormats } from '@src/typings';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly date: Date;
  readonly setDate: (date: Date) => void;
};

// ---------------------------------------------------------------------------------
export default function Time({ date, setDate }: TProps) {
  const timeFormatIndex = useAppSelector(s => s.options.timeFormat);

  // --------------------
  // state
  const [hours, setHours] = React.useState(date.getHours());
  const [minutes, setMinutes] = React.useState(date.getMinutes());

  // if new date comes, reset
  React.useEffect(() => {
    setHours(date.getHours());
    setMinutes(date.getMinutes());
  }, [date]);

  React.useEffect(() => {
    let dateChange = date.setHours(hours);
    dateChange = new Date(dateChange).setMinutes(minutes);
    dateChange = new Date(dateChange).setSeconds(0);
    dateChange = new Date(dateChange).setMilliseconds(0);
    setDate(new Date(dateChange));
  }, [hours, minutes]);

  // --------------------
  // handlers
  const onScrollHours: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = hours;

    value += e.deltaY > 0 ? 1 : -1;
    if (value < 0) value = 23;
    if (value > 23) value = 0;
    setHours(value);
  };
  const onChangeHours = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    if (newValue > 23) return;
    setHours(newValue);
  };

  const onScrollMinutes: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = minutes;

    value += e.deltaY > 0 ? 1 : -1;
    if (value < 0) value = 59;
    if (value > 59) value = 0;
    setMinutes(value);
  };
  const onChangeMinutes = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    if (newValue > 59) return;
    setMinutes(newValue);
  };

  const onScrollDayPeriod = (e: React.WheelEvent<HTMLInputElement>) => {
    let value = hours;
    const dayPeriod = calcDayPeriod();

    value += dayPeriod === 'AM' ? 12 : -12;
    setHours(value);
  };

  // --------------------
  // preview
  const calcHours = () => {
    if (timeFormatIndex == 1) {
      let hours = date.getHours();
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return pad(hours);
    }

    return pad(date.getHours());
  };

  const calcDayPeriod = () => {
    let hours = date.getHours();
    return hours >= 12 ? 'PM' : 'AM';
  };

  return (
    <div className="flex items-center justify-center border border-b-0 border-gray-300 rounded px-1 text-2xl dark:border-gray-500 dark:text-gray-400">
      <input
        className="text-center outline-none font-bold bg-transparent"
        style={{ width: '2ch' }}
        value={calcHours()}
        onWheel={onScrollHours}
        onChange={onChangeHours}
      />
      <p className="text-xl">:</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch' }}
        value={pad(minutes)}
        onWheel={onScrollMinutes}
        onChange={onChangeMinutes}
      />
      {timeFormatIndex === 1 && (
        <p className="ml-2 mr-1" style={{ width: '2ch' }} onWheel={onScrollDayPeriod}>
          {calcDayPeriod()}
        </p>
      )}
    </div>
  );
}
