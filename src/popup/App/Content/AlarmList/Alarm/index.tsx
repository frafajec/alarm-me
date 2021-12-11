import React from 'react';
import { Alarm, AlarmState } from '@src/typings';
import { getDateString, getTimeString, isPast, isToday } from '@src/utils';

import Description from './Description';
import Options from './Options';
import Ringing from './Ringing';
import { useAppSelector } from '@src/popup/store';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
export default function Alarm({ alarm }: TProps) {
  const timeFormat = useAppSelector(s => s.options.timeFormat);
  const snoozeDuration = useAppSelector(s => s.options.snooze * 60000);

  let dateSnooze: string | undefined = undefined;
  if (alarm.dateSnooze) {
    dateSnooze = new Date(new Date(alarm.dateSnooze).getTime() + snoozeDuration).toISOString();
  }
  console.log(alarm.dateSnooze, dateSnooze);
  const timeString = getTimeString(dateSnooze || alarm.date);
  const dateString = getDateString(alarm.date);

  const showDate =
    !dateSnooze && (!isToday(alarm.date) || (!alarm.repetitive && isPast(new Date(alarm.date))));

  let cls = 'rounded-md border border-cyan my-2 flex align-center relative overflow-hidden';

  if (alarm.state === AlarmState.disabled) {
    cls += ' bg-gray-400 border-gray-400 dark:bg-gray-800 dark:border-gray-800';
  }

  return (
    <div className={cls}>
      <div className="flex flex-col items-center justify-center w-20 h-11">
        <p className={`font-bold ${timeFormat === 1 ? '' : 'text-lg'} dark:text-gray-400`}>
          {timeString}
        </p>
        {showDate && !dateSnooze && (
          <p className="-mt-1.5 text-gray-600 dark:text-gray-500">{dateString}</p>
        )}
        {alarm.dateSnooze && <p className="-mt-1.5 text-gray-600 dark:text-gray-500">Snoozed</p>}
      </div>
      <div className="flex flex-col items-start justify-center border-l border-cyan border-opacity-50 py-0.5 px-1.5">
        <div
          className="font-bold text-gray-800 pr-5 overflow-hidden overflow-ellipsis whitespace-nowrap w-52 dark:text-gray-400"
          title={alarm.name}
        >
          {alarm.name || <span className="text-gray-500 italic">No name</span>}
        </div>
        <Description alarm={alarm} />
      </div>

      <Ringing alarm={alarm} />
      <Options alarm={alarm} />
    </div>
  );
}
