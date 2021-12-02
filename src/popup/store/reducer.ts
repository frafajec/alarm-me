import { TAction, THandler } from "@src/typings";
import actionTypes from "@src/actionTypes";

// ---------------------------------------------------------------------------------
export type TPopupState = {
  readonly initialized: boolean;
};
export const defaultState: TPopupState = {
  initialized: false,
};

// ---------------------------------------------------------------------------------
function setPopupInit(state: TPopupState, payload: any): TPopupState {
  console.log("payload", payload);
  return state;
}

// ---------------------------------------------------------------------------------
export const handlers = {
  [actionTypes.setPopupInit]: setPopupInit,
};

export default function app(
  state: TPopupState = defaultState,
  action: TAction<any>
) {
  // NOTE: unified place where all sub-app actions are broadcasted
  chrome.runtime.sendMessage(action);

  // trigger sub-app handlers
  const handler: THandler<TPopupState> = handlers[action.type];
  return handler ? handler(state, action.payload) : state;
}
