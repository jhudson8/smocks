var smocks = require('./index');

smocks.plugin({
  onRequest: function(request, reply, next) {
    var harData = this.state('__har');
    if (!harData) {
      return next();
    }

    var harIndex = harData.index;
    var calls = harData.calls;
  
    // see if we can find a call math *after the current index*
    var path = request.path;
    var available = false;
    for (var i=harIndex+1; i<calls.length; i++) {
      var call = calls[i];
      available = available || !call.responded;
      if (!call.responded && call.path === path) {
        // we've got a match
        forceReply(reply, calls[i]);
        harIndex = i;
        return;
      }
    }

    if (!available) {
      this.state('__har', undefined);
    }

    next();
  }
});

function forceReply(reply, data) {
  data.responded = true;
  setTimeout(function() {
    reply(data.response.content.text).code(data.response.status).type(data.type);
  }, data.time);
}
