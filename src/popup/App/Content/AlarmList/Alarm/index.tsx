import React from 'react';
import { Alarm, AlarmState } from '@src/typings';
import { getDateString, getTimeString, isPast, isToday } from '@src/utils';

import Description from './Description';
import Options from './Options';
import Ringing from './Ringing';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
export default function Alarm({ alarm }: TProps) {
  const showDate = !isToday(alarm.date) || (!alarm.repetitive && isPast(new Date(alarm.date)));

  return (
    <div className="rounded-md border border-cyan my-2 flex align-center relative overflow-hidden">
      <div className="flex flex-col items-center justify-center w-20 h-11">
        <p className="font-bold text-lg dark:text-gray-400">{getTimeString(alarm.date)}</p>
        {showDate && (
          <p className="-mt-1.5 text-gray-600 dark:text-gray-500">{getDateString(alarm.date)}</p>
        )}
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

      {alarm.state === AlarmState.ringing ? <Ringing alarm={alarm} /> : <Options alarm={alarm} />}
    </div>
  );
}
