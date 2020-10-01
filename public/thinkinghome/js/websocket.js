var socket = null;

function socket_open() {
  socket = null;

  try {
    socket = new WebSocket("ws://" + location.host);

    socket.onopen = function (event) {
      if (typeof subscribes !== 'undefined')
        setTimeout(function () {
          for (const [key, value] of Object.entries(subscribes))
            socket.send(JSON.stringify({ command: 'subscribe', channel: key }));
        }, 100);
    };

    socket.onclose = function (event) { setTimeout(function () { socket_open(); }, 5000); };

    var timeout = null;
    socket.onmessage = function (event) {
      try {
        if (typeof dismisssubscribes !== 'undefined')
          if (dismisssubscribes)
            return;

        json = JSON.parse(event.data);
        if (typeof subscribes !== 'undefined')
          for (const [key, value] of Object.entries(subscribes))
            if (key == json.channel)
              if (typeof value === 'function') {
                delete json.channel;
                setTimeout(function () { value(json); }, 1);
              }
              else {
                clearTimeout(timeout);
                timeout = setTimeout(function () { divreload(value); }, 250);
              }
      }
      catch (ex) { console.log(ex); }
    };
  }
  catch (ex) { }
}

function socket_send(msg) {
  try {
    if (socket)
      if (socket.readyState == 1) {
        socket.send(msg);
        return true;
      }
  }
  catch (ex) { }

  return false;
}

$(function () { if ("WebSocket" in window) socket_open(); });
