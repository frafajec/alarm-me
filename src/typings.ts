import { Action } from 'redux';

// ---------------------------------------------------------------------------------
// GLOBAL
export type THandler<Type> = (state: Type, payload?: any) => Type;
export type TActionType = string;
export interface TAction<T = undefined> extends Action {
  type: TActionType;
  payload?: T;
}

// ---------------------------------------------------------------------------------
// Reused interfaces
export interface Storage {
  alarms: Alarm[];
  options: Options;
}

export enum AlarmState {
  active = 'Active',
  disabled = 'Disabled',
  ringing = 'Ringing',
  snoozed = 'Snoozed',
}

export interface Alarm {
  readonly id: string;
  readonly name?: string;
  readonly date: string; // sometimes it gets serialized and Date() is unreliable
  dateSnooze?: string;
  readonly repetitive: boolean;
  readonly repetitionDays: number[];
  state: AlarmState;
}

export interface ActiveAlarm {
  readonly id: string;
  readonly tone: HTMLAudioElement;
}

export interface Options {
  readonly snooze: number;
  readonly stopAfter: number;
  readonly tone: number;
  readonly timeFormat: number;
  readonly dateFormat: number;
}

// ---------------------------------------------------------------------------------
// POPUP
export enum ModalType {
  create = 'Create',
  edit = 'Edit',
  options = 'Options',
}

export enum ModalTab {
  onetime = 'One time',
  repetitive = 'Repetitive',
}

export enum RepetitionDay {
  Mon = 1,
  Tue = 2,
  Wed = 3,
  Thu = 4,
  Fri = 5,
  Sat = 6,
  Sun = 0,
}

export const RepetitionDayString = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const RepetitionDayStringShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const RepetitionDayOrder = [1, 2, 3, 4, 5, 6, 0];

export type TSetModalPayload = {
  readonly modalType?: ModalType;
  readonly alarmEdited?: Alarm;
};

export type TCreateAlarmPayload = {
  readonly alarm: Alarm;
};
export type TEditAlarmPayload = {
  readonly alarm: Alarm;
};
export type TDeleteAlarmPayload = {
  readonly alarmId: string;
};
export type TStopAlarmPayload = {
  readonly alarm: Alarm;
};
export type TSnoozeAlarmPayload = {
  readonly alarm: Alarm;
};
export type TStopAlarmAllPayload = {
  readonly alarms: Alarm[];
};
export type TUpdateAlarms = {
  readonly alarms: Alarm[];
};
export type TOptionsChangePayload = Options;

// ---------------------------------------------------------------------------------
// OPTIONS
export const tones = ['Ping 1', 'Ping 2', 'Light', 'Happy day', 'Soft chime', 'Alarm'];
export const timeFormats = ['24 (HH:mm)', '12 (hh:mm AM/PM)'];
export const dateFormats = ['DD.MM.YYYY', 'DD.MM.YY', 'MM-DD-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'];

export const toneList = [
  new Audio('./tones/ping1.mp3'),
  new Audio('./tones/ping2.mp3'),
  new Audio('./tones/light.mp3'),
  new Audio('./tones/happyday.mp3'),
  new Audio('./tones/softchime.mp3'),
  new Audio('./tones/alarm.mp3'),
];
