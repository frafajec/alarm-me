var options = {};
//lists for drop-down selection
var dateFormatList = [ "DD.MM.YYYY", "DD.MM.YY", "MM.DD.YYYY", "DD/MM/YYYY", "YYYY/MM/DD" ];
var timeFormatList = [ 24, 12 ];

//time-picker variables
var timePicker;
var datePicker;

var alarmOptionsTimeouts = {};



/*
 * @Module - Init
 * LOAD options
 * date-time pickers can cause problems when not loaded after options
 * however, there is a chance that options will be loaded before DOM, then simply move load options into DOMContentLoaded
 */
function loadOptions () {
    chrome.storage.sync.get('AM_options', function (object) {

        options = object.AM_options;

        //check for some sensitive options
        if (options.date_format === undefined) {
            options.date_format = 0;
            chrome.storage.sync.set({'AM_options': options});
        }

        if (options.time_format === undefined) {
            options.time_format = 0;
            chrome.storage.sync.set({'AM_options': options});
        }

        initTimePickers();

    });
}
loadOptions();


/*
 * @Module - Init
 * Renders date format for datePicker
 */
function pickrDateFormat () {
    var final = "",
        format = dateFormatList[options.date_format];

    if (format === "DD.MM.YYYY") { final = "d.m.Y"; }
    else if (format === "DD.MM.YY") { final = "d.m.y"; }
    else if (format === "MM.DD.YYYY") { final = "m.d.Y"; }
    else if (format === "DD/MM/YYYY") { final = "d/m/Y"; }
    else if (format === "YYYY/MM/DD") { final = "Y/m/d"; }
    else {
        final = "d.m.Y";
    }

    return final;
}


/*
 * @Module - Init
 * Initializes pickers for time and date
 * called after options are loaded because it needs it for date format
 */
function initTimePickers () {

    flatpickr.init.prototype.l10n.firstDayOfWeek = 1;

    if (timeFormatList[options.time_format] !== 24) {
        document.getElementById("new-time-input").removeAttribute("data-time_24hr");
    }

    timePicker = flatpickr("#new-time-input", {
        timeFormat: "H:i",
        minuteIncrement: 1
    });
    timePicker.set("onChange", function(d){
        var now = new Date();
        if (d.getTime() < now.getTime()) {
            document.getElementById('new-time-input').value = (" " + now.getHours() + ":" + now.getMinutes()).toString();
        }
    });
    setTimePicker( (new Date()).getTime() + 60000 );

    datePicker = flatpickr("#new-date-input", {
        minDate: new Date(),
        defaultDate: new Date(),
        dateFormat: pickrDateFormat()
    });

}


/*
 *
 */
function setTimePicker (time) {

    var t = new Date(time),
        addZero = function (n) {
            var x = n.toString();
            if (x.length < 2) { return '0' + x; }
            else { return x; }
        };

    if (timeFormatList[options.time_format] === 12) {
        document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value = addZero((t.getHours() + 11) % 12 + 1);
        document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value = addZero(t.getMinutes());
        document.getElementById("new-time").getElementsByClassName("flatpickr-am-pm")[0].innerHTML = (t.getHours() >= 12 ? "PM":"AM");
    } else {
        document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value = addZero(t.getHours());
        document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value = addZero(t.getMinutes());
    }

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
 * @Module - UI
 * Creates notify element and inserts it into element for display
 * WARNING: can only be called on container, not individual element!
 *
 * @param {html} element - html object of element where tooltip will be inserted
 * @param {string} code - code of text to be displayed
 * @param {object} data.type - for class addition to notify
 *                 data.content - for text addition
 */
function initNotify () {

    /*
     * CODES
     * 01 - alarm created, time to alarm (+data)
     * 02 - warning, alarm in history
     * 03 - warning, alarm not restored because already passed
     */
    Element.prototype.notify = function(code, data) {

        var parent = this,
            notif = document.createElement("span"),
            notifHead = document.createElement("h6"),
            notifBody = document.createElement("p");

        notif.setAttribute("class", "notify " + (data.type ? data.type : "") );
        notifHead.innerHTML = chrome.i18n.getMessage("ntf" + code + "Head");
        notifBody.innerHTML = chrome.i18n.getMessage("ntf" + code + "Body") + "" + (data.content ? data.content : "");

        notif.appendChild(notifHead);
        notif.appendChild(notifBody);
        parent.insertBefore(notif, parent.firstChild);

        notif.addEventListener('click', function () { this.remove(); });
        setTimeout(function () { this.remove(); }.bind(notif), 5000);
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

    var time;
    switch(timeFormatList[options.time_format]) {
        case 12:
            time = addZero((t.getHours() + 11) % 12 + 1) + ":" + addZero( t.getMinutes()) + " " + (t.getHours() >= 12 ? "PM":"AM");
            break;
        default:
            time = addZero( t.getHours() ) + ":" + addZero( t.getMinutes() );
    }

    var date;
    switch(dateFormatList[options.date_format]) {
        case "DD.MM.YY":
            date = addZero( t.getDate() ) + "." + addZero( t.getMonth() + 1 ) + "." + addZero( t.getFullYear().toString().substring(2) );
            break;
        case "DD/MM/YYYY":
            date = addZero( t.getDate() ) + "/" + addZero( t.getMonth() + 1 ) + "/" + addZero( t.getFullYear() );
            break;
        case "MM.DD.YYYY":
            date = addZero( t.getMonth() + 1 ) + "." + addZero( t.getDate() ) + "." + addZero( t.getFullYear() );
            break;
        case "YYYY/MM/DD":
            date = addZero( t.getFullYear() ) + "/" + addZero( t.getMonth() + 1 ) + "/" + addZero( t.getDate() );
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

    switch(dateFormatList[options.date_format]) {
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
        case "YYYY/MM/DD":
            s = date.split("/");
            revert = new Date ( s[0] + "/" + s[1] + "/" + s[2] + " " + time );
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
function toggleNewAlarm (show) {

    var state = document.getElementById("alarm-new-container").className;

    if ( (state.indexOf('closed') === -1) && (show !== true) ) {
        document.getElementById("alarm-new").setAttribute("state", "");
        document.getElementById("alarm-new").setAttribute("key", "");

        document.getElementById("alarm-new-container").className = "closed";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("newAlarm");

        document.getElementById("toggle-repetitive-alarm").style.transitionDelay = "0s";
        document.getElementById("toggle-onetime-alarm").style.transitionDelay = "0s";
        document.getElementById("toggle-repetitive-alarm").style.opacity = "0";
        document.getElementById("toggle-onetime-alarm").style.opacity = "0";
        document.getElementById("toggle-repetitive-alarm").style.visibility = "hidden";
        document.getElementById("toggle-onetime-alarm").style.visibility = "hidden";


    } else {
        document.getElementById("alarm-new-container").className = "";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("cancelAlarm");

        document.getElementById("toggle-repetitive-alarm").style.display = "block";
        document.getElementById("toggle-onetime-alarm").style.display = "block";

        document.getElementById("toggle-repetitive-alarm").style.visibility = "visible";
        document.getElementById("toggle-onetime-alarm").style.visibility = "visible";
        document.getElementById("toggle-repetitive-alarm").style.opacity = "1";
        document.getElementById("toggle-onetime-alarm").style.opacity = "1";
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

    var input_date = document.getElementById("new-date-input").value,
        input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
        input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value,
        input_pa = document.getElementById("new-time").getElementsByClassName("flatpickr-am-pm");

    var alarm_time = revertTime(input_date, input_h + ":" + input_min + ":00" + (input_pa.length > 0 ? (" " + input_pa[0].innerHTML) : "")),
        now = new Date();

    // CONSTRAINT 1 - alarm in past
    if (alarm_time.getTime() <= now.getTime()) {
        document.getElementById("new-time").notify("02", {  type: "warning" });

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
 * @Module - UI
 * Execution function for alarm options closure
 * var key -> pushed into scope in fkc autoCloseOptions
 */
function autoCloseOptionsExe () {
    var key = this.alarmID,
        alarms = document.getElementsByClassName("alarm"),
        alarm, options;

    for (var i = 0; i < alarms.length; i++) {
        if (alarms[i].getAttribute("key") === key) {
            alarm = alarms[i];
            break;
        }
    }
        
    options = alarm.getElementsByClassName("alarm-options")[0];
    options.setAttribute("state", "closed");
    options.removeEventListener("mouseout", autoCloseOptions);
    options.removeEventListener("mouseover", resetAutoCloseOptions);
}


/*
 * @Module - UI
 * Returns auto-closure state to default/null
 * Occurs when mouse has returned to options field and timeout for auto-closure is no longer required
 */
function resetAutoCloseOptions () {

    //remove old events
    this.removeEventListener("mouseout", autoCloseOptions);
    this.removeEventListener("mouseover", resetAutoCloseOptions);

    //remove timeout for closing
    var alarmID = this.parentElement.parentElement.getAttribute("key");
    clearTimeout(alarmOptionsTimeouts[alarmID]);
    delete alarmOptionsTimeouts[alarmID];

    //subscribe to beginning
    this.addEventListener("mouseout", autoCloseOptions);
}


/*
 * @Module - UI
 * Main function for auto-closure!
 * Checks if mouse has left options field, and if so starts auto-closure procedure
 * Connected to: resetAutoCloseOptions, autoCloseOptionsExe, toggleAlarmOptions
 */
function autoCloseOptions (e) {
    var t = this,
        c = e.relatedTarget;

    while (c !== t && !(c.nodeName === "BODY" || c.nodeName === "HTML")) {
        c = c.parentElement;
    }
    if (c === t) { return false; }

    //if mouse is out, proceed to elimination
    var alarmID = t.parentElement.parentElement.getAttribute("key");
    this.addEventListener("mouseover", resetAutoCloseOptions);

    alarmOptionsTimeouts[alarmID] = setTimeout(autoCloseOptionsExe.bind({ alarmID: alarmID }), 2000);
}


/*
 * @Module - UI
 * Connected to: autoCloseOptions
 */
function toggleAlarmOptions () {
    var alarm_el = this.parentElement.parentElement.parentElement,
        options = alarm_el.getElementsByClassName("alarm-options")[0];

    if (options.getAttribute("state") === "open") {
        options.setAttribute("state", "closed");
        options.removeEventListener("mouseout", autoCloseOptions);
    }
    else {
        options.setAttribute("state", "open");
        options.addEventListener("mouseout", autoCloseOptions);
    }
}


/*
 * @Module - UI
 * Takes alarm and places it in "new alarm" section to be edited
 * Doesn't do any heavy lifting, all done by confirmAlarm
 */
function editAlarm () {
    var alarm_key = this.parentElement.parentElement.parentElement.parentElement.getAttribute("key");

    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            alarm = {}, i;

        for (i = 0; i < alarms.length; i++) {
            if (alarm_key === alarms[i].key) {
                alarm = alarms[i];
                break;
            }
        }

        document.getElementById("new-name-input").value = alarm.name;
        document.getElementById("new-desc-input").value = alarm.desc;
        if (alarm.repetitive) {
            document.getElementById("toggle-repetitive-alarm").setAttribute("class", "alarm-type-active");
            document.getElementById("toggle-onetime-alarm").setAttribute("class", "");
            document.getElementById("new-desc").className = "hidden";
            document.getElementById("new-rep").className = "";

            var rep_dates = document.getElementsByClassName("new-rep-date"),
                all_check_btn = document.getElementById("new-rep-all"),
                all_check = 0;

            for (i = 0; i < alarm.rep_days.length; i++) {

                rep_dates[i].checked = !!alarm.rep_days[i];
                all_check = alarm.rep_days[i] ? all_check++ : all_check;

            }
            all_check_btn.checked = all_check === rep_dates.length;
        } else {
            document.getElementById("toggle-repetitive-alarm").setAttribute("class", "");
            document.getElementById("toggle-onetime-alarm").setAttribute("class", "alarm-type-active");
            document.getElementById("new-desc").className = "";
            document.getElementById("new-rep").className = "hidden";
        }

        var t = new Date( new Date( alarm.time_set ).getTime() );
        setTimePicker(t.getTime());

        document.getElementById("new-date-input").value = displayTime(t).date;
        datePicker.setDate(t);

        /* Changing new alarm section to edit - ESSENTIAL! */
        var alarm_section = document.getElementById("alarm-new");
        alarm_section.setAttribute("state", "edit");
        alarm_section.setAttribute("key", alarm.key);
        toggleNewAlarm(true);
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("editAlarm");


    }.bind(alarm_key); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);
}


/*
 * @Module - UI/Logic
 * Changes state of alarm between active/inactive
 * UI handled here, logic in background
 */
function changeAlarmState () {
    var alarm_el = this.parentElement.parentElement.parentElement.parentElement,
        container = alarm_el.getElementsByClassName("alarm-container")[0],
        state = container.getAttribute("state"),
        toggle = alarm_el.getElementsByClassName("alarm-change-state")[0];

    if (state === "inactive") {

        var storage_callback = function (object) {
            var alarms = object.AM_alarms,
                key = alarm_el.getAttribute("key"),
                alarm = {}, i;

            for (i = 0; i < alarms.length; i++) {
                if (key === alarms[i].key) {
                    alarm = alarms[i];
                    break;
                }
            }

            //send data do background for calculation and alarm triggering
            chrome.extension.sendMessage({set_active: true, alarm: alarm}, function (response) {

                var alarm_list = document.getElementsByClassName('alarm');

                //alarm successfully restored
                if (response.alarm_active) {
                    alarm = response.alarm;

                    var template = createTemplate('alarm', { alarm: alarm, data: { options_opened: true } } );

                    for (i = 0; i < alarm_list.length; i++) {
                        if (alarm.key === alarm_list[i].getAttribute("key")) {
                            alarm_list[i].remove();
                            break;
                        }
                    }

                    //to return to initial state!
                    template.getElementsByClassName("alarm-options")[0].addEventListener("mouseout", autoCloseOptions);
                    document.getElementById('alarm-list').appendChild(template);
                    orderAlarms();

                //alarm wasn't able to restore
                } else {

                    for (i = 0; i < alarm_list.length; i++) {
                        if (alarm.key === alarm_list[i].getAttribute("key")) {
                            alarm_list[i].notify("03", { type: "warning" });
                            break;
                        }
                    }

                }

                //save new alarm state
                for (i = 0; i < alarms.length; i++) {
                    if (alarm.key === alarms[i].key) {
                        alarms[i] = alarm;
                        break;
                    }
                }
                chrome.storage.sync.set({'AM_alarms': alarms});

            });


        }.bind(alarm_el); //pushing variable alarm into scope!
        chrome.storage.sync.get('AM_alarms', storage_callback);


    } else {
        container.setAttribute("state", "inactive");
        toggle.setAttribute("class", "fa fa-toggle-on fa-rotate-180 fa-lg alarm-change-state");
        chrome.extension.sendMessage({set_inactive: true, key: alarm_el.getAttribute('key')});
    }
}


/*
 * @Module - Logic
 * EVENT for removing alarm
 * activated when button is pressed on alarm list
 * removes from storage, cancels alarm and removes from UI
 *
 * @param {event} e
 * @returns {null}
 */
function removeAlarm() {
    var alarm_el = this.parentElement.parentElement.parentElement.parentElement;

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
 * @Module - UI
 * Calls template creator and after adds event listeners
 * UI cleanup code
 */
function createTemplate (templateName, templateData) {

    var element = template(templateName, templateData);

    [].map.call( element.getElementsByClassName("alarm-ring-cancel") , function (e) { e.addEventListener('click', cancelRingAlarm); });
    [].map.call( element.getElementsByClassName("alarm-edit") , function (e) { e.addEventListener('click', editAlarm); });
    [].map.call( element.getElementsByClassName("alarm-remove") , function (e) { e.addEventListener('click', removeAlarm); });
    [].map.call( element.getElementsByClassName("alarm-change-state") , function (e) { e.addEventListener('click', changeAlarmState); });
    [].map.call( element.getElementsByClassName("alarm-options-toggle") , function (e) { e.addEventListener('click', toggleAlarmOptions); });

    return element;
}


/*
 * @Module - Logic
 * takes alarms in UI and orders them by date
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
 * @Module - UI
 * Resets data in new alarm section
 */
function resetAlarm() {

    document.getElementById("alarm-new").setAttribute("state", "");
    document.getElementById("alarm-new").setAttribute("key", "");

    document.getElementById('new-name-input').value = '';
    document.getElementById('new-desc-input').value = '';

    //create time one minute ahead of now
    var t = new Date( new Date().getTime() + 60000 );
    setTimePicker(t.getTime());

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


/*
 * @Module - Logic
 * Contains all data for alarm creation
 * Connected to: confirmAlarm
 */
function createAlarm () {

    //random key generator
    //6 character alphanumeric string
    function make_key() {
        return Math.random().toString(36).substring(2,8);
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
     * @param {bool} ringing - when alarm activated in background its saved to be ringing for fault prevention
     * @param {bool} active - switch for alarm status
     */
    return {
        key: make_key(),
        name: "",
        desc: "",
        time_created: new Date().getTime(),
        time_set: "",
        time_span: "",
        repetitive: false,
        time_rep: "",
        rep_days: [0, 0, 0, 0, 0, 0, 0],
        ringing: false,
        active: true
    };

}


/*
 * @Module - UI
 * Pulls all data from UI and fills object
 */
function collectAlarmData (alarm) {
    alarm = alarm || {};

    var input_date = document.getElementById("new-date-input").value,
        input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
        input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value,
        input_pa = document.getElementById("new-time").getElementsByClassName("flatpickr-am-pm");
    alarm.name = document.getElementById('new-name-input').value;
    alarm.desc = document.getElementById('new-desc-input').value;
    alarm.time_set = revertTime(input_date, input_h + ":" + input_min + ":00" + (input_pa.length > 0 ? (" " + input_pa[0].innerHTML) : "")).getTime();
    alarm.repetitive = document.getElementById("toggle-repetitive-alarm").getAttribute("class").indexOf("alarm-type-active") !== -1;

    //repetitive alarm additions
    if (alarm.repetitive) {
        var rep_days = document.getElementsByClassName("new-rep-box");

        for (var i = 0; i < rep_days.length - 1; i++) {
            alarm.rep_days[i] = rep_days[i].getElementsByTagName("input")[0].checked;
        }
        alarm.time_rep = alarm.time_set;

        var true_rep = false;
        for (i = 0; alarm.rep_days.length; i++) {
            if (alarm.rep_days[i]) { true_rep = true; break; }
        }
        if(!true_rep) { alarm.repetitive = false; }
    }

    return alarm;
}


/*
 * @Module - Logic
 * On user action "confirm" processes alarm
 * Two branches: create and edit alarm
 */
function confirmAlarm () {

    //constraints before action
    if ( checkConstraints() ) { return false; }

    //calculates how much time is till alarm
    function timeToAlarm (t) {
        var s = parseInt(t / 1000); //ignore milliseconds, round seconds
        var d = parseInt(s / 86400);
        var h = parseInt((s / 3600) % 24);
        var m = parseInt((s / 60) % 60);

        return (d > 0 ? d + " "+ chrome.i18n.getMessage("day") +" " : "") + (h > 0 ? h + " "+ chrome.i18n.getMessage("hour") +" " : "") + m + " "+ chrome.i18n.getMessage("minute") +"!" ;
    }

    //CREATE alarm shell
    var alarm = createAlarm();

    //DATA collect
    alarm = collectAlarmData(alarm);

    //ALARM TIME - calculate when alarm will trigger
    alarm.time_span = alarm.time_set - alarm.time_created;

    //CHECK if alarm is in EDIT mode or CREATE mode
    var edit = document.getElementById("alarm-new").getAttribute("state") === "edit",
        edit_key = document.getElementById("alarm-new").getAttribute("key");

    //CREATE or MODIFY alarm
    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            alarm_list = document.getElementById("alarm-list"),
            alarms_html = alarm_list.getElementsByClassName("alarm"),
            i;


        /* MODIFY only removes alarm from all sources and keeps key */
        if (edit) {
            alarm.key = edit_key;
            chrome.alarms.clear(alarm.key);

            for (i = 0; i < alarms.length; i++) {
                if (alarms[i].key === alarm.key) {
                    alarms.splice(i, 1);
                    break;
                }
            }

            for (i = 0; i < alarms_html.length; i++) {
                if (alarms_html[i].getAttribute("key") === alarm.key) {
                    alarms_html[i].remove();
                    break;
                }
            }

        }


        //save new alarm to alarm list
        alarms.push(alarm);
        chrome.storage.sync.set({'AM_alarms': alarms});


        //CREATE template and add to list
        var alarm_element = createTemplate('alarm', { alarm: alarm } );
        document.getElementById('alarm-list').appendChild(alarm_element);


        //notify user that alarm is created and will be processed in X minutes
        alarms_html = alarm_list.getElementsByClassName("alarm");
        for (i = 0; i < alarms_html.length; i++) {
            if (alarms_html[i].getAttribute("key") === alarm.key) {
                alarms_html[i].notify("01", { content: timeToAlarm(alarm.time_span) });
            }
        }

        //CREATE ALARM trigger -> 1 minute = 60,000 milliseconds
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        orderAlarms();

    }.bind({alarm: alarm, edit: edit, edit_key: edit_key});
    chrome.storage.sync.get('AM_alarms', storage_callback);

    resetAlarm();
    toggleNewAlarm();

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
function initAlarm() {

    //new alarm buttons init
    document.getElementById('alarm-reset').addEventListener('click', resetAlarm);
    document.getElementById('alarm-set').addEventListener('click', confirmAlarm);


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
            alarm = null, i;

        for (i = 0; i < alarms.length; i++) {
            //create alarm HTML template and add to DOM
            alarm = createTemplate('alarm', { alarm: alarms[i] });
            list.appendChild( alarm );
        }

        if (alarms.length === 0) {
            toggleNewAlarm(true);
        } else {
            orderAlarms();
            document.getElementById("toggle-repetitive-alarm").style.opacity = "0";
            document.getElementById("toggle-onetime-alarm").style.opacity = "0";
            document.getElementById("toggle-repetitive-alarm").style.visibility = "hidden";
            document.getElementById("toggle-onetime-alarm").style.visibility = "hidden";
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

            alarm_t = createTemplate('alarm', { alarm: request.alarm } );
            document.getElementById('alarm-list').appendChild(alarm_t);
            list = document.getElementById('alarm-list').getElementsByClassName('alarm');

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

    (function load () {

        if (!Object.keys(options).length) {
            setTimeout(load, 0);
        } else {
            //initializes helpers and widgets for UI
            initHelpers();
            //inserts existing alarms in popup
            getAlarmList();
            //adds section for new alarm in popup
            initAlarm();
        }
    })();

});