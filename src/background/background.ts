import {
  Alarm,
  Storage,
  TAction,
  TCreateAlarmPayload,
  TEditAlarmPayload,
  TDeleteAlarmPayload,
  TStopAlarmRingingPayload,
  TOptionsChangePayload,
} from '@src/typings';

// ---------------------------------------------------------------------------------
// STATE and LISTENERS
// ---------------------------------------------------------------------------------
let watcherInterval: NodeJS.Timer | undefined;
let storageCache: Storage = {
  alarms: [],
  options: {
    snooze: 0,
    stopAfter: 5,
    tone: 3,
    timeFormat: 0,
    dateFormat: 0,
    countdown: false,
  },
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
    if (changes.alarms?.newValue) {
      storageCache.alarms = [...changes.alarms.newValue];
    }
    if (changes.options?.newValue) {
      // storageCache.options = [...changes.alarms.newValue];
      console.log(changes.options.newValue);
    }
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
  createAlarm: '@popup/create-alarm',
  createAlarmDone: '@popup/create-alarm-done',
  editAlarm: '@popup/edit-alarm',
  editAlarmDone: '@popup/edit-alarm-done',
  deleteAlarm: '@popup/delete-alarm',
  deleteAlarmDone: '@popup/delete-alarm-done',
  stopRinging: '@popup/stop-ringing',
  stopAlarmRinging: '@popup/stop-alarm-ringing',
  optionsChange: '@popup/options-change',
  optionsChangeDone: '@popup/options-change-done',
};

// registrations of listeners
const handlers = {
  [appActions.popupInit]: popupInit,
  [appActions.createAlarm]: createAlarm,
  [appActions.editAlarm]: editAlarm,
  [appActions.deleteAlarm]: deleteAlarm,
  [appActions.optionsChange]: optionsChange,
};

// ---------------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------------
// called when popup is opened - at this point backend is already running
async function popupInit() {
  // we retrieve chrome storage or return default values
  // let storage = await chrome.storage.sync.get(storageCache);
  sendAction({ type: appActions.popupInitDone, payload: storageCache });
}

// process new alarm and pass it back to popup (so UI gets updated)
// backend will be updated from onChanged.addListener
async function createAlarm(payload: TCreateAlarmPayload) {
  const newAlarms = [...storageCache.alarms, payload.alarm];
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.createAlarmDone, payload });
}
// process alarm that already exists, on which data has been changed
async function editAlarm(payload: TEditAlarmPayload) {
  const editedAlarm = { ...payload.alarm };
  const newAlarms = storageCache.alarms.map(a => (a.id == editedAlarm.id ? editedAlarm : a));
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.editAlarmDone, payload });
}
// remove alarm from storage (frontend will do alarm removal in UI)
async function deleteAlarm(payload: TDeleteAlarmPayload) {
  const newAlarms = storageCache.alarms.filter(a => a.id != payload.alarmId);
  await chrome.storage.sync.set({ alarms: newAlarms });
  sendAction({ type: appActions.deleteAlarmDone, payload });
}
// red alert call, when sound is coming from somewhere, force stop it
// this should also change all the alarms states and call again init method
async function stopRinging() {}

// stop alarm ringing and return to the UI updated alarm
async function stopAlarmRinging(payload: TStopAlarmRingingPayload) {}

// receive new options, store them and return to popup
async function optionsChange(payload: TOptionsChangePayload) {
  await chrome.storage.sync.set({ options: payload });
  sendAction({ type: appActions.optionsChangeDone, payload });
}

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
