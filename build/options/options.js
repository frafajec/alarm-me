var toneList = [
    new Audio("../../tones/light.mp3"),
    new Audio("../../tones/notification.mp3"),
    new Audio("../../tones/one_alarm.mp3"),
    new Audio("../../tones/analog.mp3")
];
var alarmTone;
var timeOut;

var toneSelect;
var timeSelect;
var dateSelect;


/*
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
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH !== valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}


/*
 * On menu click changes page that is shown
 * 3 pages: instructions, options, support
 * All pages need to have navigation 'link' to map it to ID on div with class 'page'
 * @returns {null}
 */
function menuChange (e) {

    e.preventDefault();

    var toPageLi = this.parentElement,
        toPage = document.getElementById( toPageLi.getAttribute('link') );

    var links = document.getElementById('nav').getElementsByTagName('li'),
        pages = document.getElementsByClassName('page');

    //remove 'active' from link tab
    for (var i = 0; i < links.length; i++) {
        links[i].setAttribute('class', '');
    }

    //hide all pages
    for (i = 0; i < pages.length; i++) {
        pages[i].style.display = 'none';
    }

    toPage.style.display = 'block';
    if (toPageLi.getAttribute("id") === "logo") {
        //fix when clicked on logo so tab options is highlighted
        links[2].setAttribute('class', 'active');
    } else {
        toPageLi.setAttribute('class', 'active');
    }

    //change hash after "page" is changed and "disable" scroll to anchor point
    window.location.hash = "#" + toPageLi.getAttribute('link');
    window.scrollTo(0,0);
}



/*
 * Initialize pages, only one should be shown
 * Two scenarios!
 * 1. opened from chrome extension options -> open 'options' page
 * 2. opened from popup of extension -> open 'instructions' page
 * default page is options!
 * @returns {null}
 */
function initializePages () {
    var url = window.location.href,
        page = url.split('#').length === 2 ? url.split('#')[1] : 'options';

    document.getElementById('instructions').style.display = 'none';
    document.getElementById('options').style.display = 'none';
    document.getElementById('support').style.display = 'none';

    switch (page) {
        case 'instructions':
            document.getElementById('instructions').style.display = 'block';
            break;
        case 'support':
            document.getElementById('support').style.display = 'block';
            break;
        default:
            document.getElementById('options').style.display = 'block';
            page = 'options'; //fallback case
            break;
    }

    //set current page to be active (UI)
    var li = document.getElementById('nav').getElementsByTagName('li');
    for (var i = 0; i < li.length; i++) {
        if (li[i].getAttribute('link') === page && li[i].getAttribute('id') !== 'logo') {
            li[i].setAttribute('class', 'active');
            break;
        }
    }

    //add page change on navigation (events)
    var anchors =  document.getElementById('nav').getElementsByTagName('a');
    for (i = 0; i < anchors.length; i++) {
        anchors[i].addEventListener('click', menuChange);
    }
}



/*
 * function that handles defaults
 * @param {boolean} save - if true default options will persist in storage
 * @param {boolean} change - if true changes UI values for given options
 * @returns {JSON} options - default options that will be used in the app
 */
function defaultOptions (save, change) {
    var options = {
        type: 'default',
        snooze: 10,
        stop_after: 10,
        tone: 0,
        volume: 100,
        date_format: 0,
        time_format: 0,
        inactive: true,
        countdown: false
    };

    if (save) {
        //@param {object} - data to be stored
        chrome.storage.sync.set({'AM_options': options});
    }
    if (change) {
        document.getElementById('alarm-snooze').value = options.snooze;
        document.getElementById('alarm-stop').value = options.stop_after;
        document.getElementById('alarm-volume').value = options.volume;
        document.getElementById('alarm-inactive').checked = options.inactive;
        document.getElementById('alarm-countdown').checked = options.countdown;
        window.toneSelect._changeOption(options.tone);
        window.timeSelect._changeOption(options.time_format);
        window.dateSelect._changeOption(options.date_format);
    }

    return options;
}



/*
 * Calls options reset
 * @returns {null}
 */
function resetOptions () {
    defaultOptions(true, true);
}


/*
 * SAVE options
 * called from change functions of each element
 * collects all input values and persists them
 *
 * stops sound play before saving (on any change)
 * @returns {null}
 */
function save_options () {
    var options = {};

    //prevention of notification play
    if (alarmTone) {
        var btnToggle = document.getElementsByClassName("toggle-sound")[0];
        btnToggle.style.background = "url(img/play128.png)";
        btnToggle.style.backgroundSize = "contain";
        btnToggle.setAttribute('state', 'stop');

        alarmTone.pause();
        clearTimeout(timeOut);
    }

    //SAVING
    options.type = 'custom';
    options.snooze = document.getElementById('alarm-snooze').value;
    options.stop_after = document.getElementById('alarm-stop').value;
    options.tone = document.getElementById('song-list').getElementsByClassName('cs-select')[1].selectedIndex - 1;
    options.time_format = document.getElementById('time-list').getElementsByClassName('cs-select')[1].selectedIndex - 1;
    options.date_format = document.getElementById('date-list').getElementsByClassName('cs-select')[1].selectedIndex - 1;
    options.volume = document.getElementById('alarm-volume').value;
    options.inactive = document.getElementById('alarm-inactive').checked;
    options.countdown = document.getElementById('alarm-countdown').checked;

    //persist options to storage
    chrome.storage.sync.set({'AM_options': options});
    //notify background to change options
    chrome.extension.sendMessage({reload_options: true});
}



/*
 * default input change form for proofing and control of input
 * calls options saving if there are no errors
 * @returns {null}
 */
function input_change () {
    var val = this.value,
        error = false;

    if (val === '' || parseInt(val) < 0) {
        this.value = 0;
    }
    else if (isNaN(parseInt(val))) {
        this.className = 'error';
        error = true;
    }
    else {
        this.className = '';
        this.value = parseInt(val);
    }

    if (!error) {
        save_options();
    }
}


/*
 * specific input control because volume has upper limit on 100
 * calls options saving if there are no errors
 * @returns {null}
*/
function volume_change () {
    var val = this.value,
        error = false;

    if (val === '' || parseInt(val) < 0) {
        this.value = 0;
    }
    else if ( isNaN(parseInt(val)) ) {
        this.className = 'error';
        error = true;
    }
    else if (parseInt(val) > 100) {
        this.value = 100;
    }
    else {
        this.className = '';
    }

    if (!error) {
        save_options();
    }
}


/*
 * button that play selected tone with given volume to user
 * two states:
 *      stop: music is off and it calls for playing
 *      play: music is on and it should be turned off
 * @returns {null}
 */
function toggle_sound () {
    var state = this.getAttribute('state');

    alarmTone = toneList[ document.getElementById('song-list').getElementsByClassName('cs-select')[1].selectedIndex - 1 ];
    alarmTone.volume = document.getElementById('alarm-volume').value / 100;
    alarmTone.currentTime = 0;

    var btnToggle = this,
        timeOutFnc = function () {
            alarmTone.pause();
            btnToggle.style.background = "url(img/play128.png)";
            btnToggle.style.backgroundSize = "contain";
            btnToggle.setAttribute('state', 'stop');
        }.bind(btnToggle);

    //play song
    if ( state === 'stop' ) {
        this.style.background = "url(img/stop128.png)";
        this.style.backgroundSize = "contain";
        this.setAttribute('state', 'play');

        alarmTone.play();
        timeOut = setTimeout(timeOutFnc, 8000);
    }
    //stop song
    else {
        this.style.background = "url(img/play128.png)";
        this.style.backgroundSize = "contain";
        this.setAttribute('state', 'stop');

        alarmTone.pause();
        clearTimeout(timeOut);
    }
}


/*
 * Button (input) actions
 * Opens mail client, redirects to linkedin, opens app in chrome store
 */
function sendMail () {
    var mail = document.createElement("iframe");
    mail.setAttribute("src", "mailto:filip.rafajec.dev@gmail.com");
    mail.setAttribute("style", "display: none;");
    mail.setAttribute("id", "mail-popup");

    var body = document.getElementsByTagName("body")[0];
    body.appendChild(mail);

    body.removeChild(document.getElementById("mail-popup"));
}
function openLinkedin () {
    chrome.tabs.create({ 'url': 'http://linkedin.com/in/frafajec' });
}
function openStore () {
    chrome.tabs.create({ 'url': 'https://chrome.google.com/webstore/detail/alarm-me/knahjdfbilnkfipggnnhojmjpjcgjkmg' });
}


/*
 * MAIN
 * initializes DOM and loads user options
 *
 * @returns {null}
 */
document.addEventListener("DOMContentLoaded", function() {

    localizeHtmlPage();

    initializePages();

    //add select drop-down
    var songList = document.getElementById('song-list').getElementsByTagName('select')[0];
    toneSelect = new SelectFx(songList, { onChange: save_options });
    window.toneSelect = toneSelect;

    var timeList = document.getElementById('time-list').getElementsByTagName('select')[0];
    timeSelect = new SelectFx(timeList, { onChange: save_options });
    window.timeSelect = timeSelect;

    var dateList = document.getElementById('date-list').getElementsByTagName('select')[0];
    dateSelect = new SelectFx(dateList, { onChange: save_options });
    window.dateSelect = dateSelect;

    document.getElementById("alarm-inactive").addEventListener('click', save_options);
    document.getElementById("alarm-countdown").addEventListener('click', save_options);


    //LOAD and SET options
    chrome.storage.sync.get('AM_options', function (object) {
        var options = object.AM_options;

        /*
         * DEFAULTS and option explanation
         * @param {string} type - type of options (redundant), can be default or custom
         * @param {int} snooze - length of snooze in minutes
         * @param {int} stop_after - after what time should alarm (notification) stop re-appearing
         * @param {int} tone - tone of alarm that will be played when notification arises
         * @param {int} volume - loudness of alarm (%)
         * @param {string} date_format - date format that will be used in app
         */
        if (!options) {
            options = defaultOptions(true, false);
        }

        //legacy
        if (!('time_format' in options)) {
            options.time_format = 0;
        }
        if (!('date_format' in options)) {
            options.date_format = 0;
        }
        save_options();

        //UI selection of elements
        document.getElementById('alarm-snooze').value = options.snooze;
        document.getElementById('alarm-stop').value = options.stop_after;
        document.getElementById('alarm-volume').value = options.volume;
        document.getElementById('alarm-inactive').checked = options.inactive;
        document.getElementById('alarm-countdown').checked = options.countdown;
        window.toneSelect._changeOption(options.tone);
        window.timeSelect._changeOption(options.time_format);
        window.dateSelect._changeOption(options.date_format);

    });


    //EVENTS
    //drop-down events added on initialisation
    document.getElementById('alarm-snooze').addEventListener('input', input_change);
    document.getElementById('alarm-stop').addEventListener('input', input_change);
    document.getElementById('alarm-volume').addEventListener('input', volume_change);
    document.getElementsByClassName('toggle-sound')[0].addEventListener('click', toggle_sound);
    document.getElementById('options-reset').addEventListener('click', resetOptions);

    //button actions
    document.getElementById("link-mail").addEventListener("click", sendMail);
    document.getElementById("link-linked").addEventListener("click", openLinkedin);
    document.getElementById("link-chrome").addEventListener("click", openStore);
});