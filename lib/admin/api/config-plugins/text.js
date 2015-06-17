module.exports = {
  /*jshint multistr: true */
  ui: 'React.createClass({\n\
    displayName: "Textbox",\n\
\n\
    getInitialState: function() {\n\
      return {\n\
        onChange: _.debounce(function(value, onChange) {\n\
          onChange(value);\n\
        }, 1000)\n\
      };\n\
    },\n\
\n\
    render: function() {\n\
      return React.createElement(ConfigItemWrapper, { id: this.props.id, label: this.props.label, className: "config-text" },\n\
        React.DOM.input({ ref: "input", id: this.props.id, className: "form-control", type: "text", name: this.props.id,\n\
          defaultValue: this.props.value, onChange: this.onChange })\n\
      );\n\
    },\n\
\n\
    onChange: function(ev) {\n\
      var value = this.refs.input.getDOMNode().value;\n\
      if (this.props.value !== value) {\n\
        this.state.onChange(value, this.props.onChange);\n\
      }\n\
    }\n\
  });'
};
