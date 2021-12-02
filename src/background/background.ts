// import test from "./testimport";

import actionTypes from "@src/actionTypes";
import { TAction } from "@src/typings";

function sendAction(action: TAction<any>) {
  console.log("sending action: ", action);
  chrome.runtime.sendMessage(action);
}

// ---------------------------------------------------------------------------------
function popupInit(payload) {
  console.log("popup init called (background)!", payload);
  sendAction({ type: actionTypes.setPopupInit, payload: { wave: "hello" } });
}

// ---------------------------------------------------------------------------------
const handlers = {
  [actionTypes.popupInit]: popupInit,
};

// NOTE: subscriber to receive all messages (internal and sub-apps)
chrome.runtime.onMessage.addListener(function (
  request: TAction<any>,
  sender,
  sendResponse
) {
  if (handlers[request.type]) {
    handlers[request.type](request.payload);
  }
});

// ---------------------------------------------------------------------------------
// console.log("test background", test);
chrome.runtime.onInstalled.addListener(() => {
  //   chrome.storage.sync.set({ color });
  //   console.log("Default background color set to %cgreen", `color: ${color}`);
  console.log("default background installed");
});
