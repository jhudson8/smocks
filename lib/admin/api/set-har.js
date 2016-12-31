var _ = require('lodash');
var fs = require('fs');
var formatData = require('./format-data');
var moment = require('moment')

module.exports = function (smocks) {
  var harOptions = smocks.options && smocks.options.har;

  return function (request, reply, respondWithConfig) {
    var data = request.payload;
    if (data.contents) {
      var contents = JSON.parse(data.contents);
      var fileName = data.fileName;
      var callData = extractCalls(contents, harOptions);
      var harIndex = -1;

      smocks.state.userState(request)['__har'] = {
        startIndex: 0,
        fileName: fileName,
        index: harIndex,
        calls: callData.calls,
        minTime: callData.minTime,
        maxTime: callData.maxTime
      };
    }

    reply(respondWithConfig ? formatData(smocks, request) : {});
  };
};

var urlMatch = /^[^:]*:?\/?\/?[^/]+([^\?]*)\??(.*)/;
function extractCalls(harContents, harOptions) {
  var minTime = -1;
  var maxTime = -1;

  var id = 1;
  var calls = _.compact(harContents.log.entries.map(function (data) {
    var type = data.response.content.mimeType;
    // we're only going to do html and json
    if (type === 'application/json') {
      try {
        var urlInfo = data.request.url.match(urlMatch);
        var startTime = Math.floor(moment.utc(data.startedDateTime).valueOf());
        if (minTime === -1 || minTime > startTime) {
          minTime = startTime;
        }
        var endTime = startTime + data.time;
        if (maxTime === -1 || maxTime < endTime) {
          maxTime = endTime;
        }

        var rtn = {
          id: id + '',
          type: type,
          time: Math.floor(data.time),
          startTime: startTime,
          method: data.request.method.toUpperCase(),
          path: harOptions && harOptions.pathMapper ? harOptions.pathMapper(urlInfo[1]) : urlInfo[1],
          queryString: data.request.queryString,
          response: {
            status: data.response.status,
            headers: data.response.headers,
            content: data.response.content
          }
        }
        id++;
        return rtn;
      } catch (e) {}
    }
  }));
  return {
    minTime: minTime,
    maxTime: maxTime,
    calls: calls
  }
}
