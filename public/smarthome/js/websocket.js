var socket = null;            
        
function socket_open()
{
  socket = null;
    
  try
  {
    socket = new WebSocket("ws://" + location.host);

    socket.onopen = function(event)
    {
      if (typeof subscribes !== 'undefined')
        setTimeout(function()
        {
          for (const [key, value] of Object.entries(subscribes))
            socket.send(JSON.stringify({ command: 'subscribe', channel: key }));
        }, 100);
    };

    socket.onclose = function(event)
    {
        setTimeout(function() { socket_open(); }, 1000);
    };

    var timeout = null;
    socket.onmessage = function(event)
    {
        try
        {
          json = JSON.parse(event.data);
          if (typeof subscribes !== 'undefined')
            for (const [key, value] of Object.entries(subscribes))
              if (key == json.channel)
              {
                clearTimeout(timeout);
                timeout = setTimeout(function()
                {
                  if (typeof value === 'function')
                    value(key);
                  else
                    divreload(value);
                }, 100);
              }
        }
        catch(ex)
        {
          console.log(ex);
        }
    };
  }
  catch(ex)
  {
  }
}

function socket_send(msg)
{
  try
  {
    if (socket)
      if (socket.readyState == 1)
      {
        socket.send(msg);
        return true;
      }
  }
  catch(ex){ }

  return false;
}

$(document).ready(function()
{
  if ("WebSocket" in window)
  {
    socket_open();
  }
});