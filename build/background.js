var toneList = [
    new Audio("tones/light.mp3"),
    new Audio("tones/notification.mp3"),
    new Audio("tones/one_alarm.mp3"),
    new Audio("tones/analog.mp3")
];
var alarmTone;
var alarm_timeouts = {}; //when alarm occurs registers its timeout and if triggered snoozes/disables alarm
var options;
var badgeCount = null;


/*
 * @Module - Init
 * SET options
 * data is used from options.js where true default option function is implemented
 * @WARNING - there is event onInstalled but requires more permission fom App, therefore this approach is used
 * @returns {json} options - default options used in application
 */
function setDefaults () {

    chrome.storage.sync.set({'AM_alarms': []});

    //@param {object} - data to be stored
    var options = {
        type: 'default',
        snooze: 10,
        stop_after: 10,
        tone: 0,
        volume: 100,
        date_format: 0,
        time_format: 0
    };
    chrome.storage.sync.set({ 'AM_options': options });

    return options;
}


/*
 * @Module - Init
 * LOAD options
 * date-time pickers can cause problems when not loaded after options
 * however, there is a chance that options will be loaded before DOM, then simply move load options into DOMContentLoaded
 *
 * @returns {null}
 */
function loadOptions () {
    chrome.storage.sync.get('AM_options', function (object) {

        options = object.AM_options || setDefaults();

        //override index value with real value
        options.tone = toneList[options.tone];

        alarmTone = options.tone;
        alarmTone.loop = true;
        alarmTone.volume = options.volume / 100;

    });
}
loadOptions();


/*
 * @Module - Logic
 * PLAY selected tune from options
 * @param {boolean} play - parameter for notification sound
 * @return {null}
 */
function alarm_sound (play) {

    if (play) { alarmTone.play(); }
    else { alarmTone.pause(); }
}


/*
 * @Module - Logic
 * Updates chrome badge icon after countdown calculation
 * triggered every 1 second
 *
 * @param {int} closest - milliseconds to alarm
 * @returns {null}
 */
function countDown (countdown) {
    var closest = countdown || this;

    // Check if lesser than 99 minutes
    var now = (new Date()).getTime();
    var closest_min = (closest - now) / (60000); // conversion from milisec to min
    var text = "";

    if (closest_min > 99) {
        text = "99+";
    } else if (closest_min <= 0) {
        text = "bzz";
    } else if (closest_min <= 1) {
        text = "<1";
    } else {
        text = "~" + String( Math.round(closest_min) );
    }

    chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
    chrome.browserAction.setBadgeText({text: text });
}


/*
 * @Module - Logic
 * Updates chrome badge icon
 * triggered on any storage change
 *
 * @param {json} changes - contains object with previous and current state of changed object
 * @param {string} area - type of storage changed
 * @returns {null}
 */
function updateBadge(changes, area) {

    if (area === "sync" && changes.AM_alarms) {
        var nbr = changes.AM_alarms.newValue.filter(function (e) { return e.active; }),
            text = nbr.length > 0 ? nbr.length.toString() : "";

        if (badgeCount) { clearInterval(badgeCount); }

        // If in settings enabled to count down
        if (options.countdown && nbr.length > 0) {
            var closest = changes.AM_alarms.newValue.length ? changes.AM_alarms.newValue[0].time_set : 0;
            for (var i = 1; i < changes.AM_alarms.newValue.length; i++) {
                if (changes.AM_alarms.newValue[i].active && changes.AM_alarms.newValue[i].time_set < closest) {
                    closest = changes.AM_alarms.newValue[i].time_set;
                }
            }

            // if (badgeCount) { clearInterval(badgeCount); }
            badgeCount = setInterval(countDown.bind(closest), 1000); // 1 sec
            countDown(closest);
        } else {
            chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
            chrome.browserAction.setBadgeText({text: text });
        }
    }

    if (area === "sync" && changes.AM_options) {

        for (var o in changes.AM_options.newValue) {
            options[o] = changes.AM_options.newValue[o];
        }

        if (changes.AM_options.oldValue.countdown !== changes.AM_options.newValue.countdown) {
            var storage_callback = function (object) {
                var alarms = object.AM_alarms,
                    i = null,
                    nbr = alarms.filter(function (e) { return e.active; }),
                    text = nbr.length > 0 ? nbr.length.toString() : "";

                // this mimics code from updateBadge
                if (this.countdown) {
                    if (nbr.length > 0) {
                        var closest = alarms.length ? alarms[0].time_set : 0;
                        for (i = 1; i < alarms.length; i++) {
                            if (alarms[i].active && alarms[i].time_set < closest) {
                                closest = alarms[i].time_set;
                            }
                        }

                        // if (badgeCount) { clearInterval(badgeCount); }
                        badgeCount = setInterval(countDown.bind(closest), 1000); // 1 sec
                        countDown(closest);
                    } else {
                        chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
                        chrome.browserAction.setBadgeText({text: text });
                    }
                } else {
                    if (badgeCount) { clearInterval(badgeCount); }
                    chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
                    chrome.browserAction.setBadgeText({text: text });
                }

            }.bind({countdown: changes.AM_options.newValue.countdown}); //pushing variable alarm into scope!
            chrome.storage.sync.get('AM_alarms', storage_callback);

        }

    }

}
chrome.storage.onChanged.addListener(updateBadge);


/*
 * @Module - Logic
 * Calculates repeat alarm time
 * sets alarm to be repeated on next step
 * @param {string} key - key of alarm to be snoozed
 * @returns {null}
 */
function calc_repetitive (alarm) {
    var alarm_time = (new Date(alarm.time_rep)),
        alarm_next,
        i = alarm_time.getDay(),
        next = -1,
        diff = 0;

    do {
        diff++;
        if (alarm.rep_days[i]) {  next = i; } //search for next day through array
        else if (i++ === 6) { i = 0; } //if end of array, return search from monday
    } while (next === -1);

    alarm_next = (new Date(alarm_time.getTime() + (60000 * 60 * 24 * diff) ) ).getTime();
    alarm.time_span = alarm_next - alarm.time_set;
    alarm.time_set = alarm_next;
    alarm.time_rep = alarm_next;

    return alarm;
}


/*
 * @Module - Logic
 * Sets given alarm key to be inactive, removes his alarm handler and saves state
 *
 * @param {string} key - alarm key
 */
function set_inactive (key) {

    //stop alarm from triggering
    chrome.alarms.clear(key);

    var storage_callback = function (object) {
        var alarms = object.AM_alarms;

        //remove from storage
        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarms[i].active = false;
                break;
            }
        }

        //@param {object} - data object to be saved as JSON
        chrome.storage.sync.set({'AM_alarms': alarms});

    }.bind(key); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * @Module - Logic
 * Returns alarm back into active state if possible
 * Repetitive - always possible, normal - only when time has not "passed"
 */
function set_active (alarm, sender, sendResponse) {

    //restore alarm if possible
    //repetitive can always be restored, normal once only when not jet expired
    var now = (new Date()).getTime();
    if (alarm.repetitive) {

        alarm = calc_repetitive(alarm);
        alarm.active = true;
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        sendResponse({ alarm_active: true, alarm: alarm });

    } else if (alarm.time_set > now) {

        alarm.time_created = now;
        alarm.time_span = alarm.time_set - alarm.time_created;
        alarm.active = true;
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        sendResponse({ alarm_active: true, alarm: alarm });

    } else {

        sendResponse({ alarm_active: false, alarm: alarm });

    }

}


/*
 * @Module - Logic
 * SNOOZE alarm
 * postpones alarm for given period of time
 * @param {string} key - key of alarm to be snoozed
 * @returns {null}
 */
function snooze (key) {

    alarm_sound(false);

    //@param {object} object - object containing list of all alarms
    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            alarm;

        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarm = alarms[i];
                alarm.ringing = false;
                alarms.splice(i, 1);
                break;
            }
        }

        //set snoozed time, time when snooze occurred
        var snooze_time = parseInt(options.snooze);
        alarm.time_created = new Date().getTime();
        alarm.time_set = new Date().getTime() + (snooze_time * 60 * 1000);
        alarm.time_span = alarm.time_set - alarm.time_created;

        //create alarm -> 1 minute = 60,000 milliseconds
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        //add to alarm list
        alarms.push(alarm);

        //@param {object} - data to be stored
        chrome.storage.sync.set({'AM_alarms': alarms});

        //popup handles UI and saving
        chrome.extension.sendMessage({remove: true, update: true, key: key, alarm: alarm});


    }.bind(key);
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/* @Module - Logic
 * CANCELS alarm (onetime or repetitive)
 * Determines type of alarm and handles/removes it
 * @param {string} key - key of alarm to be snoozed
 * @returns {null}
 */
function cancel_alarm (key) {

    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            alarm;

        //find alarm that is to be canceled
        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarm = alarms.splice(i, 1)[0];
                alarm.ringing = false;
                break;
            }
        }


        //REPETITIVE section
        if (alarm.repetitive === true) {

            //calculates time when alarm will be called again and updates object
            //@param {object} alarm - whole alarm object that is set to be updated
            alarm = calc_repetitive(alarm);
            //create alarm -> 1 minute = 60,000 milliseconds
            chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });
            //add to alarm list
            alarms.push(alarm);
            //calls popup where listener is set to receive action (if UI open)
            chrome.extension.sendMessage({remove: true, update: true, key: key, alarm: alarm});

        //NORMAL section
        } else {

            if (options.inactive) {
                alarm.active = false;
                alarms.push(alarm);
                chrome.extension.sendMessage({remove: true, update: true, key: key, alarm: alarm});
            } else {
                //calls popup where listener is set to receive action (if UI open)
                chrome.extension.sendMessage({remove: true, key: key});
            }

        }


        //@param {object} - data to be stored
        chrome.storage.sync.set({'AM_alarms': alarms});

    }.bind(key); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * @Module - Logic
 * Removes notification and snoozes alarm when user inactive
 * @param {string} key - binded when called
 */
function alarm_timeout () {
    var key = this.key;

    chrome.notifications.clear(key);
    if (parseFloat(options.snooze) > 0) {
        snooze(key);
    }
    delete alarm_timeouts[key];
}


/*
 * @Module - Logic
 * When alarm is created he is updated so that UI will be able to shut down ringing
 * FIX when notification is not "shown" for some unknown reason...
 */
function register_ringing (key) {

    var storage_callback = function (object) {
        var alarms = object.AM_alarms;

        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarms[i].ringing = true;
                chrome.extension.sendMessage({remove: true, update: true, key: key, alarm: alarms[i]});
                chrome.storage.sync.set({'AM_alarms': alarms});
                break;
            }
        }
    }.bind(key); //key pushed into scope

    //get list of alarms to raise notification
    chrome.storage.sync.get('AM_alarms', storage_callback);

    //create timeout for notification
    if (parseFloat(options.stop_after) > 0) {
        alarm_timeouts[key] = setTimeout(alarm_timeout.bind({ key: key }), options.stop_after * 60000);
    }

}


/*
 * @Module - Logic
 * called when notification UI need to be raised
 * always matched with alarm, eg. alarm is raised, notification is called!
 * alarm key and notification key are ALWAYS the same
 *
 * chrome.storage pulls all alarms and for given key alarm data is taken and placed into notification
 *
 * @param {string} key - alarm/notification key
 * @return {null}
 */
function raise_notification (key) {

    //@param {object} object - object containing list of all alarms
    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            alarm = {};

        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarm = alarms[i];
                break;
            }
        }

        //fallback in scenario where alarm is not found
        if (alarm && alarm.key) {

            //if snooze is set to 0, there will be no snooze option!
            var btn_snooze = { title: chrome.i18n.getMessage("snooze") + ' (' + (options.snooze).toString() + ' ' + chrome.i18n.getMessage("minute") + ')', iconUrl: "img/snooze.png" };
            var btn_cancel = { title: chrome.i18n.getMessage("cancel_delete"), iconUrl: "img/remove_alarm.png" };

            //@param {string} key - always used that alarm key is the same as notification key
            //@param {object} notification properties
            //@param {function} callback
            chrome.notifications.create(alarm.key, {
                iconUrl: chrome.runtime.getURL('img/icon/icon512.png'),
                title: alarm.name,
                type: 'basic',
                message: alarm.desc,
                buttons: parseInt(options.snooze) ? [ btn_snooze, btn_cancel ] : [ btn_cancel ],
                isClickable: false,
                priority: 2,
                requireInteraction: true
            }, function() {

                alarm_sound(true);

            });

        } else {

            alarm_sound(false);

        }

    }.bind(key); //key pushed into scope

    //get list of alarms to raise notification
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * @Module - Logic
 * 1. When options changed in options menu, reload it here
 * 2. When alarm canceled from popup, proceed to termination
 * 3. and 4. When alarm is set to be (in)active
 * Listener that waits for specific set of instructions
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.reload_options) {
        loadOptions();
    }

    if (request.cancel_ringing) {
        chrome.notifications.clear(request.key);
        cancel_alarm(request.key);
    }

    if (request.set_inactive) {
        chrome.notifications.clear(request.key);
        set_inactive(request.key);
    }

    if (request.set_active) {
        set_active(request.alarm, sender, sendResponse);
    }

});


/*
 * @Module - Logic
 * Alarm is triggered
 * Default for all alarms - every alarm comes here
 *
 * Calls raise_notification to centralise code
 *
 * @param {object} alarm_event - event property containing key (name) of alarm
 * @return {null}
*/
chrome.alarms.onAlarm.addListener(function( alarm_event ) {
    

    //@param {string} key - alarm_event.name is key of alarm
    raise_notification(alarm_event.name);
    //@param {string} key
    register_ringing(alarm_event.name);
    //put alarm into currently active ones and set its creation time
    // notif_timeouts[alarm_event.name] = new Date().getTime();


});


/*
 * @Module - Logic
 * Event when action buttons are clicked on notification
 * Respond to the user's clicking one of the buttons (no self-triggering)
 *
 * Button 0: snooze alarm
 * Button 1: ok, cancel alarm (actions deferred to next function)
 * Both actions remove notification
 *
 * @param {string} key - notification key (same as alarm key)
 * @param {int} btnIdx - button index to determine which button was clicked
 * @returns {null}
*/
chrome.notifications.onButtonClicked.addListener(function(key, btnIdx) {

    if (btnIdx === 0 && parseInt(options.snooze) > 0) {
        //@param {string} key - notification key for alarm to change
        snooze(key);
        //@param {string} key - notification key for notification to be terminated
        chrome.notifications.clear(key);
    } else if (btnIdx === 1 || parseInt(options.snooze) === 0) {
        //@param {string} key - notification key for alarm to turn off and delete or repeat
        cancel_alarm(key);
        //@param {string} key - notification key for notification to be terminated
        chrome.notifications.clear(key);
    }

});


/*
 * @Module - Logic
 *
 * the small 'x' on the top right corner - x_close
 * buttons action on notification - special closure (handled on 'onButtonClicked'
 * timeout period of notification - auto closure
 *
 * @param {string} key - notification key
 * @param {boolean} x_close - control weather user closed
 * @returns {null}
*/
chrome.notifications.onClosed.addListener(function(key, x_close) {

    alarm_sound(false);
    clearTimeout(alarm_timeouts[key]);

    if (x_close) {
        cancel_alarm(key);
    }

});