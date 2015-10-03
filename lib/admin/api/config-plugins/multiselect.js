module.exports = {
  /*jshint multistr: true */
  ui: '(function() {\n\
    var Multiselect = React.createClass({\n\
      displayName: "MultiSelect",\n\
\n\
      getDefaultProps: function() {\n\
        return { value: [] };\n\
      },\n\
\n\
      render: function() {\n\
        var selections = _.map(this.props.options, function(option) {\n\
          var label = option;\n\
          var value = option;\n\
          if (typeof option !== "string") {\n\
            label = option.label;\n\
            value = option.value;\n\
          }\n\
          var selected = (this.props.value || []).indexOf(value) >= 0;\n\
          return React.createElement(ConfigMultiSelectOption, { key: value, value: value, label: label, defaultChecked: selected,\n\
            onChange: this.onChange });\n\
        }, this);\n\
\n\
        return React.createElement(ConfigItemWrapper, { label: this.props.label, className: "config-multiselect" },\n\
          React.DOM.div({ className: "multiselect-list" }, selections)\n\
        );\n\
      },\n\
\n\
      onChange: function(id, checked) {\n\
        var values = this.props.value;\n\
        var index = values.indexOf(id);\n\
        if (checked && index === -1) {\n\
          values.push(id);\n\
        } else if (!checked && index >= 0) {\n\
          values.splice(index, 1);\n\
        }\n\
        this.props.onChange(values);\n\
      }\n\
    });\n\
\n\
    var ConfigMultiSelectOption = React.createClass({\n\
      displayName: "MultiSelectOption",\n\
\n\
      render: function() {\n\
        var id = this.props.value.replace ? this.props.value.replace(/\\s+/g, "_") : (this.props.value + "");\n\
        return React.DOM.div({ className: "field multiselect-option" },\n\
          React.DOM.div({ className: "ui checkbox" },\n\
            React.DOM.label({ htmlFor: id }, this.props.label),\n\
            React.DOM.input({ id: id, type: "checkbox", className: "ui checkbox", defaultChecked: this.props.defaultChecked,\n\
              value: this.props.value, onChange: this.onChange }\n\
            )\n\
          )\n\
        )\n\
      },\n\
\n\
      onChange: function(ev) {\n\
        this.props.onChange(this.props.value, ev.currentTarget.checked);\n\
      }\n\
    });\n\
    return Multiselect;\n\
  })();'
};
