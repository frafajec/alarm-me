/*
 * GLOBALS
 */
var displayTime = displayTime || undefined;
var chrome = chrome || undefined;


/*
 * Helper function that renders templates for app
 *
 * alarmTemplate - renders template for alarms in list on popup.js
 */
function template (template, data) {
    var html = "";


    //helper functions
    function reviseLength(txt, n) {
        if (txt.length > n) { txt = txt.substr(0, n - 3) + "..."; }
        return txt;
    }


    //TEMPLATES
    function alarmTemplate(alarm) {

        //FALLBACK from older version when alarms didn't have rep_days!
        if (!alarm.hasOwnProperty("repetitive")) {
            alarm.repetitive = false;
            alarm.rep_days = [0, 0, 0, 0, 0, 0, 0];
        }


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
                head_name.setAttribute("class", "alarm-meta");
                    var alarm_name = document.createElement("p");
                    alarm_name.setAttribute("class", "alarm-name");
                    alarm_name.innerHTML = reviseLength(alarm.name, 22);
                head_name.appendChild(alarm_name);


                if (!alarm.repetitive) {
                    var alarm_desc = document.createElement("p");
                    alarm_desc.setAttribute("class", "alarm-desc");
                    alarm_desc.innerHTML = reviseLength(alarm.desc, 30);
                    head_name.appendChild(alarm_desc);
                } else {
                    var alarm_rep = document.createElement("p");
                    alarm_rep.setAttribute("class", "alarm-days");

                    var span,
                        days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

                    for (var i = 0; i < 7; i++) {
                        span = document.createElement("span");
                        span.innerHTML = chrome.i18n.getMessage(days[i]).charAt(0);
                        span.setAttribute("class", alarm.rep_days[i] ? "active" : "" );
                        alarm_rep.appendChild(span);
                    }
                    head_name.appendChild(alarm_rep);
                }

            head.appendChild(head_datetime);
            head.appendChild(head_name);

        container.appendChild(head);

        html.appendChild(actions);
        html.appendChild(container);

        return html;
    }



    //FORKING
    if (template === 'alarm') { html = alarmTemplate(data.alarm); }

    return html;
}
template(true, {});