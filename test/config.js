var smock = require('../lib');

smock.route('/api/foo')
  .config({
    aBooleanField: {
      label: 'Is this a checkbox?',
      type: 'boolean',
      defaultValue: true
    },
    someTextField: {
      label: 'A text field',
      type: 'text',
      defaultValue: 'Hello'
    },
    someSelectBox: {
      label: 'A select box',
      type: 'select',
      options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],
      defaultValue: 2
    },
    someMultiSelect: {
      label: 'A check list',
      type: 'multiselect',
      options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],
      defaultValue: [2, 3]
    },
  })

  .variant('default').onRequest(function(request, reply) {
    var aBooleanField = this.config('aBooleanField'); // boolean
    var someTextField = this.config('someTextField'); // string
    var someSelectBox = this.config('someSelectBox'); // integer (because the values are integers)
    var someMultiSelect = this.config('someMultiSelect'); // array of integer (because the values are integers)
    // ...
  })
  .variant('scenario1').onRequest(function(request, reply) {
    // ...
    
  })
  .variant('scenario2').onRequest(function(request, reply) {
    // ...
  })


.start({
    host: 'localhost',
    port: 8000
});
