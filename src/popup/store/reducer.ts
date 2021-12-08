import {
  Alarm,
  ModalType,
  Options,
  Storage,
  TAction,
  TCreateAlarmPayload,
  TDeleteAlarmPayload,
  TEditAlarmPayload,
  THandler,
  TOptionsChangePayload,
  TSetModalPayload,
} from '@src/typings';
import actionTypes from '@popup/store/actionTypes';

// ---------------------------------------------------------------------------------
export type TPopupState = {
  readonly initialized: boolean;
  readonly alarms: Alarm[];
  readonly options: Options;

  // ui
  readonly modalType?: ModalType;
  readonly alarmEdited?: Alarm;
};
export const defaultState: TPopupState = {
  initialized: false,
  alarms: [],
  options: {
    snooze: 0,
    stopAfter: 5,
    tone: 3,
    timeFormat: 0,
    dateFormat: 0,
    countdown: false,
  }, // MUST match background defaults
};

// ---------------------------------------------------------------------------------
function initDone(state: TPopupState, payload: Storage): TPopupState {
  return {
    ...state,
    initialized: true,
    alarms: [...payload.alarms],
    options: { ...payload.options },
  };
}

function setModal(state: TPopupState, payload: TSetModalPayload): TPopupState {
  return {
    ...state,
    modalType: payload.modalType,
    alarmEdited: payload.alarmEdited,
  };
}

function createAlarmDone(state: TPopupState, payload: TCreateAlarmPayload): TPopupState {
  const newAlarms = [...state.alarms, payload.alarm];
  return {
    ...state,
    modalType: undefined,
    alarmEdited: undefined,
    alarms: newAlarms,
  };
}

function editAlarmDone(state: TPopupState, payload: TEditAlarmPayload): TPopupState {
  const editedAlarm = { ...payload.alarm };
  const newAlarms = state.alarms.map(a => (a.id === editedAlarm.id ? editedAlarm : a));
  return {
    ...state,
    modalType: undefined,
    alarmEdited: undefined,
    alarms: newAlarms,
  };
}

function deleteAlarmDone(state: TPopupState, payload: TDeleteAlarmPayload): TPopupState {
  return {
    ...state,
    alarms: state.alarms.filter(a => a.id != payload.alarmId),
  };
}

function optionsChangeDone(state: TPopupState, payload: TOptionsChangePayload): TPopupState {
  return {
    ...state,
    modalType: undefined,
    options: { ...payload },
  };
}

// ---------------------------------------------------------------------------------
export const handlers = {
  [actionTypes.initDone]: initDone,
  [actionTypes.setModal]: setModal,
  [actionTypes.createAlarmDone]: createAlarmDone,
  [actionTypes.editAlarmDone]: editAlarmDone,
  [actionTypes.deleteAlarmDone]: deleteAlarmDone,
  [actionTypes.optionsChangeDone]: optionsChangeDone,
};

export default function app(state: TPopupState = defaultState, action: TAction<any>) {
  // NOTE: unified place where all sub-app actions are broadcasted
  chrome.runtime.sendMessage(action);

  // trigger sub-app handlers
  const handler: THandler<TPopupState> = handlers[action.type];
  return handler ? handler(state, action.payload) : state;
}
