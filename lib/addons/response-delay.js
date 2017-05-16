module.exports = function (options, smocks) {
  options = options || {};

  smocks.plugin({
    id: 'response-delay',
    input: {
      delay_milis: {
        label: 'Add delay to all responses',
        type: 'select',
        options: [{label: 'no delay', value: 0}, {label: '.5 sec', value: 500}, {label: '1 sec', value: 1000},
          {label: '2 sec', value: 2000}, {label: '5 sec', value: 5000}, {label: '10 sec', value: 10000}],
        defaultValue: options.defaultValue || 0
      }
    },
    onRequest: function (request, reply, server, next) {
      var delay = this.input('delay_milis');
      if (delay > 0) {
        setTimeout(next, delay);
      } else {
        next();
      }
    }
  });

  return smocks;
}
