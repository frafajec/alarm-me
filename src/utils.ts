import { RepetitionDayOrder } from '@src/typings';

export function pad(nbr: number): string {
  if (nbr < 10) return `0${nbr}`;
  return `${nbr}`;
}

// ---------------------------------------------------------------------------------
// TODO: config if seconds are shown, time format...
export function getTimeString(dateString: string, withSeconds: boolean = false): string {
  const date = new Date(dateString);
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? base + `:${pad(date.getSeconds())}` : base;
}

// ---------------------------------------------------------------------------------
// TODO: config time format...
export function getDateString(dateString: string): string {
  const date = new Date(dateString);
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

// ---------------------------------------------------------------------------------
export const isPast = (date: Date, now: Date = new Date()): boolean => {
  return date < now;
};

export const isToday = (someDateString: string, isTomorrow: boolean = false): boolean => {
  const someDate = new Date(someDateString);
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() + (isTomorrow ? 1 : 0) &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

export const getNextDay = (alarmDate: Date, repetitiveDays: number[]): Date | undefined => {
  const currentDay: number = alarmDate.getDay();
  let nextDay: number | undefined = undefined;
  let orderIndex = RepetitionDayOrder.indexOf(currentDay);
  let nextDayDate = new Date(alarmDate);
  let sanityCheck = 0;
  const sanityCheckStop = 8;

  // search when is the start day going to be
  do {
    // if we passed the week, reset to beginning of the week
    if (orderIndex > 6) orderIndex = 0;

    // if our index matches a selected repetitive day, check its validity
    if (repetitiveDays.includes(RepetitionDayOrder[orderIndex])) {
      // set next day as our index
      nextDay = RepetitionDayOrder[orderIndex];
      // get the distance in days
      let dayDistance = Math.abs(orderIndex - RepetitionDayOrder.indexOf(currentDay));

      // set the next date to our distance
      nextDayDate.setDate(nextDayDate.getDate() + dayDistance);
      // in case its eg. today, our next date, today, might be already in the past
      if (isPast(nextDayDate)) {
        // only one day, means add 7 days (if today is Monday, move to next Monday)
        if (repetitiveDays.length === 1) {
          nextDayDate.setDate(nextDayDate.getDate() + 7);
        } else {
          // if multiple days, invalidate this day and move to the next
          nextDay = undefined;
          nextDayDate = new Date(alarmDate);
        }
      }
    } else {
      // move to the next day
      orderIndex++;
    }
    sanityCheck++;
  } while (nextDay === undefined && sanityCheck < sanityCheckStop);

  return sanityCheck === sanityCheckStop ? undefined : nextDayDate;
};

export const getDayDistance = (dateString: string): string => {
  if (isToday(dateString)) {
    return 'today';
  } else if (isToday(dateString, true)) {
    return 'tomorrow';
  }

  return getDateString(dateString);
};

export const getTimeDistance = (dateString: string, short = false): string => {
  const date = new Date(dateString);
  const dateTime = date.getTime();
  const timeDiff = dateTime - new Date().getTime();

  // time is in the past
  if (timeDiff < 0) return 'In the past';

  const s = timeDiff / 1000; //ignore milliseconds, round seconds
  const d = Math.round(s / 86400);
  const h = Math.round((s / 3600) % 24);
  const m = Math.round((s / 60) % 60);

  let distance: string[] = [];
  if (d > 0) distance.push(`${d} day(s)`);
  if (h > 0) distance.push(`${h} hour(s)`);
  if (m > 0) distance.push(`${m} minute(s)`);
  if (distance.length == 0) distance.push('less than a minute');

  if (short) return `~${distance[0]}`;

  return `~${distance.join(', ')}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};
