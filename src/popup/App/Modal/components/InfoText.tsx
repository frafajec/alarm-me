import React from 'react';
import { ModalTab, RepetitionDayString } from '@src/typings';
import { getDayDistance, getNextDate, getTimeDistance, getTimeString, isPast } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly tab: ModalTab;
  readonly date: Date;
  readonly repetitiveDays: number[];
};

const baseClass = 'flex-auto p-2 text-gray-600 dark:text-gray-400';
// ---------------------------------------------------------------------------------
export default function InfoText({ tab, date, repetitiveDays }: TProps) {
  const isoDate = date.toISOString();
  const timeString = getTimeString(isoDate);

  const nextDate = getNextDate(date, repetitiveDays);
  const dayDistance = getDayDistance(nextDate.toISOString());

  const [past, setPast] = React.useState(isPast(date));
  const [timeDistance, setTimeDistance] = React.useState(getTimeDistance(isoDate));

  React.useEffect(() => {
    // change every 5 seconds to update the UI accurately with time
    const interval = setInterval(() => {
      setPast(isPast(date));
      setTimeDistance(getTimeDistance(isoDate));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (tab == ModalTab.repetitive && repetitiveDays.length > 0) {
    return (
      <div className={baseClass}>
        Alarm will ring <strong>every</strong>{' '}
        {repetitiveDays.map(dayIndex => RepetitionDayString[dayIndex]).join(', ')} at {timeString},
        starting from <strong>{dayDistance}</strong>.
      </div>
    );
  }

  return past ? (
    <div className={baseClass}>
      Alarm is <strong>in the past</strong>, alarm invalid!
    </div>
  ) : (
    <div className={baseClass}>Alarm will ring in {timeDistance}.</div>
  );
}
