
/*
 * Sets default time in alarm, current time
 * requests current time and places it in popup for default data
 * @returns {null}
*/
function setDefAlarmTime() {
	var t = getCurrentTime();

	document.getElementById('na-time-h').getElementsByClassName('value')[0].value = displayTime(t.h);
	document.getElementById('na-time-m').getElementsByClassName('value')[0].value = displayTime(t.m);
}


/*
 * TODO improve!
*/
function changeInputTime(e) {
	var el = this.parentElement.getElementsByClassName('value')[0],
		unit = el.getAttribute('unit'),
		val = parseInt(el.value) ? parseInt(el.value) : 0,
		type = this.getAttribute('class');

	//changes value of desired element
	if (unit == "h") {
		if (type == "increase" && (val + 1) > 23) { val = 0; }
		else if (type == "decrease" && (val - 1) < 0) { val = 23; }
		else {
			val = type == "increase" ? val + 1 : val - 1;
		}
	} else if (unit == "m") {
		if (type == "increase" && (val + 1) > 59) { val = 0; }
		else if (type == "decrease" && (val - 1) < 0) { val = 59; }
		else {
			val = type == "increase" ? val + 1 : val - 1;
		}
	} else {
		console.log("Misfired increase/decrease!\n" + e);
	}
	
	el.value = displayTime(val);
}


/*
 * APP CORE
 * EVENT setter and functions for "New alarm" section
 *
 * Handles all functionality of adding new alarm
 *
 * @function timeScrollNA - UI shift of time by clicking on button (up/down)
 * @function resetNA - resets fields on new alarm section (hours and minutes to current time, name and description empty)
 * @function setNA - MAIN; creates alarm and stores it into storage
 *
 * @returns {null}
 *
*/
function initNewAlarm() {

	/*
	 * Changes time via button clicks (hours and minutes)
	 */
	function timeScrollNA () {
		var time_h = document.getElementById('na-time-h'),
				time_m = document.getElementById('na-time-m');

		time_h.getElementsByClassName('increase')[0].addEventListener('click', changeInputTime);
		time_h.getElementsByClassName('decrease')[0].addEventListener('click', changeInputTime);
		time_m.getElementsByClassName('increase')[0].addEventListener('click', changeInputTime);
		time_m.getElementsByClassName('decrease')[0].addEventListener('click', changeInputTime);
	}
	timeScrollNA();


	/*
	 * Resets data in new alarm section
	 */
	function resetNA() {
		setDefAlarmTime();
		document.getElementById('na-name').value = '';
		document.getElementById('na-desc').value = '';
	}
	document.getElementById('na-reset').addEventListener('click', resetNA);


	/*
	 * KEY function for extension
	 * creates new alarm, creates key and takes data from popup UI that user entered
	 * calculates difference between current time and alarm time and stores data to new object
	 * async call to storage to store new alarm, creates template for UI and creates alarm based on data given
	 * resets new alarm fields
	 *
	 * Most delicate part is calculation of alarm
	 * TODO: here maybe should be restrictions on alarms in past?
	 * TODO WARNING: if this section grows any bigger, be careful on performance!
	 *
	 * @returns {null}
	 */
	function setNA() {

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
		 * @param {int} time_snoozed - REMOVED //TODO potentially implement
		 */
		var alarm = {
			key: make_key(),
			name: document.getElementById('na-name').value,
			desc: document.getElementById('na-desc').value,
			time_created: new Date().getTime(),
			time_set: "",
			time_span: ""
		};


		var alarm_h = document.getElementById('na-time-h').getElementsByClassName('value')[0].value,
			alarm_m = document.getElementById('na-time-m').getElementsByClassName('value')[0].value,
		    now = getCurrentTime();

		//given format is YYYY/MM/DD hh:mm:ss
		//this is universal format for 'new Date' for all browsers
		var alarm_date = now.Y + "/" + ( parseInt(now.M) + 1 ) + "/" + now.D + " " + alarm_h + ":" + alarm_m + ":00";
		alarm.time_set = new Date(alarm_date).getTime();
		alarm.time_span = alarm.time_set - alarm.time_created;


		//ASYNC!
		//get alarm list and add new alarm
		var storage_callback = function (object) {
			var alarms = object.AM_alarms;

			//save new alarm to alarm list
			alarms.push(alarm);
			chrome.storage.sync.set({'AM_alarms': alarms});

			//add alarm to list
			var alarm_el = alarmTemplate(alarm);
			alarm_el.getElementsByClassName('cancel')[0].addEventListener('click', removeAlarm);
			document.getElementById('al-container').appendChild(alarm_el);

		}.bind(alarm); //pushing variable alarm into scope!
		chrome.storage.sync.get('AM_alarms', storage_callback);


		//create alarm -> 1 minute = 60,000 milliseconds
		chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });


		resetNA();
	}
	document.getElementById('na-set').addEventListener('click', setNA);

}







/*
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
            //timePicker.set( "defaultDate" , now );
            document.getElementById('new-time-input').value = (" " + now.getHours() + ":" + now.getMinutes()).toString();
        }


    });


    //TODO: CHANGE!
    datePicker = flatpickr("#new-date-input", {
        minDate: new Date(),
        defaultDate: new Date(),
        dateFormat: pickrDateFormat()
    });
    datePicker.set("onChange", function(d){
        datePicker.set( "minDate" , d );
    });

}


/*
 * GLOBALS
 */
var options = {};
var alarms_nbr = 0;
//lists for drop-down selection
var dateFormatList = [ "DD.MM.YYYY", "DD.MM.YY", "DD/MM/YYYY", "MM.DD.YYYY" ];
var toneList = []; //TODO
//time-picker variables
var timePicker;
var datePicker;


/*
 * LOAD options
 *
 * date-time pickers can cause problems when not loaded after options
 * however, there is a chance that options will be loaded before DOM, then simply move load options into DOMContentLoaded
 */
function loadOptions () {
    chrome.storage.sync.get('AM_options', function (object) {

        options = object.AM_options;

        //override index value with real value
        options.date_format = dateFormatList[options.date_format];
        options.tone = toneList[options.tone];

        initTimePickers();

    });
}
loadOptions();




/*
 * MAIN and FIRST Function (probably loaded after 'background.js'
 * loads all events and handlers that will be on popup DOM
 *
*/
document.addEventListener('DOMContentLoaded', function() {

    /* IF THERE IS NO ACTIVE ALARMS, OPEN NEW ALARM SECTION, OTHERWISE KEEP IT HIDDEN */

    //runs clock in background of popup
    popupClock();
    //event for opening options from popup
    openOptions();
    //inserts existing alarms in popup
    getAlarmList();
    //adds section for new alarm in popup
    //initNewAlarm();

});


/*
 * Updates chrome badge icon
 * TODO
 */
function updateBadge() {

}


/*
 * Prepares date-time object to be displayed in DOM
 *
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
    }
}


/*
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
 * open OPTIONS tab
*/
function openOptions () {

    document.getElementById('link-options').addEventListener('click', function () {

        //chrome.tabs.create({ 'url': 'chrome-extension://' + chrome.runtime.id + '/options/options.html#instructions' });

        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options/options.html'));
        }

    });
}


/* TEMPLATE for alarm popup list
 *    <div class="alarm" key="ALARM_KEY">
 *        <div class="alarm-actions"> <input type="button" class="alarm-remove"> </div>
 *
 *        <div class="alarm-container">
 *            <div class="alarm-head">
 *                <div class="datetime">
 *                    <p class="time">06:12</p>
 *                    <p class="date">22.07.2016</p>
 *                </div>
 *                <div class="alarm-name"> <p> ALARM NAME </p> </div>
 *            </div>
 *
 *            <div class="alarm-body">
 *               <div class="alarm-desc"> <p> ALARM DESCRIPTION </p> </div>
 *            </div>
 *        </div>
 *
 *    </div>
 * @param {object} alarm - alarm object from (as in storage)
 * @returns {html} div - html alarm object
 */
function alarmTemplate(alarm) {
    var html = document.createElement("div");
    html.setAttribute("class", "alarm");
    html.setAttribute("key", alarm.key);

    //alarm-actions and button
    var actions = document.createElement("div");
    actions.setAttribute("class", "alarm-actions");
        var input = document.createElement("input");
        input.setAttribute("class", "alarm-remove");
        input.setAttribute("type", "button");
    actions.appendChild(input);


    //alarm-container
    var container = document.createElement("div");
    container.setAttribute("class", "alarm-container");

        var head = document.createElement("div");
        head.setAttribute("class", "alarm-head");

            var dt = displayTime(alarm.time_set);

            var head_datetime = document.createElement("div");
            head_datetime.setAttribute("class", "datetime");

                var time = document.createElement("p");
                time.setAttribute("class", "time");
                time.innerHTML = dt.time;
                var date = document.createElement("p");
                date.setAttribute("class", "date");
                date.innerHTML = dt.date;

            head_datetime.appendChild(time);
            head_datetime.appendChild(date);

            var head_name = document.createElement("div");
            head_name.setAttribute("class", "alarm-name");
                var alarm_name = document.createElement("p");
                alarm_name.innerHTML = alarm.name;
            head_name.appendChild(alarm_name);

        head.appendChild(head_datetime);
        head.appendChild(head_name);


        var body = document.createElement("div");
        body.setAttribute("class", "alarm-body");
            var body_desc = document.createElement("div");
            body_desc.setAttribute("class", "alarm-desc");
                var alarm_desc = document.createElement("p");
                alarm_desc.innerHTML = alarm.desc;
            body_desc.appendChild(alarm_desc);
        body.appendChild(body_desc);


    container.appendChild(head);
    container.appendChild(body);

    return html;
}


/*
 * EVENT for removing alarm
 * activated when button is pressed on alarm list
 * removes from storage, cancels alarm and removes from UI
 *
 * @param {event} e
 * @returns {null}
 */
function removeAlarm(e) {
    var alarm_el = this.parentElement.parentElement;

    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            key = alarm_el.getAttribute('key');

        //stop alarm from triggering
        chrome.alarms.clear(key);


        //remove from storage
        for (var i = 0; i < alarms.length; i++) {
            if (key == alarms[i].key) {
                alarms.splice(i, 1);
            }
        }
        //@param {object} - data object to be saved as JSON
        chrome.storage.sync.set({'AM_alarms': alarms});


        //remove from UI
        var alarm_list = document.getElementsByClassName('alarm');
        for (i = 0; i < alarm_list.length; i++) {
            if (key == alarm_list[i].getAttribute('key')) {
                alarm_list[i].remove();
            }
        }

        alarms_nbr--;
        updateBadge();

    }.bind(alarm_el); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * Gets alarms from storage and via template adds to popup DOM
 * adds event for alarm removal
 *
 * @returns {null}
 */
function getAlarmList() {

    //fetches all alarms from storage and ASYNC adds to DOM
    chrome.storage.sync.get('AM_alarms', function (object) {
        var alarms = object.AM_alarms,
            list = document.getElementById('alarm-list'),
            alarm = null;

        for (var i = 0; i < alarms.length; i++) {
            //create alarm HTML template
            alarm = alarmTemplate(alarms[i]);
            //add remove event
            alarm.getElementsByClassName('alarm-remove')[0].addEventListener('click', removeAlarm);
            //add alarm to DOM
            list.appendChild( alarm );
            //add number of alarms ++
            alarms_nbr++;
        }

        updateBadge();

    });

}


/*
 * UI update for alarms when called from notifications
 * Current options are to REMOVE or SNOOZE alarm
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
        var key = request.key;

        //remove alarm from UI
        if (request.action == "remove") {

            var list = document.getElementById('alarm-list').getElementsByClassName('alarm');

            for (var i = 0; i < list.length; i++) {

                if (key == list[i].getAttribute('key')) {
                    list[i].remove();
                    alarms_nbr--;
                    updateBadge();
                    break;
                }

            }

            sendResponse(request);
        }
        //change alarm time in UI
        else if (request.action == "snooze") {

            //@param {object} object - object containing list of all alarms
            var storage_callback = function (object) {
                var alarms = object.AM_alarms;

                for (var i = 0; i < alarms.length; i++) {
                    if (key == alarms[i].key) {
                        var alarm = alarms[i];
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


                //update UI
                var list = document.getElementById('alarm-list').getElementsByClassName('alarm');

                for (var i = 0; i < list.length; i++) {

                    if (alarm.key == list[i].getAttribute('key')) {

                        //change time in alarm
                        var alarm_dt = displayTime(alarm.time_set);
                        list[i].getElementsByClassName('time')[0].value = alarm_dt.time;
                        list[i].getElementsByClassName('date')[0].value = alarm_dt.date;

                        break;
                    }

                }


                //@param {object} - data to be stored
                chrome.storage.sync.set({'AM_alarms': alarms});


            }.bind(key); //pushing variable alarm into scope!
            chrome.storage.sync.get('AM_alarms', storage_callback);

            sendResponse(request);

        }

    }
);
















