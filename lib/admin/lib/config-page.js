var api = {
  doPost: function(path, data) {
    $.ajax({
      type: 'POST',
      url: '/_admin/api' + path,
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(data),
      error: function() {
        alert('could not process your request');
      },
      success: resetConfig
    });
  },

  selectVariant: function(routeId, variantId) {
    this.doPost('/route/' + routeId + '/variant', {
      variant: variantId
    });
  },

  selectValue: function(routeId, type, id, value) {
    this.doPost('/route/' + routeId + '/config', {
      type: type,
      id: id,
      value: value
    });
  }
};

function resetConfig(_data) {
  data = _data;
  React.render(React.createElement(AdminPage, { routes: data.routes }), document.body);
}


/***
 * CONFIG INPUT TYPES
 ***/
var ConfigCheckbox = React.createClass({
  displayName: 'Checkbox',

  render: function() {
    return React.createElement(ConfigItemWrapper, { id: this.props.id, label: this.props.label, className: 'config-checkbox' },
      React.DOM.input({ id: this.props.id, type: 'checkbox', name: this.props.id, defaultChecked: this.props.value, onChange: this.onChange })
    );
  },

  onChange: function(ev) {
    this.props.onChange(ev.currentTarget.checked);
  }
});

var ConfigTextbox = React.createClass({
  displayName: 'Textbox',

  render: function() {
    return React.createElement(ConfigItemWrapper, { id: this.props.id, label: this.props.label, className: 'config-text' },
      React.DOM.input({ ref: 'input', id: this.props.id, className: 'form-control', type: 'text', name: this.props.id, defaultValue: this.props.value, onBlur: this.onBlur })
    );
  },

  onBlur: function(ev) {
    var value = this.refs.input.getDOMNode().value;
    if (this.props.value !== value) {
      this.props.onChange(value);
    }
  }
});

var ConfigSelect = React.createClass({
  displayName: 'Select',

  render: function() {
    var options = _.map(this.props.options, function(data) {
      var label = value;
      var value = data;
      if (typeof data !== 'string') {
        label = data.label;
        value = data.value;
      }
      return React.DOM.option({ key: value, value: value }, label);
    }, this);

    return React.createElement(ConfigItemWrapper, { id: this.props.id, label: this.props.label, className: 'config-select' },
      React.DOM.select({ id: this.props.id, className: 'form-control', name: this.props.id, defaultValue: this.props.value, onChange: this.onChange }, options)
    );
  },

  onChange: function(ev) {
    var el = ev.currentTarget;
    this.props.onChange(el.options[el.selectedIndex].value);
  }
});

var ConfigMultiSelect = React.createClass({
  displayName: 'MultiSelect',

  getDefaultProps: function() {
    return { value: [] };
  },

  render: function() {
    var selections = _.map(this.props.options, function(option) {
      var label = option;
      var value = option;
      if (typeof option !== 'string') {
        label = option.label;
        value = option.value;
      }
      var selected = this.props.value.indexOf(value) >= 0;
      return React.createElement(ConfigMultiSelectOption, { key: value, value: value, label: label, defaultChecked: selected, onChange: this.onChange });
    }, this);

    return React.createElement(ConfigItemWrapper, { label: this.props.label, className: 'config-multiselect' },
      React.DOM.ul({ className: 'multiselect-list' }, selections)
    );
  },

  onChange: function(id, checked) {
    var values = this.props.value;
    var index = values.indexOf(id);
    if (checked && index === -1) {
      values.push(id);
    } else if (!checked && index >= 0) {
      values.splice(index, 1);
    }
    this.props.onChange(values);
  }
});

var ConfigMultiSelectOption = React.createClass({
  displayName: 'MultiSelectOption',

  render: function() {
    var id = this.props.value.replace ? this.props.value.replace(/\s+/g, '_') : (this.props.value + '');
    return React.DOM.li({ className: 'multiselect-option' },
      React.DOM.input({ id: id, type: 'checkbox', defaultChecked: this.props.defaultChecked, value: this.props.value, onChange: this.onChange }),
      React.DOM.label({ htmlFor: id }, this.props.label)
    );
  },

  onChange: function(ev) {
    this.props.onChange(this.props.value, ev.currentTarget.checked);
  }
});

var CONFIG_TYPES = {
  text: ConfigTextbox,
  'boolean': ConfigCheckbox,
  select: ConfigSelect,
  multiselect: ConfigMultiSelect
};


/***
 * VIEW COMPONENTS
 ***/
var AdminPage = React.createClass({
  displayName: 'Config',

  getInitialState: function() {
    return {};
  },

  render: function() {
    var selected = this.state.selected;

    var _routes = _.map(this.props.routes, function(route) {
      return React.createElement(Route, { key: route.id, route: route, selected: selected === route.id, onSelect: this.onSelect });
    }, this);
    return React.DOM.div({}, _routes);
  },

  onSelect: function(route) {
    this.setState({
      selected: route.id
    });
  }
});


var Route = React.createClass({
  displayName: 'Route',

  getInitialState: function() {
    return {
      selected: this.findSelected()
    };
  },

  render: function() {
    var route = this.props.route,
        selectedVariant = this.findSelected();

    if (this.props.selected) {
      var variants = _.map(route.variants, function(variant) {
        return React.createElement(Variant, { key: variant.id, variant: variant,
          selected: variant.routeSpecificId === selectedVariant.routeSpecificId, onSelect: this.selectVariant });
      }, this);
      var globalVariants = _.map(data.variants, function(variant) {
        return React.createElement(Variant, { key: variant.id, variant: variant,
          selected: variant.routeSpecificId === selectedVariant.routeSpecificId, onSelect: this.selectVariant, type: 'global' });
      }, this);

      return React.DOM.div({className: 'route route-active'},
        React.DOM.h3({}, '(' + route.method + ') ' + route.path),
        React.DOM.div({ className: 'variants' }, variants),
        React.DOM.div({ className: 'variants' }, globalVariants),
        React.createElement(ConfigList, { data: route.config, values: route.selections.self, onChange: this.onChange('route') }),
        React.createElement(ConfigList, { data: selectedVariant.config, values: route.selections.variants[selectedVariant.id],
            onChange: this.onChange('variant') })
      ); // div
    } else {
      return React.DOM.div({className: 'route route-passive'},
        React.DOM.h3({ onClick: this.onClick }, '(' + route.method + ') ' + route.path, React.DOM.small({}, '(' + selectedVariant.id + ')'))
      );
    }
  },

  onClick: function() {
    this.props.onSelect(this.props.route);
  },

  onChange: function(type) {
    var route = this.props.route;
    return function(id, value) {
      api.selectValue(route.id, type, id, value);
    };
  },

  findSelected: function() {
    var id = this.props.route.activeVariant;

    var match = _.find(this.props.route.variants, function(variant) {
      return variant.routeSpecificId === id;
    });
    if (!match) {
      match = _.find(data.variants, function(variant) {
        return variant.routeSpecificId === id;
      });
    }
    return match;
  },

  selectVariant: function(id) {
    var route = this.props.route;
    route.activeVariant = id;

    api.selectVariant(route.id, id);
    this.forceUpdate();
  }
});


var Variant = React.createClass({
  displayName: 'Variant',

  getInitialState: function() {
    return { id: _.uniqueId('variant') };
  },

  render: function() {
    var id = this.state.id;
    var variant = this.props.variant;
    var selected = this.props.selected;
    var className = selected ? 'btn btn-primary active' : 'btn btn-default';

    return React.DOM.li({ className: 'variant' },
      React.DOM.input({ id: id, type: 'button', value: variant.id, className: className, onClick: this.onChange })
    ); // li
  },

  onChange: function() {
    this.props.onSelect(this.props.variant.routeSpecificId);
  }
});


var ConfigItemWrapper = React.createClass({
  displayName: 'ConfigItemWrapper',

  render: function() {
    return React.DOM.div({className: 'form-group ' + (this.props.className || '')},
      React.DOM.label({htmlFor: this.props.id}, this.props.label || this.props.id),
      this.props.children
    ); // div.config-item
  }
});


var UndefinedConfig = React.createClass({
  render: function() {
    return React.DOM.div({}, 'Undefined config type ' + this.props.type + ' for ' + this.props.id);
  }
});


var ConfigList = React.createClass({
  displayName: 'ConfigList',

  render: function() {
    var self = this;
    var configData = this.props.data;
    var values = this.props.values;

    var children = _.map(configData, function(data, id) {
      var Config = CONFIG_TYPES[data.type];
      if (!Config) {
        return React.createElement(UndefinedConfig, { ref: id, id: id, type: data.type });
      }
      data = _.clone(data);
      data.value = values[data.id];
      data.key = data.id;
      data.ref = data.id;
      data.onChange = function(value) {
        self.props.onChange(id, value);
      };
      return React.createElement(Config, data);
    });
    return React.DOM.form({className: 'config-list'}, children);
  }
});


React.render(React.createElement(AdminPage, { routes: data.routes }), document.body);
