/*
 *
 */
function menuChange (e, i) {

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
    toPageLi.setAttribute('class', 'active');
}


/*
 *
*/
function volume_change () {
    var val = this.value;

    if (val == '') {
        this.value = 0;
    }
    else if (!parseInt(val)) {
        this.className = 'error';
    }

    else if (parseInt(val) > 100) {
        this.value = 100;
    }
    else {
        this.className = '';
    }
}


/*
 *
 */
function toggle_sound () {
    var state = this.getAttribute('state');

    //play song
    if ( state === 'stop' ) {
        this.style.background = "url(img/stop128.png)";
        this.style.backgroundSize = "contain";
        this.setAttribute('state', 'play');


    }
    //stop song
    else {
        this.style.background = "url(img/play128.png)";
        this.style.backgroundSize = "contain";
        this.setAttribute('state', 'stop');


    }
}



/*
 *
 */
document.addEventListener("DOMContentLoaded", function(e) {

    //add select drop-down
    //TODO: preselected alarm sound pulled out of options needs to be selected!
    var el = document.getElementById('song-list').getElementsByTagName('select')[0];
    new SelectFx(el);

     // Initialize pages, only one should be shown
    document.getElementById('options').style.display = 'block';
    document.getElementById('about').style.display = 'none';

    //add page change on navigation
    var anchors =  document.getElementById('nav').getElementsByTagName('a');
    for (var i = 0; i < anchors.length; i++) {
        anchors[i].addEventListener('click', menuChange);
    }


    //LOAD options



    //EVENTS
    document.getElementById('alarm-volume').addEventListener('input', volume_change);
    document.getElementsByClassName('toggle-sound')[0].addEventListener('click', toggle_sound)

});