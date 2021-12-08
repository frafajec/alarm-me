import actionTypes from '@src/popup/store/actionTypes';
import {
  TAction,
  TCreateAlarmPayload,
  TDeleteAlarmPayload,
  TEditAlarmPayload,
  TSetModalPayload,
  TStopAlarmRingingPayload,
  TOptionsChangePayload,
} from '@src/typings';

// ---------------------------------------------------------------------------------
function init(): TAction<undefined> {
  return {
    type: actionTypes.init,
  };
}

function setModal(payload: TSetModalPayload): TAction<TSetModalPayload> {
  return {
    type: actionTypes.setModal,
    payload,
  };
}

function createAlarm(payload: TCreateAlarmPayload): TAction<TCreateAlarmPayload> {
  return {
    type: actionTypes.createAlarm,
    payload,
  };
}

function editAlarm(payload: TEditAlarmPayload): TAction<TEditAlarmPayload> {
  return {
    type: actionTypes.editAlarm,
    payload,
  };
}

function deleteAlarm(payload: TDeleteAlarmPayload): TAction<TDeleteAlarmPayload> {
  return {
    type: actionTypes.deleteAlarm,
    payload,
  };
}

function stopRinging(): TAction<undefined> {
  return {
    type: actionTypes.stopRinging,
  };
}

function stopAlarmRinging(payload: TStopAlarmRingingPayload): TAction<TStopAlarmRingingPayload> {
  return {
    type: actionTypes.stopAlarmRinging,
    payload,
  };
}

function optionsChange(payload: TOptionsChangePayload): TAction<TOptionsChangePayload> {
  return {
    type: actionTypes.optionsChange,
    payload,
  };
}

const actions = {
  init,
  setModal,
  createAlarm,
  editAlarm,
  deleteAlarm,
  stopRinging,
  stopAlarmRinging,
  optionsChange,
};

// ---------------------------------------------------------------------------------
export default actions;
