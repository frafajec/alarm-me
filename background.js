/*
 * SONG that is played when notification is raised as "alarm" to user
 * TODO: implement options where user can choose multiple alarm songs
 */
var notif_audio = new Audio("alarm.mp3");

/*
 * GLOBAL variable used to store currently processed notification
 * HAX in order to persist notifications
 * TODO: check listeners for notification - improve
 */
var notif_actions = {};


/*
 * SNOOZE alarm
 * postpones alarm for given period of time
 * UI handles everything
 * @param {string} key - key of alarm to be snoozed
 * @returns {null}
 *
 * TODO: add to options duration of snooze to be set by user
 */
function snooze (key) {

    //popup handles UI and saving
    chrome.extension.sendMessage({action: 'snooze', key: key});

}


/*
 * REMOVES alarm from storage
 * calls UI to remove from popup and in callback removes it from storage
 *
 * this is called only when alarm is already activated -> alarm itself called for this
 * UI alarm removal handles deletion of alarm
 *
 * @param {string} key - alarm key
 * @returns {null}
 */
function remove_alarm (key) {

    //calls popup where listener is set to receive action
    //@param {object} - data to be transferred
    //@param {function} callback - receive response from other side
    chrome.extension.sendMessage({action: 'remove', key: key}, function(response) {
        var key = response.key;

        //@param {object} object - object containing list of all alarms
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

    });

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
                { title: 'Snooze (10 minutes)', iconUrl: "img/snooze.png" },
                { title: 'Cancel (delete alarm)', iconUrl: "img/remove_alarm.png" }
            ],
            isClickable: false,
            priority: 0
        }, function() {});

    }.bind(key); //key pushed into scope

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
 * the small 'x' on the top right corner - user action
 * buttons action on notification - special closure
 * timeout period of notification - auto closure
 *
 * @param {string} key - notification key
 * @param {boolean} user_action - control weather user closed or timeout
 * @returns {null}
 * TODO: find better solution for re-raising notification....
*/
chrome.notifications.onClosed.addListener(function(key, user_action) {

    //user closed notification
    if (user_action) {
        remove_alarm(key);
        chrome.notifications.clear(key);
    }
    //if key in notification actions, remove it and consider handled
    else if (notif_actions[key]) {
        delete notif_actions[key];
    }
    //auto closure, re-raise notification
    else {
        raise_notification(key);
    }

});







