var socket = null;            
        
function socket_open()
{
  socket = null;
    
  try
  {
    socket = new WebSocket("ws://" + location.host + ":8080");

    socket.onopen = function(event)
    {
      setTimeout(function()
      {
        socket.send(JSON.stringify({ command: 'subscribe', channel: 'smart32' }));
      }, 100);
    };

    socket.onclose = function(event)
    {
//        $('#socketindicator').removeClass('btn');
//        $('#socketicon').prop('title', evt.code);

        setTimeout(function() { socket_open(); }, 1000);
    };

    socket.onerror = function(event)
    {
//        $('#socketindicator').removeClass('btn');
//        $('#socketindicator').addClass('text-danger');
    };               
    
    socket.onmessage = function(event)
    {
        try
        {
          json = JSON.parse(event.data);
          console.log(json);
          switch(json.channel)
          {
              case 'smart32':
                  setTimeout(function()
                  { 
                      divreload("smart32");
                  }, 10);
                  break;
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
    //$('#socketindicator').hide();
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