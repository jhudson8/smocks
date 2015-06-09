var fs = require('fs');
var _ = require('lodash');
var formatData  = require('./api/format-data');

module.exports = function(mocker) {

  return function(request, reply) {
    fs.readFile('./lib/admin/config-page.html', {encoding: 'utf8'}, function(err, html) {
      if (err) {
        console.error(err);
        reply(err);
      } else {
        var data = JSON.stringify(formatData(mocker));
        html = html.replace('{data}', data);
        reply(html);
      }
    });
  };
};


