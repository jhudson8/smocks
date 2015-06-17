module.exports = {
  /*jshint multistr: true */
  ui: 'React.createClass({\n\
      displayName: "Checkbox",\n\
  \n\
    render: function() {\n\
      return React.createElement(ConfigItemWrapper, {\n\
        id: this.props.id, label: this.props.label, className: "config-checkbox" },\n\
        React.DOM.input({ id: this.props.id, type: "checkbox", name: this.props.id, defaultChecked: this.props.value,\n\
          onChange: this.onChange })\n\
      );\n\
    },\n\
  \n\
    onChange: function(ev) {\n\
      this.props.onChange(ev.currentTarget.checked);\n\
    }\n\
  });'
};
