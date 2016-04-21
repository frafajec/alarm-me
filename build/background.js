/*
 * GLOBALS
*/
var toneList = [
    new Audio("tones/light.mp3"),
    new Audio("tones/notification.mp3"),
    new Audio("tones/one_alarm.mp3")
];
var alarmTone;
//currently processed notification, HAX in order to persist notifications
var notif_actions = {};
var notif_timeouts = {};


/*
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
        date_format: 0
    };
    chrome.storage.sync.set({ 'AM_options': options });

    return options;
}


/*
 * LOAD options
 *
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
 * When options changed in options menu, reload it here
 * Listener that waits for specific set of instructions
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.action == "change" && request.type == "reload-options") {
        loadOptions();
    }

});


/*
 * Updates chrome badge icon
 * triggered on any storage change
 *
 * @param {json} changes - contains object with previous and current state of changed object
 * @param {string} area - type of storage changed
 * @returns {null}
 */
function updateBadge(changes, area) {

    if (area === "sync" && changes.AM_alarms) {
        var nbr = changes.AM_alarms.newValue.length,
            text = nbr > 0 ? nbr.toString() : "";

        chrome.browserAction.setBadgeBackgroundColor({color: "#000"});
        chrome.browserAction.setBadgeText({text: text });
    }

}
chrome.storage.onChanged.addListener(updateBadge);


/*
 * PLAY selected tune from options
 *
 * @param {boolean} play - parameter for notification sound
 * @return {null}
 */
function alarm_sound (play) {

    if (play) {
        alarmTone.play();
    }
    else {
        alarmTone.pause();
    }
}


/*
 * SNOOZE alarm
 * postpones alarm for given period of time
 * UI handles everything
 * @param {string} key - key of alarm to be snoozed
 * @returns {null}
 */
function snooze (key) {

    //@param {object} object - object containing list of all alarms
    var storage_callback = function (object) {
        var alarms = object.AM_alarms;

        for (var i = 0; i < alarms.length; i++) {
            if (key == alarms[i].key) {
                var alarm = alarms[i];
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
        chrome.extension.sendMessage({action: 'snooze', key: key, alarm: alarm});


    }.bind(key);
    chrome.storage.sync.get('AM_alarms', storage_callback);








}


/*
 * REMOVES alarm from storage
 * calls UI to remove from popup
 *
 * this is called only when alarm is already activated -> alarm itself called for this
 *
 * @param {string} key - alarm key
 * @returns {null}
 */
function remove_alarm (key) {

    //calls popup where listener is set to receive action
    //only to remove UI >>IF<< popup is raised during call
    //@param {object} - data to be transferred
    chrome.extension.sendMessage({action: 'remove', key: key});


    var storage_callback = function (object) {
        var alarms = object.AM_alarms;

        for (var i = 0; i < alarms.length; i++) {
            if (key == alarms[i].key) {
                alarms.splice(i, 1);
                break;
            }
        }

        //@param {object} - data to be stored
        chrome.storage.sync.set({'AM_alarms': alarms});

    }.bind(key); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
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
            if (key == alarms[i].key) {
                alarm = alarms[i];
                break;
            }
        }

        //@param {string} key - always used that alarm key is the same as notification key
        //@param {object} notification properties
        //@param {function} callback
        chrome.notifications.create(alarm.key, {
            iconUrl: chrome.runtime.getURL('img/icon/icon512.png'),
            title: alarm.name,
            type: 'basic',
            message: alarm.desc,
            buttons: [
                { title: 'Snooze (' + (options.snooze).toString() + ' minutes)', iconUrl: "img/snooze.png" },
                { title: 'Cancel (delete alarm)', iconUrl: "img/remove_alarm.png" }
            ],
            isClickable: false,
            priority: 0
        }, function() {});

    }.bind(key); //key pushed into scope

    alarm_sound(true);

    //get list of alarms to raise notification
    chrome.storage.sync.get('AM_alarms', storage_callback);

}



/*
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
    //put alarm into currently active ones and set its creation time
    notif_timeouts[alarm_event.name] = new Date().getTime();

});


/*
 * Event when action buttons are clicked on notification
 * Respond to the user's clicking one of the buttons (no self-triggering)
 *
 * Button 0: snooze alarm
 * Button 1: ok, remove alarm
 * Both actions remove notification
 *
 * @param {string} key - notification key (same as alarm key)
 * @param {int} btnIdx - button index to determine which button was clicked
 * @returns {null}
*/
chrome.notifications.onButtonClicked.addListener(function(key, btnIdx) {

    if (btnIdx === 0) {
        //@param {string} key - notification key for alarm to change
        snooze(key);
        //@param {string} key - notification key for notification to be terminated
        chrome.notifications.clear(key);
    } else if (btnIdx === 1) {
        //@param {string} key - notification key for alarm to be removed
        remove_alarm(key);
        //@param {string} key - notification key for notification to be terminated
        chrome.notifications.clear(key);
    }

    notif_actions[key] = true;

});


/*
 * Closing of notification by non-default action
 * Notification length is 8 seconds!
 *
 * the small 'x' on the top right corner - x_close
 * buttons action on notification - special closure
 * timeout period of notification - auto closure
 *
 * @param {string} key - notification key
 * @param {boolean} x_close - control weather user closed or timeout
 * @returns {null}
*/
chrome.notifications.onClosed.addListener(function(key, x_close) {

    //user closed notification
    //if key in notification actions, remove it and consider handled
    if (notif_actions[key] || x_close) {
        alarm_sound(false);
        remove_alarm(key);
        chrome.notifications.clear(key);
        delete notif_actions[key];
        delete notif_timeouts[key];
    }
    //auto closure, re-raise notification
    //if length of notification is exceeded by one in settings stop alarm
    else {
        var notif_alive = new Date().getTime() - notif_timeouts[key];

        if (options.stop_after > 0 && (options.stop_after * 60000) > notif_alive ) {
            raise_notification(key);
        } else {
            alarm_sound(false);
            snooze(key);
            chrome.notifications.clear(key);
            delete notif_actions[key];
            delete notif_timeouts[key];
        }

    }

});







