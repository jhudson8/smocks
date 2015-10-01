var profiles = (localStorage && JSON.parse(localStorage.getItem('profiles') || '{}')) || {};
var api = {
  doPost: function(path, data, method, callback) {
    $.ajax({
      type: method || 'POST',
      url: '/_admin/api' + path,
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(data || {}),
      error: function() {
        alert('could not process your request');
      },
      success: function(_data) {
        if (data.successMessage) {
          var message = _.isFunction(data.successMessage) ? data.successMessage(_data) : data.successMessage;
          if (message) {
            alert(message);
          }
        }
        if (callback) {
          callback(_data);
        } else {
          resetConfig(_data);
        }
      }
    });
  },

  executeAction: function(action, config, route) {
    this.doPost('/action', {
      action: action.id,
      route: route && route.id,
      config: config,
      successMessage: function(data) {
        return data._actionResponse || 'the action was successful';
      }
    }, 'POST');
  },

  submitHar: function(filePath) {
    this.doPost('/har', {file: filePath});
  },

  selectVariant: function(routeId, variantId) {
    this.doPost('/route/' + encodeURIComponent(routeId) + '/variant/' + encodeURIComponent(variantId), {});
  },

  selectValue: function(routeId, type, id, value) {
    this.doPost('/route/' + encodeURIComponent(routeId) + '/config', {
      type: type,
      id: id,
      value: value
    });
  },

  globalConfigChange: function(pluginId, id, value) {
    this.doPost('/global/config/' + encodeURIComponent(pluginId), {
      id: id,
      value: value
    });
  },

  resetState: function() {
    this.doPost('/state/reset', {
      successMessage: function() {
        return 'The state has been reset';
      }
    });
  },

  resetConfig: function() {
    this.doPost('/config/reset', {
      successMessage: function() {
        return 'The route settings have been reset';
      }
    });
  },

  loadProfile: function(profile) {
    if (profile.type === 'remote') {
      this.doPost('/profile/' + encodeURIComponent(profile.name), {}, 'POST', function(data) {
        React.unmountComponentAtNode(document.body);
        resetConfig(data);
        alert('profile "' + profile.name + '" loaded');
      });
    } else {
      var _profile = this.getLocalProfile(profile.name);
      if (_profile) {
        this.doPost('/profile', _profile, 'POST', function(data) {
          React.unmountComponentAtNode(document.body);
          resetConfig(data);
          alert('profile "' + profile.name + '" loaded');
      });
      } else {
        alert('invalid profile');
      }
    }
  },

  getLocalProfileNames: function() {
    var rtn = [];
    _.each(profiles, function(profile, name) {
      rtn.push(name);
    });
    return rtn;
  },

  getLocalProfile: function(name) {
    return profiles[name];
  },

  saveLocalProfile: function(name) {
    profiles[name] = this.toProfileData();
    localStorage.setItem('profiles', JSON.stringify(profiles));
    alert('profile "' + name + '" was saved');
  },

  deleteLocalProfile: function(profile) {
    delete profiles[profile.name];
    localStorage.setItem('profiles', JSON.stringify(profiles));
    alert('profile "' + profile.name + '" was deleted');
  },

  toProfileData: function() {
    var toSave = {};
    _.each(data.routes, function(route) {
      toSave[route.id] = {
        activeVariant: route.activeVariant,
        selections: route.selections
      };
    });
    return toSave;
  }
};

function resetConfig(_data) {
  data = _data;
  React.render(React.createElement(AdminPage, { routes: data.routes }), document.body);
}



var CONFIG_TYPES = {};
_inputs(CONFIG_TYPES);


/*****************************************************
 * VIEW COMPONENTS
 ***/

 /**************************************************************************
 *  ROUTE STYLE CONTROLLER
 **************************************************************************/
var RouteStyleController = React.createClass({
  displayName: 'RouteStyleController',

  render: function () {
    var style = this.props.style;

    return (
      <div className="ui secondary pointing menu">
        <a className="item">
          Show fixtures by 
        </a>
        <a href="#" className={'item ' + (style === 'label' && 'active green')} onClick={this.changeStyle('label')}>
          Labels
        </a>
        <a href="#" className={'item ' + (style === 'path' && 'active green')} onClick={this.changeStyle('path')}>
          URL Paths
        </a>

        <div className="right menu">
          <div className="item">
            <div className="ui icon input">
              <input type="text" className="filter-input" placeholder="Filter..." onChange={this.onFilter} value={this.props.filterValue}/>
              <i className="search link icon"></i>
            </div>
          </div>
          <a className="ui item">
            <button type="button" className="ui primary button" onClick={this.props.onResetState}>
              Reset State
            </button>
          </a>
        </div>
      </div>
    );
  },

  onFilter: function (ev) {
    this.props.onFilter(ev.currentTarget.value);
  },

  changeStyle: function (type) {
    var self = this;
    return function (ev) {
      ev.preventDefault();
      self.props.onStyleChange(type);
    }
  }
});


/**************************************************************************
 *  TAB PANEL
 **************************************************************************/
var TabPanel = React.createClass({
  displayName: 'TabPanel',
  getInitialState: function () {
    return {index: 'standard'}
  },

  render: function () {
    var selected = this.props.selected;
    var tabs = this.props.tabs;

    return (
      <div>
        <div className="ui top attached tabular menu">
          {_.map(tabs, function (label, key) {
            return <button className={'item ' + (selected === key && 'active green')}>{label}</button>
          })}
        </div>
        <div style={{padding: '12px'}}>
          {this.props.children}
        </div>
      </div>
    );
  }
})


/**************************************************************************
 *  ROUTE LIST PANEL
 **************************************************************************/
var RouteListPanel = React.createClass({
  displayName: 'RouteListPanel',

  render: function () {
    var routeSpecific = false;
    var props = this.props;
    var filter = props.filter;
    var routes = props.routes;
    var viewType = props.viewType;
    var selectedRoute = props.selectedRoute;

    var match = filter.match(/(POST|GET|PUT|DELETE|PATCH) \"([^\"]+)\"/);
    if (match) {
      routeSpecific = {
        method: match[1],
        path: match[2]
      }
    }

    var _routes = _.compact(_.map(routes, function(route) {
      var valid = true;
      if (routeSpecific) {
        valid = route.method === routeSpecific.method && route.path === routeSpecific.path;
      } else {
        var filterContent = (route.label || '') + ' ' + route.path + ' ' + route.method;
        var filters = filter.split(' ');
        
        _.each(filters, function(filter) {
          if (valid && filter) {
            var match = new RegExp(filter, 'i');
            if (filter && !filterContent.match(match)) {
              valid = false;
            }
          }
        });
      }
      return valid && route;
    }));

    _routes.sort(function(routeA, routeB) {
      var compA, compB;
      if (viewType === 'label') {
        compA = routeA.label || (routeA.path + ':' + routeA.method);
        compB = routeB.label || (routeB.path + ':' + routeB.method);
      } else {
        compA = routeA.path + ':' + routeA.method;
        compB = routeB.path + ':' + routeB.method;
      }
      return (compA > compB) ? 1 : -1;
    });

    return (
      <div>
        {_.map(_routes, function(route) {
          return <Route key={route.id} route={route} selected={selectedRoute === route.id || _routes.length === 1}
            onSelect={this.props.onSelectRoute} onDeselect={this.props.onDeselectRoute} viewType={viewType}/>
          }, this)
        }
      </div>
    );
  }
});


/**************************************************************************
 *  ADMIN PAGE
 **************************************************************************/
var AdminPage = React.createClass({
  displayName: 'Config',

  getInitialState: function() {
    var hash = (window.location.hash || '').replace('#', '').split('/');
    return {
      filter: decodeURIComponent(hash[1] || ''),
      viewType: decodeURIComponent(hash[0] || 'label'),
      viewScope: 'fixtures',
      'profileState': _.uniqueId('profileState-')
    };
  },

  render: function() {
    var selectedRoute = this.state.selectedRoute;
    var selectedProfile = this.state.selectedProfile;
    var filter = this.state.filter;
    var viewType = this.state.viewType;
    var viewScope = this.state.viewScope;
    var actions;

    if (viewScope === 'har') {
      return (
        <div>
          <div className="info">
            <input className="route-filter form-control" onChange={this.onFilter} placeholder="Filter" defaultValue={filter}/>
            <form className="display-selector">
              Show using
              <DisplaySelectorChoice label="Label" selected={viewType === 'label'} onSelect={this.onLabelViewType}/>
              <DisplaySelectorChoice label="Path" selected={viewType === 'path'} onSelect={this.onPathViewType}/>
              <button type="button" className="btn btn-default reset-state" onClick={this.resetState}>Reset State</button>
            </form>
          </div>
          {nav}
          <HarTab/>
        </div>
      )
    }

    if (viewScope === 'config') {
      if (data.actions.length > 0) {
        actions = <Actions actions={data.actions}/>;
      }

      var globalConfig = _.map(data.globalConfig, function(config) {
        return <ConfigList key={config.id} data={config.config} values={data.globalConfigValues[config.id]}
          onChange={this.onPluginConfigChange(config.id)}/>
      }, this);

      return <div>
        <div className="info">
          <input className="route-filter form-control" onChange={this.onFilter} placeholder="Filter" defaultValue={filter}/>
          <form className="display-selector">
            Show using
            <DisplaySelectorChoice label="Label" selected={viewType === 'label'} onSelect={this.onLabelViewType}/>
            <DisplaySelectorChoice label="Path" selected={viewType === 'path'} onSelect={this.onPathViewType}/>
          </form>
          <button type="button" className="btn btn-default reset-state" onClick={this.resetState}>Reset State</button>
        </div>
        {nav}
        [<ProfileManager key={this.state.profileState} selected={selectedProfile} remoteConfigComplete={this.remoteProfileConfigComplete}
          onSelectProfile={this.onSelectProfile} onSaveProfile={this.onSaveProfile} onLoadProfile={this.onLoadProfile}
          onDeleteProfile={this.onDeleteProfile} onCancelProfileAction={this.onCancelProfileAction} remoteConfig={this.state.remoteConfig}
          ref={profiles}/>],
        {globalConfig}
        {actions}
      </div>
    }


    var body;
    if (viewScope === 'fixtures') {
      body = (
        <div>
          <RouteStyleController style={viewType} onStyleChange={this.onStyleChange} onFilter={this.onFilter} filterValue={filter}/>
          <div className="routes">
            <RouteListPanel routes={this.props.routes} filter={filter} viewType={viewType} selectedRoute={selectedRoute}
              onSelectRoute={this.onSelectRoute} onDeselectRoute={this.onDeselectRoute}/>
          </div>
        </div>
      );
    } else if (viewScope === 'config') {

    }

    return (
      <TabPanel tabs={{fixtures: 'Fixtures', config: 'Config'}} selected={viewScope}>
        {body}
      </TabPanel>
    );
  },

  onStyleChange: function (key) {
    this.setState({
      viewType: key
    });
  },

  onCancelProfileAction: function() {
    this.setState({
      profileState: _.uniqueId('profileState-')
    });
  },

  remoteProfileConfigComplete: function() {
    this.setState({
      remoteConfig: undefined,
      profileState: _.uniqueId('profileState-')
    });
  },

  onSelectProfile: function(profile) {
    this.setState({
      selectedProfile: profile
    });
  },

  onLoadProfile: function(profile) {
    api.loadProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onSaveProfile: function(profile) {
    if (profile.type === 'remote') {
      this.setState({remoteConfig: "smocks.profile(" + JSON.stringify(profile.name) + ", " + JSON.stringify(api.toProfileData()) + ");"});
    } else {
      api.saveLocalProfile(profile.name);
      this.forceUpdate();
    }
  },

  onDeleteProfile: function(profile) {
    api.deleteLocalProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onPluginConfigChange: function(pluginId) {
    return function(id, value) {
      api.globalConfigChange(pluginId, id, value);
    };
  },

  onLabelViewType: function() {
    var type = 'label';
    this.setState({
      viewType: type
    });
    this._updateHash(type, this.state.filter);
  },

  onPathViewType: function() {
    var type = 'path';
    this.setState({
      viewType: type
    });
    this._updateHash(type, this.state.filter);
  },

  onFilter: function(value) {
    this.setState({ filter: value });

    this._updateHash(this.state.viewType, value);
  },

  _updateHash: function(viewType, filter) {
    var hash = encodeURIComponent(viewType);
    if (filter) {
      hash = hash + '/' + encodeURIComponent(filter);
    }
    if (window.location.hash != hash) {
      window.location.hash = hash;
    }
  },

  onSelectRoute: function(route) {
    this.setState({
      selectedRoute: route.id
    });
  },

  onDeselectRoute: function(route) {
    if (route.id === this.state.selected) {
      this.setState({
        selected: undefined
      });
    }
  },

  resetState: function() {
    api.resetState();
  }
});


var HarTab = React.createClass({
  displayName: 'HarTab',

  render: function() {
    return (
      <div>
        <form className="har-form">
          <div className="info">
            <label className="har-form-label">.har file path (local filesystem)</label>
            <input type="text" name="file" ref="file"/>
            <button type="button" className="btn btn-primary" onClick={this.submitHar}>Submit</button>
          </div>
        </form>
        <HarDetails details={data.har}/>
      </div>
    );
  },

  submitHar: function () {
    var file = this.refs.file.getDOMNode().value;
    if (file) {
      api.submitHar(file);
    } else {
      alert('you must select a file');
    }
  }
})

var HarDetails = React.createClass({
  displayName: 'HarDetails',

  render: function () {
    var details = this.props.details;
    if (!details) {
      return React.DOM.div({});
    }

    var i = 0;
    return (
      <div className="har-details">
        <div className="har-details-file">
          <label>File name: {details.file}</label>
          <div className="har-details-body">
            {details.calls.map(function (call) {
              if (call.responded) {
                return <div key={i++} className="har-details-item responded">
                  {call.path}
                </div>
              } else {
                return <div key={i++} className="har-details-item waiting">
                  <a key={i++} className={'har-details-item ' + (call.responded ? 'responded' : 'waiting')} target="_blank" href={call.path}>
                    {call.path}
                  </a>
                </div>
              }
            })}
          </div>
        </div>
      </div>
    )
  } 
});


var Actions = React.createClass({
  displayName: 'Actions',

  getInitialState: function() {
    return {};
  },

  render: function() {
    var self = this;
    var pendingAction = this.state.pendingAction;
    var pendingActionDetails;
    var route = this.props.route;

    var actions = !pendingAction && _.map(this.props.actions, function(action) {
      var onClick = function() {
        var hasConfig = false;
        var pendingActionValues = {};
        _.each(action.config, function(data, id) {
          hasConfig = true;
          pendingActionValues[id] = data.defaultValue;
        });
        if (hasConfig) {
          self.setState({
            pendingAction: action,
            pendingActionValues: pendingActionValues
          });
        } else {
          // just execute the action
          api.executeAction(action, pendingActionValues, route);
        }
      };

      return <button key={action.id} type="button" className="ui fluid green button" onClick={onClick}>{action.label || action.id}</button>
    }, this);

    if (pendingAction) {
      var pendingActionLabel = pendingAction.label || pendingAction.id;
      var values = {};
      _.each(pendingAction.config, function(data, id) {
        values[id] = data.defaultValue;
      });
      pendingActionDetails = (
        <div className="pending-action-details">
          <div className="pending-action-message">
            <h5>{pendingActionLabel}</h5>
            <div className="ui form">
              <ConfigList data={pendingAction.config} values={values} onChange={this.onConfigChange}/>
              <div className="pending-action-actions">
                <button type="button" className="ui default green button" onClick={this.executeAction}>Execute</button>
                <button type="button" className="ui red button" onClick={this.cancelAction}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return React.DOM.div({className: 'actions'},
      actions,
      pendingActionDetails
    );
  },

  onConfigChange: function(id, value) {
    this.state.pendingActionValues[id] = value;
  },

  executeAction: function() {
    var action = this.state.pendingAction;
    if (this.state.pendingAction) {
      api.executeAction(this.state.pendingAction, this.state.pendingActionValues, this.props.route);
      this.setState({
        pendingAction: undefined,
        pendingActionValues: undefined
      });
    }
  },

  cancelAction: function() {
    this.setState({
      pendingAction: undefined,
      pendingActionValues: undefined
    });
  }
});


var routeColors = {
  GET: 'yellow',
  POST: 'blue',
  DELETE: 'red',
  PATCH: 'brown',
  PUT: 'violet'
};
var Route = React.createClass({
  displayName: 'Route',

  getInitialState: function() {
    return {
      selected: this.findActive()
    };
  },

  render: function() {
    var route = this.props.route,
        activeVariant = this.findActive(),
        title = this.props.viewType === 'label' ? (route.label || route.path) : route.path,
        actions, display;
    var messageColor = routeColors[route.method];
    var numConfigEntries = countProperties(route.config) + countProperties(activeVariant.config);

    if (route.display) {
      var converter = new showdown.Converter();
      display = React.DOM.div({className: 'route-display info', dangerouslySetInnerHTML: {__html: converter.makeHtml(route.display)}});
    }

    if (route.actions.length > 0) {
      actions = React.createElement(Actions, { actions: route.actions, route: route });
    }

    if (this.props.selected) {
      var variants = _.map(route.variants, function(variant) {
        return <Variant key={variant.id} variant={variant} selected={variant.id === activeVariant.id} onSelect={this.selectVariant}/>;
      }, this);

      var isLabelType = this.props.viewType === 'label';
      var endpointLabel = isLabelType ? React.DOM.div({className: 'route-label'}, 'Path') : undefined;

      return (
        <div className={'ui ' + messageColor + ' message route-description'}>
          <a className={'ui ' + messageColor + ' right ribbon label'}>{route.method}</a>
          <h3 onClick={this.onDeselect}>{title}</h3>
          <a alt="permalink" className="ui icon permalink primary button" target="_blank" href={'#' + this.props.viewType + '/' + route.method + '%20' + encodeURIComponent('"' + route.path + '"')}>
            <i className="bookmark icon"></i>
          </a>
          <button type="button" className="ui icon view-endpoint primary button" onClick={this.viewEndpoint}>
            <i className="unhide icon"></i>
          </button>

          <div className="route-description-body">

            <div className="ui stackable grid">

              <div className="ten wide column">
                <h5>Fixture Details</h5>
                <div className="ui form">
                  {!isLabelType && (
                    <div>
                      <div className="inline field">
                        <label>Fixture Id</label>
                        {route.id}
                      </div>
                      <div className="inline field">
                        <label>Active Variant Id</label>
                        {activeVariant.id}
                      </div>
                    </div>
                  )}
                  {isLabelType && (
                    <div className="inline field">
                      <label>Path</label>
                      {route.path}
                    </div>
                  )}
                </div>

                <h5>Response Handling</h5>
                <div className="variants">
                  {variants}
                </div>

                {display && (
                  <div className="route-specific-details">
                    <h5>Fixture specific details</h5>
                    {display}
                  </div>
                )}
              </div>

              <div className="six wide column">
                <h5>Configuration</h5>
                {!numConfigEntries && 'No configuration entries are available'}
                <ConfigList data={route.config} values={route.selections && route.selections.route || {}} onChange={this.onChange('route')}/>
                <ConfigList data={activeVariant.config} values={route.selections && route.selections.variants && route.selections.variants[activeVariant.id]}
                  onChange={this.onChange('variant')}/>

                <h5>Actions</h5>
                {!route.actions.length && 'No actions are available'}
                {actions}
              </div>

            </div>
          </div>
        </div>
      );
    } else {

      return (
        <div onClick={this.onSelect} className={'ui ' + messageColor + ' message closed route-description'}>
          <a className={'ui ' + messageColor + ' right ribbon label'}>{route.method}</a>
          <h3>{title}</h3>
        </div>
      );
    }
  },

  viewEndpoint: function(ev) {
    ev.preventDefault();
    var path = this.props.route.path.replace(/\{[^\}]+}/g, function(val) {
      val = val.substring(1, val.length-1);
      var response = prompt('Enter the value for "' + val + '"');
      return response || val;
    });
    window.open(path, path);
  },

  onDeselect: function() {
    this.props.onDeselect(this.props.route);
  },

  onSelect: function() {
    this.props.onSelect(this.props.route);
  },

  onChange: function(type) {
    var route = this.props.route;
    return function(id, value) {
      api.selectValue(route.id, type, id, value);
    };
  },

  findActive: function() {
    var id = this.props.route.activeVariant;

    var match = _.find(this.props.route.variants, function(variant) {
      return variant.id === id;
    });
    if (!match) {
      match = _.find(data.variants, function(variant) {
        return variant.id === id;
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
    var label = variant.label || variant.id;
    var selected = this.props.selected;
    var className = selected ? 'btn btn-primary active' : 'btn btn-secondary';

    return (
      <button type="button" className={'ui button ' + (selected ? 'primary' : 'basic blue')} onClick={this.onClick}>
        {label}
      </button>
    );
  },

  onClick: function() {
    this.props.onSelect(this.props.variant.id);
  }
});


var ConfigItemWrapper = React.createClass({
  displayName: 'ConfigItemWrapper',

  render: function() {
    return <div className={'field ' + (this.props.className || '')}>
      <label htmlFor={this.props.id}>{this.props.label || this.props.id}</label>
      {this.props.children}
    </div>
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
        return <UndefinedConfig ref={id} id={id} type={data.type}/>
      }
      data = _.clone(data);
      var value = values && values[id];
      if (_.isUndefined(value)) {
        value = data.defaultValue;
      }
      data.value = value;
      data.key = id;
      data.ref = id;
      data.onChange = function(value) {
        self.props.onChange(id, value);
      };
      return <Config {...data}/>
    });
    return <form className="ui form">{children}</form>;
  }
});

var DisplaySelectorChoice = React.createClass({
  displayName: 'DisplaySelectorChoice',

  getInitialState: function() {
    return {
      id: _.uniqueId('form')
    };
  },

  render: function() {
    return <span className="display-selector-choice">
      <input id={this.state.id} type="radio" checked={this.props.selected} onChange={this.props.onSelect}/>
      <label htmlFor={this.state.id}>{this.props.label}</label>
    </span>;
  }
});

var ProfileManager = React.createClass({
  displayName: 'ProfileManager',

  render: function() {
    var chooseProfile;
    var selected = this.props.selected;
    var remoteConfig;

    var localProfiles = api.getLocalProfileNames();
    if (!_.isEmpty(data.profiles) || !_.isEmpty(localProfiles)) {
      var choices = [React.DOM.option({key: '_blank', value: ''}, 'select profile')];
      _.each(localProfiles, function(name) {
        choices.push(React.DOM.option({key:'local:' + name, value: 'local:' + name}, name));
      });
      _.each(data.profiles, function(name) {
        choices.push(React.DOM.option({key:'remote:' + name, value: 'remote:' + name}, name));
      });

      var loadProfile = selected && React.DOM.button({type: 'button', className: 'btn btn-default',
        onClick: this.loadProfile}, 'Apply');
      var deleteProfile = selected && selected.type === 'local' && React.DOM.button({type: 'button', className: 'btn btn-default',
        onClick: this.deleteProfile}, 'Delete');
      var cancelProfile = selected && React.DOM.button({type: 'button', className: 'btn btn-default',
        onClick: this.cancelProfileAction}, 'Cancel');

      chooseProfile = React.DOM.div({className: 'profile-part'},
        'Load/delete profile ',
        React.DOM.select({ref: 'select', className: 'profile-selector form-control', onChange: this.selectProfile}, choices),
        loadProfile,
        deleteProfile,
        cancelProfile
      );
    }

    if (this.props.remoteConfig) {
      remoteConfig = React.DOM.div({className: 'profile-remote-config'},
        React.DOM.div({className: 'profile-remote-config-info'}, 'Copy and paste the content to your smocks setup code to save the profile'),
        React.DOM.textarea({className: 'profile-remote-content form-control', value: this.props.remoteConfig, readOnly: true}),
        React.DOM.div({className: 'profile-remote-config-actions'}, 
          React.DOM.button({type: 'button', className: 'btn btn-default', onClick: this.remoteConfigComplete}, "I'm done")
        )
      );
    }

    return React.DOM.div({className: 'profile-manager info'},
      React.DOM.button({type: 'button', className: 'btn btn-default reset-config', onClick: this.resetConfig}, 'Reset Configuration'),
      chooseProfile,
      React.DOM.div({className: 'profile-part'},
        (chooseProfile ? 'or ' : '') + 'save current settings as ',
        React.DOM.input({ref: 'profileName', className: 'form-control profile-name', onChange: this.setProfile, placeholder: 'Profile Name'}),
        React.DOM.button({type: 'button', className: 'btn btn-default', onClick: this.saveProfile('local')}, 'for me'),
        React.DOM.button({type: 'button', className: 'btn btn-default', onClick: this.saveProfile('remote')}, 'for everyone')
      ),
      remoteConfig
    );
  },

  resetConfig: function() {
    api.resetConfig();
  },

  remoteConfigComplete: function() {
    this.props.remoteConfigComplete();
    this.refs.profileName.getDOMNode().value = '';
  },

  reset: function() {
    this.refs.select.getDOMNode().selectedIndex = 0;
  },

  selectProfile: function(ev) {
    var profile = ev.currentTarget.value;
    var match  = profile.match(/^([^:]*):(.*)$/);

    this.props.onSelectProfile({
      type: match[1],
      name: match[2]
    });
  },

  cancelProfileAction: function(ev) {
    this.props.onCancelProfileAction();
  },

  loadProfile: function(ev) {
    this.props.onLoadProfile(this.props.selected);
  },

  deleteProfile: function(ev) {
    this.props.onDeleteProfile(this.props.selected);
  },

  saveProfile: function(type) {
    var self = this;
    return function() {
      var profileName = self.refs.profileName.getDOMNode().value;
      if (!profileName) {
        return alert('You must enter a profile name');
      }

      self.refs.profileName.getDOMNode().value = '';
      self.props.onSaveProfile({
        type: type,
        name: profileName
      });
    };
  }
});

function countProperties(obj) {
  var rtn = 0;
  _.each(obj, function () {
    rtn++;
  });
  return rtn;
}

React.render(React.createElement(AdminPage, { routes: data.routes }), document.body);
