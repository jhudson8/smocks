var server = require('./standard-server');
var util = require('./util');

describe.only('standard tests', function () {
  beforeEach(function (done) {
    util.beforeEach(server, this, done);
  });
  afterEach(function (done) {
    util.afterEach.call(this, done);
  });

  it('should return counter', function (done) {
    this.evalRequests([
      {
        path: '/api/counter',
        expect: {"message":"default message","count":1}
      }, {
        path: '/api/counter',
        expect: {"message":"default message","count":2}
      },
    ], done);
  });

  it('should use variants', function (done) {
    this.evalRequests([
      {
        path: '/_admin/api/route/counter',
        method: 'POST',
        payload: {
          variant: 'hello_world'
        }
      }, {
        path: '/api/counter',
        expect: {"message":"hello world","count":1}
      }
    ], done);
  });
});
