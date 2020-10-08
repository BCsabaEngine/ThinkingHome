var starttime = new Date().getTime();
function logdebug(...data) {
    var log = [(new Date().getTime() - starttime) / 1000];
    for (const d of data)
        if (typeof d === 'object')
            log = log.concat(Object.values(d));
        else
            log = log.concat(d);
    console.log(log);
}

function pagereload(latencyms) {
    if (latencyms === undefined)
        window.location.reload();
    else
        setTimeout(function () { pagereload(undefined); }, latencyms);
}

function divreload(element, onready, latencyms) {
    if (latencyms === undefined)
        $('#' + element).load(window.location.href + ' #' + element + " > *", function () {
            if (onready)
                onready();
        });
    else
        setTimeout(function () { divreload(element, onready, undefined); }, latencyms);
}

function showconfirmdialog(message, operation, onclick) {
    Swal.fire({
        title: 'Are you sure?',
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'red',
        confirmButtonText: operation,
    })
        .then((result) => { if (result.value) onclick(result.value) });
}

function showconfirmdeletedialog(message, onclick) {
    showconfirmdialog(message, "Delete", onclick);
}

var elem = document.documentElement;

function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}