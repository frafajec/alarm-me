import React from 'react';
import { ModalTab, RepetitionDayOrder, RepetitionDayString } from '@src/typings';
import { getDayDistance, getNextDay, getTimeDistance, getTimeString, isPast } from '@src/utils';

// ---------------------------------------------------------------------------------
type TProps = {
  readonly tab: ModalTab;
  readonly date: Date;
  readonly repetitiveDays: number[];
};

// ---------------------------------------------------------------------------------
export default function InfoText({ tab, date, repetitiveDays }: TProps) {
  const baseClass = 'flex-auto p-2 text-gray-600 dark:text-gray-400';
  const isoDate = date.toISOString();

  const [past, setPast] = React.useState(isPast(date));
  const [timeDistance, setTimeDistance] = React.useState(getTimeDistance(isoDate));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPast(isPast(date));
      setTimeDistance(getTimeDistance(isoDate));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (tab == ModalTab.repetitive && repetitiveDays.length > 0) {
    const nextDate = getNextDay(date, repetitiveDays);

    return (
      <div className={baseClass}>
        Alarm will ring <strong>every</strong>{' '}
        {repetitiveDays.map(dayIndex => RepetitionDayString[dayIndex]).join(', ')} at{' '}
        {getTimeString(isoDate)}, starting from{' '}
        <strong>{nextDate ? getDayDistance(nextDate.toISOString()) : '-'}</strong>.
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
