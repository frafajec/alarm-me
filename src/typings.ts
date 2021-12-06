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

export interface Alarm {
  readonly id: string;
  readonly name?: string;
  readonly date: string; // sometimes it gets serialized and Date() is unreliable
  readonly repetitive: boolean;
  readonly repetitionDays: number[];
  readonly disabled: boolean;
}

export interface Options {}

// ---------------------------------------------------------------------------------
// POPUP
export enum ModalType {
  create = 'Create',
  edit = 'Edit',
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

// ---------------------------------------------------------------------------------
// OPTIONS
