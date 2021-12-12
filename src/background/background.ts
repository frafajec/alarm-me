import {
  Storage,
  TAction,
  TCreateAlarmPayload,
  TEditAlarmPayload,
  TDeleteAlarmPayload,
  TStopAlarmPayload,
  TOptionsChangePayload,
  ActiveAlarm,
  Alarm,
  TSnoozeAlarmPayload,
} from '@src/typings';

// ---------------------------------------------------------------------------------
// STATE and LISTENERS
// ---------------------------------------------------------------------------------
let storageCache: Storage = {
  alarms: [],
  options: {
    snooze: 0,
    stopAfter: 2,
    tone: 0,
    timeFormat: 0,
    dateFormat: 0,
  },
};
(window as any).storageCache = storageCache;

let watcherInterval: NodeJS.Timer | undefined;
let activeAlarm: ActiveAlarm | undefined;

// --------------------
// MUST MATCH typings for Popup (service worker can't use imports)
const toneList = [
  new Audio('./tones/ping1.mp3'),
  new Audio('./tones/ping2.mp3'),
  new Audio('./tones/light.mp3'),
  new Audio('./tones/happyday.mp3'),
  new Audio('./tones/softchime.mp3'),
  new Audio('./tones/alarm.mp3'),
];
enum AlarmState {
  active = 'Active',
  disabled = 'Disabled',
  ringing = 'Ringing',
  snoozed = 'Snoozed',
}
// end imports

window.onload = async () => {
  // let storage = (await chrome.storage.sync.get(storageCache)) as Storage;
  let storage = (await storageGet<Storage>(storageCache)) as Storage;
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
};

// when extension is installed/updates, this is triggered
// here we prepare the backend the migration etc.
chrome.runtime.onInstalled.addListener(async ({ previousVersion, reason }) => {
  console.log('onInstalled!', reason, previousVersion);
  if (reason === 'update' && previousVersion === '1.5.0') {
    // perform migration
    // TODO: migrate from previous objects and delete them

    let newOptions = { ...storageCache.options };
    const oldStorage = await storageGet({ AM_alarms: [], AM_options: {} });
    // const oldStorage = {
    //   AM_alarms: [
    //     {
    //       active: true,
    //       desc: '',
    //       key: 'a30y7b',
    //       name: '',
    //       rep_days: [false, false, false, false, false, false, true],
    //       repetitive: true,
    //       ringing: false,
    //       time_created: 1639344458534,
    //       time_rep: 1640122080000,
    //       time_set: 1640122080000,
    //       time_span: 777621466,
    //     },
    //   ],
    //   AM_options: {
    //     countdown: false,
    //     date_format: 0,
    //     inactive: false,
    //     snooze: '10',
    //     stop_after: '10',
    //     time_format: 0,
    //     tone: 0,
    //     type: 'custom',
    //     volume: '100',
    //   },
    // };

    // OLD options migration
    // countdown: false
    // date_format: 0
    // inactive: false
    // snooze: "10"
    // stop_after: "10"
    // time_format: 0
    // tone: 0
    // type: "custom"
    // volume: "100"
    if (oldStorage.AM_options.date_format !== undefined) {
      newOptions.dateFormat = oldStorage.AM_options.date_format;
    }
    if (oldStorage.AM_options.time_format !== undefined) {
      newOptions.timeFormat = oldStorage.AM_options.time_format;
    }
    if (oldStorage.AM_options.snooze !== undefined) {
      const newSnooze = parseInt(oldStorage.AM_options.snooze);
      newOptions.snooze = isNaN(newSnooze) ? newOptions.snooze : newSnooze;
    }
    if (oldStorage.AM_options.stop_after !== undefined) {
      const newStop = parseInt(oldStorage.AM_options.stop_after);
      newOptions.stopAfter = isNaN(newStop) ? newOptions.stopAfter : newStop;
    }

    // OLD alarm migration
    // active: true
    // desc: ""
    // key: "el4p79"
    // name: ""
    // rep_days: (7) [0, 0, 0, 0, 0, 0, 0]
    // repetitive: false
    // ringing: false
    // time_created: 1638808765368
    // time_rep: ""
    // time_set: 1639687380000
    // time_span: 878614632
    const newAlarms: Alarm[] = oldStorage.AM_alarms?.map((oldAlarm): Alarm => {
      const repSunday = oldAlarm.rep_days?.pop() || false;
      const newRepDays = [
        repSunday,
        ...(oldAlarm.rep_days || [false, false, false, false, false, false]),
      ];

      return {
        id: oldAlarm.key,
        name: oldAlarm.name,
        date: new Date(oldAlarm.time_set).toISOString(),
        repetitive: oldAlarm.repetitive,
        repetitionDays: newRepDays.map(d => (d ? 1 : 0)),
        state: oldAlarm.active ? AlarmState.active : AlarmState.disabled,
      } as Alarm;
    });

    storageSet({ alarms: newAlarms, options: newOptions });
  }
});

// subscriber to receive all messages (internal and sub-apps)
chrome.runtime.onMessage.addListener(function (request: TAction<any>, sender, sendResponse) {
  handlers[request.type]?.(request.payload);
});

// any change to storage is reported here
// so when storage is changed, we update our cache
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.alarms?.newValue) {
      storageCache.alarms = [...changes.alarms.newValue];
      updateBadge();
    }
    if (changes.options?.newValue) {
      storageCache.options = { ...changes.options.newValue };
    }
  }
});

chrome.notifications.onClicked.addListener((alarmId: string) => {
  const notifAlarm = storageCache.alarms.find(a => a.id === alarmId);
  notifAlarm && stopAlarm({ alarm: notifAlarm });
});

chrome.notifications.onButtonClicked.addListener((alarmId: string, btnIndex: number) => {
  const notifAlarm = storageCache.alarms.find(a => a.id === alarmId);

  if (btnIndex === 1) {
    notifAlarm && snoozeAlarm({ alarm: notifAlarm });
  } else {
    notifAlarm && stopAlarm({ alarm: notifAlarm });
  }
});

chrome.notifications.onClosed.addListener((alarmId: string, byUser: boolean) => {
  if (byUser) {
    const notifAlarm = storageCache.alarms.find(a => a.id === alarmId);
    notifAlarm && stopAlarm({ alarm: notifAlarm });
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
  stopAlarm: '@popup/stop-alarm',
  stopAlarmDone: '@popup/stop-alarm-done',
  snoozeAlarm: '@popup/snooze-alarm',
  snoozeAlarmDone: '@popup/snooze-alarm-done',
  stopAlarmAll: '@popup/stop-alarm-all',
  stopAlarmAllDone: '@popup/stop-alarm-all-done',
  updateAlarms: '@popup/update-alarms',
  optionsChange: '@popup/options-change',
  optionsChangeDone: '@popup/options-change-done',
};

// registrations of listeners
const handlers = {
  [appActions.popupInit]: popupInit,
  [appActions.createAlarm]: createAlarm,
  [appActions.editAlarm]: editAlarm,
  [appActions.deleteAlarm]: deleteAlarm,
  [appActions.stopAlarm]: stopAlarm,
  [appActions.stopAlarmAll]: stopAlarmAll,
  [appActions.snoozeAlarm]: snoozeAlarm,
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
  // await chrome.storage.sync.set({ alarms: newAlarms });
  await storageSet({ alarms: newAlarms });
  sendAction({ type: appActions.createAlarmDone, payload });
}

// process alarm that already exists, on which data has been changed
async function editAlarm(payload: TEditAlarmPayload) {
  const editedAlarm = { ...payload.alarm };
  // alarm could be woken up from disabled state
  // calculate when it should execute
  if (editedAlarm.repetitive) {
    updateAlarm(editedAlarm);
  }
  const newAlarms = storageCache.alarms.map(a => (a.id == editedAlarm.id ? editedAlarm : a));
  // await chrome.storage.sync.set({ alarms: newAlarms });
  await storageSet({ alarms: newAlarms });
  sendAction({ type: appActions.editAlarmDone, payload });
}

// remove alarm from storage (frontend will do alarm removal in UI)
async function deleteAlarm(payload: TDeleteAlarmPayload) {
  const newAlarms = storageCache.alarms.filter(a => a.id != payload.alarmId);
  // await chrome.storage.sync.set({ alarms: newAlarms });
  await storageSet({ alarms: newAlarms });
  sendAction({ type: appActions.deleteAlarmDone, payload });
}

// stop alarm ringing and return to the UI updated alarm
async function stopAlarm(payload: TStopAlarmPayload) {
  // change the alarm state from ringing to inactive
  const newAlarm = { ...payload.alarm };
  updateAlarm(newAlarm);

  // if this is also active alarm, stop the ringing
  activeAlarmStop(newAlarm);

  const newAlarms = storageCache.alarms.map(a => (a.id == newAlarm.id ? newAlarm : a));
  await storageSet({ alarms: newAlarms });
  sendAction({ type: appActions.stopAlarmDone, payload: { alarm: newAlarm } });
}

async function snoozeAlarm(payload: TSnoozeAlarmPayload) {
  // change the alarm state from ringing to inactive
  const newAlarm = { ...payload.alarm };

  // clear the notification since its snoozed!
  chrome.notifications.clear(newAlarm.id);

  activeAlarmStop(newAlarm);

  const snoozeDuration = storageCache.options.snooze * 60 * 1000;
  const alarmTime = new Date(newAlarm.date).getTime();
  newAlarm.state = AlarmState.snoozed;
  newAlarm.dateSnooze = new Date(alarmTime + snoozeDuration).toISOString();

  const newAlarms = storageCache.alarms.map(a => (a.id == newAlarm.id ? newAlarm : a));
  await storageSet({ alarms: newAlarms });
  sendAction({ type: appActions.snoozeAlarmDone, payload: { alarm: newAlarm } });
}

// red alert call, when sound is coming from somewhere, force stop it
// this should also change all the alarms states and call again init method
async function stopAlarmAll() {
  // stop the ringing
  activeAlarmStop();

  // no alarm is ringing, don't proceed
  if (!storageCache.alarms.some(a => a.state === AlarmState.ringing)) {
    return;
  }

  const newAlarms = storageCache.alarms.map(a => {
    if (a.state === AlarmState.ringing) {
      updateAlarm(a);
    }
    return a;
  });

  // push new alarms to storage
  await storageSet({ alarms: newAlarms });

  // return to popup checked list
  sendAction({ type: appActions.stopAlarmAllDone, payload: { alarms: newAlarms } });
}

// receive new options, store them and return to popup
async function optionsChange(payload: TOptionsChangePayload) {
  await storageSet({ options: payload });
  sendAction({ type: appActions.optionsChangeDone, payload });
}

// ---------------------------------------------------------------------------------
// TABS alternative to background sounds
// ---------------------------------------------------------------------------------
// once migration to V3 happens, we can't use audio in the background script since its service worker
// alternative is to open a tab where alarm plays, and control the behavior of the tab...
// chrome.tabs.onRemoved.addListener(function (tabid, removed) {
//   alert('tab closed');
// });
// chrome.tabs.remove(tabId);
// let url = chrome.runtime.getURL('audio.html');
// const tabData = await chrome.tabs.create({
//   url,
//   active: false,
// });

// ---------------------------------------------------------------------------------
// ALARM MANAGEMENT
// ---------------------------------------------------------------------------------
// gets executed every minute to check if alarm needs to be fired
function watcher() {
  // reset the time without seconds to match frontend (always without seconds)
  const nowDate = new Date();
  nowDate.setSeconds(0);
  nowDate.setMilliseconds(0);
  const now = nowDate.getTime();

  // performance optimization, so if nothing happens we don't spam messages
  let hasChanged = false;

  // evaluation variables
  const watchedAlarms = [...storageCache.alarms];
  const snoozeDuration = storageCache.options.snooze * 60 * 1000;
  const stopDuration = storageCache.options.stopAfter * 60 * 1000;

  watchedAlarms.forEach(alarm => {
    const alarmTime = new Date(alarm.date).getTime();
    const timeDiff = now - alarmTime;

    // ------------------------------
    // alarm is already ringing - check if it should be stopped or snoozed
    // if stopAfter is 0, alarm rings forever
    // if stopAfter is > 0 and snooze exists, once stopAfter completes, snooze the alarm
    if (alarm.state === AlarmState.ringing) {
      // leave it ring
      if (!stopDuration) {
        return;
      }

      // alarm has been snoozed and is now ringing
      if (alarm.dateSnooze) {
        const snoozedTime = new Date(alarm.dateSnooze).getTime();
        const snoozeDiff = now - snoozedTime;

        // alarm matches snoozed time, disable
        // NOTE: we only allow one auto-snooze!
        if (isDiffTolerance(snoozeDiff)) {
          activeAlarmStop(alarm);
          updateAlarm(alarm);
          hasChanged = true;
          return;
        }
      }

      // alarm start time + stop duration is matched, stop the alarm
      if (isDiffTolerance(timeDiff + stopDuration)) {
        // if user has snooze enabled, do auto-snooze
        if (snoozeDuration) {
          console.log('has snooze, snooze alarm');
          activeAlarmStop(alarm);
          alarm.state = AlarmState.snoozed;
          alarm.dateSnooze = new Date(alarmTime + snoozeDuration).toISOString();
          hasChanged = true;
          chrome.notifications.clear(alarm.id);
          return;
        }

        // no snooze enabled, and stop after is set and matched - stop the alarm
        activeAlarmStop();
        updateAlarm(alarm);
        hasChanged = true;
        return;
      }

      // alarm is ringing, but stopAfter is not matched, continue
      return;
    }

    // ------------------------------
    // alarm was snoozed - check if we need to ring again
    if (alarm.state === AlarmState.snoozed && alarm.dateSnooze) {
      // user removed snooze from options, clean the alarm
      if (!snoozeDuration) {
        alarm.state = alarm.repetitive ? AlarmState.active : AlarmState.disabled;
        alarm.dateSnooze = undefined;
        hasChanged = true;
        return;
      }

      const snoozeTime = new Date(alarm.dateSnooze).getTime();
      const snoozeDiff = Math.abs(snoozeTime - now);
      // snoozed time is now - ring the alarm
      if (isDiffTolerance(snoozeDiff)) {
        activeAlarmStart(alarm);
        alarm.state = AlarmState.ringing;
        hasChanged = true;
        return;
      }

      // alarm has snooze, snooze is enabled, but time is not now
      return;
    }

    // ------------------------------
    // alarm is active and matches time - ring ring
    if (alarm.state === AlarmState.active && isDiffTolerance(timeDiff)) {
      activeAlarmStart(alarm);
      alarm.state = AlarmState.ringing;
      hasChanged = true;
      return;
    }

    // active alarm that shouldn't ring now
    return;
  });

  // optimization - there was a change, update popup and cache
  if (hasChanged) {
    storageSet({ alarms: watchedAlarms });
    sendAction({ type: appActions.updateAlarms, payload: { alarms: watchedAlarms } });
  }

  updateBadge();
}

// triggers alarm tone, sets activeAlarm, sends notification to user
function activeAlarmStart(alarm: Alarm) {
  activeAlarm = {
    id: alarm.id,
    tone: toneList[storageCache.options.tone],
  };
  activeAlarm.tone.currentTime = 0;
  activeAlarm.tone.loop = true;
  activeAlarm.tone.play();

  sendNotification(alarm);
}

// stops the alarm by pausing tone and removing active alarm
function activeAlarmStop(alarm?: Alarm) {
  const stopAlarm = () => {
    activeAlarm?.tone.pause();
    activeAlarm = undefined;
  };

  if (!alarm) {
    // if no alarm to match is provided, always kill the active alarm
    stopAlarm();
  } else if (alarm?.id === alarm.id) {
    // conditionally stop the alarm
    stopAlarm();
  }
}

// takes alarm and changes end state
// this is ONLY for after alarm has completed
function updateAlarm(alarm: Alarm): Alarm {
  if (alarm.repetitive) {
    alarm.state = AlarmState.active;
    (alarm as any).date = getNextDate(alarm).toISOString();
  } else {
    alarm.state = AlarmState.disabled;
  }

  chrome.notifications.clear(alarm.id);
  alarm.dateSnooze = undefined;
  return alarm;
}

// sends notification to user via chrome
function sendNotification(alarm: Alarm) {
  chrome.notifications.create(
    alarm.id,
    {
      iconUrl: chrome.runtime.getURL('icons/icon512.png'),
      title: alarm.name,
      type: 'basic',
      message: alarm.name,
      buttons: !!storageCache.options.snooze
        ? [{ title: 'Cancel' }, { title: 'Snooze' }]
        : [{ title: 'Cancel' }],
      requireInteraction: true,
    }
    // (alarmId: string) => {}
  );
}

// ---------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------
// helper function to wrap chrome runtime
function sendAction(action: TAction<any>) {
  chrome.runtime.sendMessage(action);
}

// wrapper function, on V3 manifest storage has promises
async function storageGet<T>(getObject: T): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(getObject, (items: { [key: string]: any }) => {
      resolve(items);
    });
  });
}

// wrapper function, on V3 manifest storage has promises
async function storageSet<T>(setObject: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(setObject, () => {
      resolve();
    });
  });
}

// evaluate the difference (between now and alarm ring time)
// 10000 is tolerance in case some seconds slip somewhere
function isDiffTolerance(diff: number): boolean {
  // if diff is positive, that means that alarm time is in the past
  // in this case, we check if alarm time is in the past or 10s in the future
  return diff > -10000;
}

// ----------------------------------------
// calculates the next date of execution for repetitive alarm
const getNextDate = (alarm: Alarm): Date => {
  // failsafe
  if (alarm.repetitionDays.length === 0) {
    return new Date(alarm.date);
  }

  let nextDate: Date | undefined = undefined;

  // Sat Dec 11 2021 11:00:00 GMT+0100 (Central European Standard Time)
  // alarm time to compare it with and take hour/minute
  const alarmDate = new Date(alarm.date);

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
    // day in the week to compare with repetitionDays of the week
    const currentDay = potentialDate.getDay();

    // current day is one of the repetition days
    if (alarm.repetitionDays.includes(currentDay)) {
      // check if alarm is valid (meaning its in the future from now)
      if (potentialDate > now) {
        nextDate = potentialDate;
      }
    }

    if (!nextDate) {
      // add one day and repeat
      potentialDate.setDate(potentialDate.getDate() + 1);
    }
  } while (!nextDate);

  return nextDate;
};

// ----------------------------------------
// updates the app badge in browser
function updateBadge() {
  const activeAlarms = storageCache.alarms.filter(a => a.state !== AlarmState.disabled).length;
  chrome.browserAction.setBadgeText({
    text: activeAlarms ? `${activeAlarms}` : '',
  });
}
