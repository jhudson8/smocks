module.exports = {
  /*jshint multistr: true */
  ui: 'React.createClass({\n\
    displayName: "Select",\n\
\n\
    render: function() {\n\
      var options = _.map(this.props.options, function(data) {\n\
        var label = value;\n\
        var value = data;\n\
        if (typeof data !== "string") {\n\
          label = data.label;\n\
          value = data.value;\n\
        }\n\
        return React.DOM.option({ key: label, value: value }, label);\n\
      }, this);\n\
\n\
      return React.createElement(ConfigItemWrapper, { id: this.props.id, label: this.props.label, className: "config-select" },\n\
        React.DOM.select({ id: this.props.id, className: "form-control", name: this.props.id, defaultValue: this.props.value,\n\
          onChange: this.onChange }, options)\n\
      );\n\
    },\n\
\n\
    onChange: function(ev) {\n\
      var el = ev.currentTarget;\n\
      this.props.onChange(el.options[el.selectedIndex].value);\n\
    }\n\
  });'
};
