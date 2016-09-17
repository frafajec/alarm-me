/*
 * GLOBALS
 */
//embedded and libraries
var chrome = chrome || undefined;
var flatpickr = flatpickr || undefined;
var template = template || undefined;

var options = {};
//lists for drop-down selection
var dateFormatList = [ "DD.MM.YYYY", "DD.MM.YY", "DD/MM/YYYY", "MM.DD.YYYY" ];
//time-picker variables
var timePicker;
var datePicker;


/*
 * @Module - Init
 * Renders date format for datePicker
 */
function pickrDateFormat () {
    var format = options.date_format,
        final = [];

    var split = format.split(".");

    final[0] = split[0][0].toLowerCase();
    final[1] = split[1][0].toLowerCase();
    final[2] = split[2].length > 2 ? "Y" : "y";

    return format.split(".").length > 1 ? final.join(".") : final.join("/");
}


/*
 * @Module - Init
 * Initializes pickers for time and date
 * called after options are loaded because it needs it for date format
 */
function initTimePickers () {

    flatpickr.init.prototype.l10n.firstDayOfWeek = 1;

    timePicker = flatpickr("#new-time-input", {
        minDate: new Date(new Date().getTime() + 60000),
        defaultDate: new Date(new Date().getTime() + 60000),

        timeFormat: "H:i",
        minuteIncrement: 1
    });
    timePicker.set("onChange", function(d){
        var now = new Date();
        if (d.getTime() < now.getTime()) {
            document.getElementById('new-time-input').value = (" " + now.getHours() + ":" + now.getMinutes()).toString();
        }
    });

    datePicker = flatpickr("#new-date-input", {
        minDate: new Date(),
        defaultDate: new Date(),
        dateFormat: pickrDateFormat()
    });

}


/*
 * @Module - Init
 * Localises HTML based on messages.json
 * TAKEN: http://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension
 */
function localizeHtmlPage() {
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(
            /__MSG_(\w+)__/g,
            function(match, v1) {
                return v1 ? chrome.i18n.getMessage(v1) : "";
            }
        );

        if(valNewH !== valStrH) { obj.innerHTML = valNewH; }
    }
}


/*
 * @Module - Init
 * LOAD options
 * date-time pickers can cause problems when not loaded after options
 * however, there is a chance that options will be loaded before DOM, then simply move load options into DOMContentLoaded
 */
function loadOptions () {
    chrome.storage.sync.get('AM_options', function (object) {

        options = object.AM_options;

        //override index value with real value
        options.date_format = dateFormatList[options.date_format];

        initTimePickers();

    });
}
loadOptions();


/*
 * TODO: change how remove is done because it can close newer notify too soon
 * @Module - UI
 * Creates notify element and inserts it into element for display
 * WARNING: can only be called on container, not individual element!
 *
 * @param {html} element - html object of element where tooltip will be inserted
 * @param {string} title - text that will be displayed in title (short)
 * @param {string} content - text that will be inserted into body of tooltip
 * @param {string} type - additional class that differentiates notifications
 */
function initNotify () {

    Element.prototype.notify = function(title, content, type) {
        var el = this;

        var ntf = document.createElement("span");
        ntf.setAttribute("class", "notify");
        if (type) {
            ntf.setAttribute("class", "notify " + type);
        }
        var ntf_title = document.createElement("h6");
        ntf_title.innerHTML = title.toUpperCase();
        ntf.appendChild( ntf_title );
        var ntf_body = document.createElement("p");
        ntf_body.innerHTML = content;
        ntf.appendChild( ntf_body );

        var ntfSelfRemove = function () {
            var ttps = el.getElementsByClassName("notify");
            for (var i = 0; i < ttps.length; i++) {
                ttps[i].remove();
            }
        }.bind(el);

        ntf.addEventListener("click", ntfSelfRemove);
        this.insertBefore(ntf, this.firstChild);
        setTimeout(ntfSelfRemove, 5000);

    };

}
initNotify();


/*
 * @Module - UI
 * Removes all notify from popup
 * Takes care of situation when new alarm is closed etc
 *
 * @returns {null}
 */
function removeNotify() {
    var notifs = document.getElementsByClassName("notify");
    for (var i = 0; i < notifs.length; i++) {
        notifs[i].remove();
    }
}


/*
 * @Module - UI
 * Prepares date-time object to be displayed in DOM
 * @param {int} ex - existing datetime unix number format (time from 1970)
 * @return {object} date/time - processed string ready for DOM
 */
function displayTime (ex) {

    var t = ex ? new Date(ex) : new Date();

    var addZero = function (n) {
            var x = n.toString();
            if (x.length < 2) { return '0' + x; }
            else { return x; }
        };

    var time = addZero( t.getHours() ) + ":" + addZero( t.getMinutes() );

    var date;
    switch(options.date_format) {
        case "DD.MM.YY":
            date = addZero( t.getDate() ) + "." + addZero( t.getMonth() + 1 ) + "." + addZero( t.getFullYear().toString().substring(2) );
            break;
        case "DD/MM/YYYY":
            date = addZero( t.getDate() ) + "/" + addZero( t.getMonth() + 1 ) + "/" + addZero( t.getFullYear() );
            break;
        case "MM.DD.YYYY":
            date = addZero( t.getMonth() + 1 ) + "." + addZero( t.getDate() ) + "." + addZero( t.getFullYear() );
            break;
        default:
            //case "DD.MM.YYYY":
            date = addZero( t.getDate() ) + "." + addZero( t.getMonth() + 1 ) + "." + addZero( t.getFullYear() );
    }

    return {
        time: time,
        date: date
    };
}


/*
 * @Module - Helper
 * Reverts date format from user-display to universal
 * @param {string} date - date in current display format
 * @param {string} time - time in hh:mm format (default 00:00:00)
 */
function revertTime (date, time) {
    time = time || "00:00:00";
    var revert, s;

    switch(options.date_format) {
        case "DD.MM.YY":
            s = date.split(".");
            revert = new Date ( "20" + s[2] + "/" + s[1] + "/" + s[0] + " " + time );
            break;
        case "DD/MM/YYYY":
            s = date.split("/");
            revert = new Date ( s[2] + "/" + s[1] + "/" + s[0] + " " + time );
            break;
        case "MM.DD.YYYY":
            s = date.split(".");
            revert = new Date ( s[2] + "/" + s[0] + "/" + s[1] + " " + time );
            break;
        default:
            //case "DD.MM.YYYY":
            s = date.split(".");
            revert = new Date ( s[2] + "/" + s[1] + "/" + s[0] + " " + time );
    }

    return revert;
}


/*
 * @Module - UI
 * Sets clock roller on popup
 * Every second checks time and changes it if needed
 * @return {null}
 */
function popupClock () {

    function rollClock (){

        var t = displayTime();

        document.getElementById('time').innerHTML = t.time;
        document.getElementById('date').innerHTML = t.date;

    }
    rollClock();
    window.setInterval(rollClock, 1000);
}


/*
 * @Module - UI
 * open OPTIONS tab
*/
function initLinks () {

    document.getElementById('link-options').addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage(); // New way to open options pages, if supported (Chrome 42+).
        } else {
            window.open(chrome.runtime.getURL('options/options.html')); // Reasonable fallback.
        }

    });

    document.getElementById('link-instructions').addEventListener('click', function () {
        chrome.tabs.create({ 'url': 'chrome-extension://' + chrome.runtime.id + '/options/options.html#instructions' });
    });
}


/*
 * @Module - Init
 * Initializes helper functions and widgets
 */
function initHelpers () {
    //runs clock in background of popup
    popupClock();
    //event for opening options from popup
    initLinks();
}


/*
 * @Module - UI
 * Changes visibility of new alarm section
 */
function toggleNewAlarm () {

    var hidden = document.getElementById("alarm-new-container").className.length;

    if (!hidden) {
        document.getElementById("alarm-new-container").className = "hidden";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("newAlarm");

        document.getElementById("toggle-repetitive-alarm").style.display = "none";
        document.getElementById("toggle-onetime-alarm").style.display = "none";
    } else {
        document.getElementById("alarm-new-container").className = "";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("cancelAlarm");

        document.getElementById("toggle-repetitive-alarm").style.display = "block";
        document.getElementById("toggle-onetime-alarm").style.display = "block";
    }

    removeNotify();
}


/*
 * @Module - UI
 * Swaps between one-time alarm and repetitive type alarm
 */
function toggleAlarmType (e) {
    var oneBtn = document.getElementById("toggle-onetime-alarm"),
        oneSec = document.getElementById("new-desc"),
        repBtn = document.getElementById("toggle-repetitive-alarm"),
        repSec = document.getElementById("new-rep");

    if (e.target === repBtn && repBtn.className !== "alarm-type-active") {
        oneBtn.className = "";
        oneSec.className = "hidden";
        repBtn.className = "alarm-type-active";
        repSec.className = "";
    } else if (e.target === oneBtn && oneBtn.className !== "alarm-type-active") {
        oneBtn.className = "alarm-type-active";
        oneSec.className = "";
        repBtn.className = "";
        repSec.className = "hidden";
    }
}


/*
 * @Module - UI
 * Date checker on repetitive alarm
 * Handles "select all" option
 */
function dateCheck () {
    var all = document.getElementById("new-rep-all"),
        dates = document.getElementsByClassName("new-rep-date"),
        checked = 0;

    for (var i = 0; i < dates.length; i++) {
        if ( dates[i].checked ) {
            checked++;
        }
    }

    all.checked = dates.length === checked;
}


/*
 * @Module - UI
 * All-checker on repetitive alarm
 * Selects/deselects all dates for alarm
 */
function allCheck () {
    var all = document.getElementById("new-rep-all"),
        dates = document.getElementsByClassName("new-rep-date"),
        i = 0;

    if (all.checked) {
        for (i; i < dates.length; i++) {
            dates[i].checked = true;
        }
    } else {
        for (i = 0; i < dates.length; i++) {
            dates[i].checked = false;
        }
    }
}


/*
 * @Module - Logic
 * CONSTRAINTS when creating new alarm
 */
function checkConstraints () {
    var fail = false;

    // CONSTRAINT 1 - alarm in past
    var input_date = document.getElementById("new-date-input").value,
        input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
        input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value;

    var alarm_time = revertTime(input_date, input_h + ":" + input_min + ":00"),
        now = new Date();

    if (alarm_time.getTime() <= now.getTime()) {
        document.getElementById("new-time").notify("warning", chrome.i18n.getMessage("ntfHistoryAlarm"), "warning" );

        //error class
        var clsTime = document.getElementById("new-time").getElementsByClassName("flatpickr-calendar")[0];
        var clsDate = document.getElementById("new-date-input");
        clsTime.setAttribute("class", clsTime.getAttribute("class") + " error");
        clsDate.setAttribute("class", clsDate.getAttribute("class") + " error");
        setTimeout(function () {
            var clsTime = document.getElementById("new-time").getElementsByClassName("flatpickr-calendar")[0];
            var clsDate = document.getElementById("new-date-input");
            clsTime.setAttribute("class", clsTime.getAttribute("class").replace(" error", "") );
            clsDate.setAttribute("class", clsDate.getAttribute("class").replace(" error", "") );
        }, 2000);

        fail = true;
    }

    return fail;
}


/*
 * TODO: if UI changed, change THIS!!
 * @Module - Logic
 * EVENT for removing alarm
 * activated when button is pressed on alarm list
 * removes from storage, cancels alarm and removes from UI
 *
 * @param {event} e
 * @returns {null}
 */
function removeAlarm() {
    var alarm_el = this.parentElement.parentElement;

    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            key = alarm_el.getAttribute('key');

        //stop alarm from triggering
        chrome.alarms.clear(key);

        //remove from storage
        for (var i = 0; i < alarms.length; i++) {
            if (key === alarms[i].key) {
                alarms.splice(i, 1);
            }
        }
        //@param {object} - data object to be saved as JSON
        chrome.storage.sync.set({'AM_alarms': alarms});


        //remove from UI
        var alarm_list = document.getElementsByClassName('alarm');
        for (i = 0; i < alarm_list.length; i++) {
            if (key === alarm_list[i].getAttribute('key')) {
                alarm_list[i].remove();
            }
        }

    }.bind(alarm_el); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * @Module - UI
 * Addition to background.js where logic is implemented
 * Accessibility for user to shot down alarm from UI
 */
function cancelRingAlarm () {
    var alarm_el = this.parentElement.parentElement;
    chrome.extension.sendMessage({cancel_ringing: true, key: alarm_el.getAttribute('key')});
}


/*
 * @Module - Logic
 * takes alarms in UI and orders them by date
 * TODO: add effects (maybe)
 *
 * returns {null}
 */
function orderAlarms () {

    function compare(a,b) {
        if (a.time < b.time) { return -1; }
        else if (a.time > b.time) { return 1; }
        else { return 0; }
    }

    var container = document.getElementById('alarm-list'),
        list_raw = container.getElementsByClassName("alarm"),
        list = [];

    for (var i = 0; i < list_raw.length; i++) {
        list[i] = {
            html: list_raw[i],
            time: revertTime( list_raw[i].getElementsByClassName("date")[0].innerHTML, list_raw[i].getElementsByClassName("time")[0].innerHTML ).getTime()
        };
    }

    list.sort(compare);

    container.innerHTML = "";
    for (i = 0; i < list.length; i++) {
        container.appendChild( list[i].html );
    }

}


/*
 * @Module - Logic
 * APP CORE
 * EVENT setter and functions for "New alarm" section
 *
 * Handles all functionality of adding new alarm
 *
 * @function resetNA - resets fields on new alarm section (hours and minutes to current time, name and description empty)
 * @function setNA - MAIN; creates alarm and stores it into storage
 *
 * @returns {null}
 *
 */
function initNewAlarm() {

    /*
     * Resets data in new alarm section
     */
    function resetNA() {

        document.getElementById('new-name-input').value = '';
        document.getElementById('new-desc-input').value = '';

        //create time one minute ahead of now
        var t = new Date( new Date().getTime() + 60000 );
        document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value = t.getHours();
        document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value = t.getMinutes();

        document.getElementById("new-date-input").value = displayTime(t).date;
        datePicker.setDate(t);

        document.getElementById('new-rep-all').checked = false;
        var dates = document.getElementsByClassName("new-rep-date");
        for (var i = 0; i < dates.length; i++) {
            dates[i].checked = false;
        }

        //select current day
        //sunday is 0 but in html is 7th in order, so we swap with array
        var day_now = (new Date()).getDay();
        dates[ day_now === 0 ? 6 : day_now - 1 ].checked = true;

    }
    document.getElementById('alarm-reset').addEventListener('click', resetNA);


    /*
     * KEY function for extension
     * creates new alarm, creates key and takes data from popup UI that user entered
     * calculates difference between current time and alarm time and stores data to new object
     * async call to storage to store new alarm, creates template for UI and creates alarm based on data given
     * resets new alarm fields
     *
     * Most delicate part is calculation of alarm
     *
     * @returns {null}
     */
    function setNA() {

        //constraints before creating new alarm
        if ( checkConstraints() ) { return false; }

        //random key generator
        //6 character alphanumeric string
        function make_key() {
            return Math.random().toString(36).substring(2,8);
        }

        //calculates how much time is till alarm
        function timeToAlarm (t) {
            var s = parseInt(t / 1000); //ignore milliseconds, round seconds
            var d = parseInt(s / 86400);
            var h = parseInt((s / 3600) % 24);
            var m = parseInt((s / 60) % 60);

            return (d > 0 ? d + " "+ chrome.i18n.getMessage("day") +" " : "") + (h > 0 ? h + " "+ chrome.i18n.getMessage("hour") +" " : "") + m + " "+ chrome.i18n.getMessage("minute") +"!" ;
        }

        /*
         * ALARM object
         * @param {string} key - 6-char alphanumeric string used as identifier
         * @param {int} time_created - time at which alarm was created (ms from 1970)
         * @param {int} time_set - time when alarm was supposed to activate (ms from 1970)
         * @param {int} time_span - difference between current time and time when alarm is to be activated (ms)
         * @param {bool} repetitive - checker if alarm is one time or will be repeated
         * @param {int} time_rep - original time at which alarm will be repeated (only time taken, date dropped)
         * @param {array} rep_days - true/false entries on days that are repeated/not repeated
         */
        var alarm = {
            key: make_key(),
            name: document.getElementById('new-name-input').value,
            desc: document.getElementById('new-desc-input').value,
            time_created: new Date().getTime(),
            time_set: "",
            time_span: "",
            repetitive: false,
            time_rep: "",
            rep_days: [0, 0, 0, 0, 0, 0, 0],
            ringing: false
        };


        //DATA collect
        //time is taken from picker that has date object
        //when seconds set to something, picker will change date object but action itself returns time in milliseconds
        var input_date = document.getElementById("new-date-input").value,
            input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
            input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value;
        alarm.time_set = revertTime(input_date, input_h + ":" + input_min + ":00").getTime();
        alarm.repetitive = document.getElementById("toggle-repetitive-alarm").getAttribute("class").length > 0;

        //repetitive alarm additions
        if (alarm.repetitive) {
            var rep_days = document.getElementsByClassName("new-rep-box"),
                i, d;

            for (i = 0; i < rep_days.length - 1; i++) {
                d = rep_days[i].getElementsByTagName("input")[0];
                alarm.rep_days[i] = d.checked;
            }
            alarm.time_rep = alarm.time_set;

            var true_rep = false;
            for (i = 0; alarm.rep_days.length; i++) {
                if (alarm.rep_days[i]) { true_rep = true; break; }
            }
            
            if(!true_rep) { alarm.repetitive = false; }
        }


        //ALARM TIME - calculate when alarm will trigger
        alarm.time_span = alarm.time_set - alarm.time_created;


        //ASYNC!
        //get alarm list and add new alarm
        var storage_callback = function (object) {
            var alarms = object.AM_alarms;

            //save new alarm to alarm list
            alarms.push(alarm);
            chrome.storage.sync.set({'AM_alarms': alarms});

            //add alarm to list
            // var alarm_el = alarmTemplate(alarm);
            var alarm_el = template('alarm', { alarm: alarm } );
            alarm_el.getElementsByClassName('alarm-remove')[0].addEventListener('click', removeAlarm);
            document.getElementById('alarm-list').appendChild(alarm_el);

            //notify user that alarm is created and will be processed in X minutes
            var alarm_list = document.getElementById("alarm-list").getElementsByClassName("alarm");
            for (var i = 0; i < alarm_list.length; i++) {
                if (alarm_list[i].getAttribute("key") === alarm.key) {
                    alarm_list[i].notify("alarm created", chrome.i18n.getMessage("ntfAlarmRing") + timeToAlarm(alarm.time_span));
                }
            }

            orderAlarms();

        }.bind(alarm); //pushing variable alarm into scope!
        chrome.storage.sync.get('AM_alarms', storage_callback);


        //create alarm -> 1 minute = 60,000 milliseconds
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        resetNA();
        toggleNewAlarm();
    }



    document.getElementById('alarm-set').addEventListener('click', setNA);

    //toggles visibility of new alarm section
    document.getElementById("toggle-new-alarm").addEventListener('click', toggleNewAlarm);
    document.getElementById("toggle-onetime-alarm").addEventListener('click', toggleAlarmType);
    document.getElementById("toggle-repetitive-alarm").addEventListener('click', toggleAlarmType);
    document.getElementById("new-rep-all").addEventListener('click', allCheck);

    //select current day
    //sunday is 0 but in html is 7th in order, so we swap with array
    var dates = document.getElementsByClassName("new-rep-date");
    var day_now = (new Date()).getDay();
    dates[ day_now === 0 ? 6 : day_now - 1 ].checked = true;
    for (var i = 0; i < dates.length; i++) {
        dates[i].addEventListener('click', dateCheck);
    }
}



/*
 * @Module - Logic
 * Gets alarms from storage and via template adds to popup DOM
 * adds event for alarm removal
 *
 * @returns {null}
 */
function getAlarmList() {
    //fetches all alarms from storage and ASYNC adds to DOM
    chrome.storage.sync.get('AM_alarms', function (object) {
        var alarms = object.AM_alarms || [],
            list = document.getElementById('alarm-list'),
            alarm = null,
            removed = false;


        //checks age of alarm and removes if alarm "passed" - happens when PC turned off and alarm is "triggered"
        for (var i = 0; i < alarms.length; i++) {

            if (!alarms[i].repetitive && !alarms[i].ringing) {
                if ( (alarms[i].time_set - (new Date()).getTime()) < 0 ) {
                    alarms.splice(i, 1);
                    removed = true;
                }
            }

            /* HAX when notification is broken (not risen), then this will raise it, at least then popup is opened */
            if(alarms[i].ringing) {
                chrome.notifications.update(alarms[i].key, { requireInteraction: true });
            }

        }
        if (removed) { chrome.storage.sync.set({'AM_alarms': alarms}); }


        for (i = 0; i < alarms.length; i++) {
            //create alarm HTML template
            alarm = template('alarm', { alarm: alarms[i] });

            //add remove event
            if (alarms[i].ringing) { alarm.getElementsByClassName("alarm-ring-cancel")[0].addEventListener('click', cancelRingAlarm);
            } else { alarm.getElementsByClassName('alarm-remove')[0].addEventListener('click', removeAlarm); }

            //add alarm to DOM
            list.appendChild( alarm );
        }

        if (alarms.length === 0) {
            toggleNewAlarm();
        } else {
            orderAlarms();
            document.getElementById("toggle-repetitive-alarm").style.display = "none";
            document.getElementById("toggle-onetime-alarm").style.display = "none";
        }

    });

}


/*
 * @Module - UI
 * UI update for alarms when called from notifications
 * Current options are to REMOVE and UPDATE alarm
 * It is possible to utilize both remove and update
 *
 * 'background.js' notification/alarm activation interface has handlers for alarms/notifications
 * This function receives updates regarding UI update for popup and returns request (for easier keeping)
 *
 * @param {object} request - contains data on how to process alarm
 * @param {object} sender - contains extension ID and extension URL
 * @param {function} sendResponse - callback function via which response is returned
 * @returns {null}
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        var key = request.key,
            list = document.getElementById('alarm-list').getElementsByClassName('alarm'),
            i, alarm_t;


        //REMOVES alarm from UI
        if (request.remove === true) {
            for (i = 0; i < list.length; i++) {
                if (key === list[i].getAttribute('key')) {
                    list[i].remove();
                    break;
                }
            }
        }


        //CHANGES alarm time in UI
        // alarm should always be removed and here new template is created
        if (request.update === true) {
            alarm_t = template('alarm', { alarm: request.alarm } );
            document.getElementById('alarm-list').appendChild(alarm_t);
            list = document.getElementById('alarm-list').getElementsByClassName('alarm');

            for (i = 0; i < list.length; i++) {
                if (list[i].getAttribute("key") === key) {
                    if (request.alarm.ringing) {
                        list[i].getElementsByClassName("alarm-ring-cancel")[0].addEventListener('click', cancelRingAlarm);
                    } else {
                        list[i].getElementsByClassName("alarm-remove")[0].addEventListener('click', removeAlarm);
                    }
                }
            }

            orderAlarms();

        }

    }
);


/*
 * @Module - Init
 * MAIN and FIRST Function (probably loaded after 'background.js')
 * loads all events and handlers that will be on popup DOM
 */
document.addEventListener('DOMContentLoaded', function() {

    //localise HTML
    localizeHtmlPage();
    //initializes helpers and widgets for UI
    initHelpers();
    //inserts existing alarms in popup
    getAlarmList();
    //adds section for new alarm in popup
    initNewAlarm();

});