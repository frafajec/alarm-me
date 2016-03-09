/*
 * Internal function for easy catching current datetime
 * @returns {object} - object packed with shortcuts to get current datetime
*/
function getCurrentTime() {
	var c = new Date();
	return {
		"h": c.getHours(),
		"m": c.getMinutes(),
		"s": c.getSeconds(),
		"D": c.getDate(),
		"M": c.getMonth(),
		"Y": c.getFullYear()
	};
}


/*
 * Sets default time in alarm, current time
 * requests current time and places it in popup for default data
 * @returns {null}
*/
function setDefAlarmTime() {
	var t = getCurrentTime();

	document.getElementById('na-time-h').getElementsByClassName('value')[0].value = t.h;
	document.getElementById('na-time-m').getElementsByClassName('value')[0].value = t.m;
}


/*
 * TEMPLATE for alarm popup list
 *
 * <div class="al-elem" key="key_id">
 *	 <input type="image" src="img/cancel.png" class="cancel">
 *	 <input type="text" class="al-elem-time">
 *	 <input type="text" class="al-elem-name">
 * </div>
 *
 * @param {object} alarm - alarm object from (as in storage)
 * @returns {html} div - html alarm object
 *
 * TODO: parse hours and minutes if single digit!
 */
function alarmTemplate(alarm) {
	var div = document.createElement("div");
	div.setAttribute("class", "al-elem");
	div.setAttribute("key", alarm.key);

	var elem1 = document.createElement("input");
	elem1.setAttribute("type", "image");
	elem1.setAttribute("src", "img/cancel.png");
	elem1.setAttribute("class", "cancel");

	var elem2 = document.createElement("input");
	elem2.setAttribute("type", "text");
	elem2.setAttribute("class", "al-elem-time");
	elem2.value = new Date(alarm.time_set).getHours() + ":" + new Date(alarm.time_set).getMinutes();

	var elem3 = document.createElement("input");
	elem3.setAttribute("type", "text");
	elem3.setAttribute("class", "al-elem-name");
	elem3.setAttribute("disabled", "disabled");
	elem3.value = alarm.name;

	div.appendChild(elem1);
	div.appendChild(elem2);
	div.appendChild(elem3);

	return div;
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
	var alarm_el = this.parentElement;

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
		var alarm_list = document.getElementsByClassName('al-elem');
		for (i = 0; i < alarm_list.length; i++) {
			if (key == alarm_list[i].getAttribute('key')) {
				alarm_list[i].remove();
			}
		}

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
			list = document.getElementById('al-container'),
			alarm = null;

		for (var i = 0; i < alarms.length; i++) {
			//create alarm HTML template
			alarm = alarmTemplate(alarms[i]);
			//add remove event
			alarm.getElementsByClassName('cancel')[0].addEventListener('click', removeAlarm);
			//add alarm to DOM
			list.appendChild( alarm );
		}

	});

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
	
	el.value = val;
}


/*
 * Parses time in format DD.MM.YYYY hh:mm
 * to milliseconds since 01.01.1970
 *
 * TODO: NOT USED!
 */
function stringTimeMilisec(string) {
	var date = string.split(" ")[0],
	    time = string.split(" ")[1];

	var jstime = new Date(date.split(".")[2] + "/" + date.split(".")[1] + "/" + date.split(".")[0] + " " + time + ":00");
	return jstime.getTime();
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
		 * @param {int} time_snooze - total snoozed time (initial 0) (history purposes)
		 */
		var alarm = {
			key: make_key(),
			name: document.getElementById('na-name').value,
			desc: document.getElementById('na-desc').value,
			time_created: new Date().getTime(),
			time_set: "",
			time_span: "",
			time_snooze: 0
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
 * UI update for alarms when called from notifications
 * Current options are to remove or snooze alarm
 *
 * 'background.js' notification/alarm activation interface has handlers for alarms/notifications
 * This function receives updates regarding UI update for popup and returns request (for easier keeping)
 *
 * @param {object} request - contains data on how to process alarm
 * @param {object} sender - contains extension ID and extension URL
 * @param {function} sendResponse - callback function via which response is returned
 * @returns {null}
 *
 * TODO: implement snooze
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		var key = request.key;

		//remove alarm from UI
		if (request.action == "remove") {

			var list = document.getElementById('al-container').getElementsByClassName('al-elem');

			for (var i = 0; i < list.length; i++) {

				if (key == list[i].getAttribute('key')) {
					list[i].remove();
					break;
				}

			}

			sendResponse(request);
		}
		//change alarm time in UI
		else if (request.action == "snooze") {

			sendResponse(request);
		}

	}
);


/*

 * MAIN and FIRST Function (probably loaded after 'background.js'
 * loads all events and handlers that will be on popup DOM
 *
*/
document.addEventListener('DOMContentLoaded', function() {
	//DOM data add
	setDefAlarmTime();
	getAlarmList();
	
	//event handlers
	initNewAlarm();
});







