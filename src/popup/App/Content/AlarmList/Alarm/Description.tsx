import React from 'react';
import { Alarm, RepetitionDayOrder, RepetitionDayStringShort } from '@src/typings';
import { getTimeDistance } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly alarm: Alarm;
};

// ---------------------------------------------------------------------------------
const baseClass = 'flex flex-row -mt-0.5 text-gray-500';
const checkedClass = 'text-black font-bold dark:text-gray-300';
export default function Description({ alarm }: TProps) {
  const [timeDistance, setTimeDistance] = React.useState(getTimeDistance(alarm.date, true));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeDistance(getTimeDistance(alarm.date, true));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (alarm.repetitive) {
    return (
      <div className={baseClass}>
        {RepetitionDayOrder.map(dayKey => {
          const isChecked = alarm.repetitionDays.includes(dayKey);
          return (
            <p
              key={dayKey}
              className={`mr-0.5 text-xs ${isChecked ? checkedClass : 'text-gray-500'}`}
            >
              {RepetitionDayStringShort[dayKey]}
            </p>
          );
        })}
      </div>
    );
  }

  return <div className={baseClass + ' italic'}>{timeDistance}</div>;
}
