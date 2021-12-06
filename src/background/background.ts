import {
  Alarm,
  Storage,
  TAction,
  TCreateAlarmPayload,
  TEditAlarmPayload,
  TDeleteAlarmPayload,
  TStopAlarmRingingPayload,
} from '@src/typings';

// ---------------------------------------------------------------------------------
// STATE and LISTENERS
// ---------------------------------------------------------------------------------
let watcherInterval: NodeJS.Timer | undefined;
let storageCache: Storage = {
  alarms: [],
  options: {},
};

// when extension is added/installed, this is triggered
// here we prepare the backend script
chrome.runtime.onInstalled.addListener(async () => {
  let storage = (await chrome.storage.sync.get(storageCache)) as Storage;
  storageCache = storage;

  // to reset storage
  // await chrome.storage.sync.set(storageCache);

  // match seconds to the next minute
  let toExactMinute = 60000 - (new Date().getTime() % 60000);
  // execute watched on the next full minute and then every minute
  setTimeout(function () {
    watcherInterval = setInterval(watcher, 60 * 1000);
    watcher();
  }, toExactMinute);
});

// subscriber to receive all messages (internal and sub-apps)
chrome.runtime.onMessage.addListener(function (request: TAction<any>, sender, sendResponse) {
  handlers[request.type]?.(request.payload);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    console.log('>>> changes', changes);
    if (changes.alarms.newValue) {
      storageCache.alarms = [...changes.alarms.newValue];
    }
    // TODO: changes.options
  }
});

// ---------------------------------------------------------------------------------
// SUBSCRIBERS
// ---------------------------------------------------------------------------------
// NOTE: we can't use import statement here (service worker)
// so this is the list of important handlers (MUST MATCH sub-apps!)
const appActions = {
  popupInit: '@popup/init',
  popupInitDone: '@popup/init-done',
  popupCreateAlarm: '@popup/create-alarm',
  popupCreateAlarmDone: '@popup/create-alarm-done',
  popupEditAlarm: '@popup/edit-alarm',
  popupEditAlarmDone: '@popup/edit-alarm-done',
  popupDeleteAlarm: '@popup/delete-alarm',
  popupDeleteAlarmDone: '@popup/delete-alarm-done',
  popupStopRinging: '@popup/stop-ringing',
  popupStopAlarmRinging: '@popup/stop-alarm-ringing',
};

// registrations of listeners
const handlers = {
  [appActions.popupInit]: popupInit,
  [appActions.popupCreateAlarm]: popupCreateAlarm,
  [appActions.popupEditAlarm]: popupEditAlarm,
  [appActions.popupDeleteAlarm]: popupDeleteAlarm,
};

// ---------------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------------
// called when popup is opened - at this point backend is already running
async function popupInit() {
  // we retrieve chrome storage or return default values
  let storage = await chrome.storage.sync.get(storageCache);
  sendAction({ type: appActions.popupInitDone, payload: storage });
}

// process new alarm and pass it back to popup (so UI gets updated)
// backend will be updated from onChanged.addListener
async function popupCreateAlarm(payload: TCreateAlarmPayload) {
  const newAlarms = [...storageCache.alarms, payload.alarm];
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.popupCreateAlarmDone, payload });
}
// process alarm that already exists, on which data has been changed
async function popupEditAlarm(payload: TEditAlarmPayload) {
  const editedAlarm = { ...payload.alarm };
  const newAlarms = storageCache.alarms.map(a => (a.id == editedAlarm.id ? editedAlarm : a));
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.popupEditAlarmDone, payload });
}
// remove alarm from storage (frontend will do alarm removal in UI)
async function popupDeleteAlarm(payload: TDeleteAlarmPayload) {
  const newAlarms = storageCache.alarms.filter(a => a.id != payload.alarmId);
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.popupDeleteAlarmDone, payload });
}
// red alert call, when sound is coming from somewhere, force stop it
// this should also change all the alarms states and call again init method
async function popupStopRinging() {}

// stop alarm ringing and return to the UI updated alarm
async function popupStopAlarmRinging(payload: TStopAlarmRingingPayload) {}

// ---------------------------------------------------------------------------------
// ALARM MANAGEMENT
// ---------------------------------------------------------------------------------
// gets executed every minute to check if alarm needs to be fired
function watcher() {
  for (let i = 0; i < storageCache.alarms.length; i++) {
    const alarm = storageCache.alarms[i];
    // TODO: check date and options around alarm
  }
}

// ---------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------
// helper function to wrap chrome runtime
function sendAction(action: TAction<any>) {
  chrome.runtime.sendMessage(action);
}
