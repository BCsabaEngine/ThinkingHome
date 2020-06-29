function pagereload(latencyms)
{
    if (latencyms === undefined)
        window.location.reload();
    else
        setTimeout(function() { pagereload(undefined); }, latencyms);
}

function divreload(element, onready)
{
    $('#' + element).load(window.location.href + ' #' + element + " > *", function()
    {
        if (onready)
            onready();
    });
}
