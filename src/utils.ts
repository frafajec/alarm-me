import { useAppSelector } from '@src/popup/store';
import { dateFormats, RepetitionDayOrder, timeFormats } from '@src/typings';

export function pad(nbr: number): string {
  if (nbr < 10) return `0${nbr}`;
  return `${nbr}`;
}

// ---------------------------------------------------------------------------------
// Formats the time portion into user wanted format
export function getTimeString(dateString: string): string {
  const date = new Date(dateString);
  const timeFormat = useAppSelector(s => s.options.timeFormat);
  let timeOutput = '';

  switch (timeFormats[timeFormat]) {
    case '12 (hh:mm AM/PM)':
      const h = pad(((date.getHours() + 11) % 12) + 1);
      timeOutput = `${h}:${pad(date.getMinutes())} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
      break;
    default:
      timeOutput = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  return timeOutput;
}

// ---------------------------------------------------------------------------------
// Formats the date portion into user wanted format
export function getDateString(dateString: string): string {
  const date = new Date(dateString);
  let dateFormat = useAppSelector(s => s.options.dateFormat);
  let dateOutput = '';

  switch (dateFormats[dateFormat]) {
    case 'DD.MM.YY':
      dateOutput =
        pad(date.getDate()) +
        '.' +
        pad(date.getMonth() + 1) +
        '.' +
        date.getFullYear().toString().substring(2);
      break;
    case 'MM-DD-YYYY':
      dateOutput =
        pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + '-' + pad(date.getFullYear());
      break;
    case 'DD/MM/YYYY':
      dateOutput =
        pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + pad(date.getFullYear());
      break;
    case 'YYYY/MM/DD':
      dateOutput =
        pad(date.getFullYear()) + '/' + pad(date.getMonth() + 1) + '/' + pad(date.getDate());
      break;
    default:
      //case "DD.MM.YYYY":
      dateOutput =
        pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getFullYear());
  }

  return dateOutput;
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

// VERY SIMILAR to background getNextDate!
export const getNextDate = (alarmDate: Date, repetitionDays: number[]): Date => {
  // failsafe
  if (repetitionDays.length === 0) {
    return alarmDate;
  }

  let nextDate: Date | undefined = undefined;

  // Sat Dec 11 2021 11:00:00 GMT+0100 (Central European Standard Time)
  // iterated time which we are trying to find
  let potentialDate = new Date();
  potentialDate.setMilliseconds(0);
  potentialDate.setSeconds(0);
  potentialDate.setMinutes(alarmDate.getMinutes());
  potentialDate.setHours(alarmDate.getHours());

  // comparison to now, so we don't set alarm in the past
  const now = new Date();

  do {
    // 6
    const currentDay = potentialDate.getDay();

    // current day is one of the repetition days
    if (repetitionDays.includes(currentDay)) {
      // check if alarm is valid (meaning its in the future from now)
      if (potentialDate > now) {
        nextDate = potentialDate;
      }
    }

    // add one day and repeat
    if (!nextDate) {
      potentialDate.setDate(potentialDate.getDate() + 1);
    }
  } while (!nextDate);

  return nextDate;
};

export const getDayDistance = (dateString: string): string => {
  const dateStringDefault = getDateString(dateString);

  if (isToday(dateString)) {
    return 'today';
  } else if (isToday(dateString, true)) {
    return 'tomorrow';
  }

  return dateStringDefault;
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
