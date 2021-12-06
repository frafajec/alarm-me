import React from 'react';
import { pad } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly date: Date;
  readonly setDate: (date: Date) => void;
};

// ---------------------------------------------------------------------------------
export default function Time({ date, setDate }: TProps) {
  const [hours, setHours] = React.useState(pad(date.getHours()));
  const [minutes, setMinutes] = React.useState(pad(date.getMinutes()));

  React.useEffect(() => {
    let dateChange = date.setHours(parseInt(hours));
    dateChange = new Date(dateChange).setMinutes(parseInt(minutes));
    dateChange = new Date(dateChange).setSeconds(0);
    dateChange = new Date(dateChange).setMilliseconds(0);
    setDate(new Date(dateChange));
  }, [hours, minutes]);

  // --------------------
  // handlers
  const onScrollHours: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = parseInt(hours);

    value += e.deltaY > 0 ? 1 : -1;
    if (value < 0) value = 23;
    if (value > 23) value = 0;
    setHours(pad(value));
  };
  const onChangeHours = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    if (newValue > 23) return;
    setHours(pad(newValue));
  };

  const onScrollMinutes: React.WheelEventHandler<HTMLInputElement> = e => {
    let value = parseInt(minutes);

    value += e.deltaY > 0 ? 1 : -1;
    if (value < 0) value = 59;
    if (value > 59) value = 0;
    setMinutes(pad(value));
  };
  const onChangeMinutes = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    if (newValue > 59) return;
    setMinutes(pad(newValue));
  };

  return (
    <div className="flex items-center justify-center border border-b-0 border-gray-300 rounded px-1 text-2xl dark:border-gray-500 dark:text-gray-400">
      <input
        className="text-center outline-none font-bold bg-transparent"
        style={{ width: '2ch' }}
        value={hours}
        onWheel={onScrollHours}
        onChange={onChangeHours}
      />
      <p className="text-xl">:</p>
      <input
        className="text-center outline-none bg-transparent"
        style={{ width: '2ch' }}
        value={minutes}
        onWheel={onScrollMinutes}
        onChange={onChangeMinutes}
      />
    </div>
  );
}
