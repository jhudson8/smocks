var markdownConverter = new showdown.Converter();
var profileDomain = 'profiles-' + encodeURIComponent(data.id);
var profiles = (localStorage && JSON.parse(localStorage.getItem(profileDomain) || '{}')) || {};
var TABS = {
  fixtures: {
    label: 'Routes',
    tooltip: 'Control your routes configurations <ul><li>set active variant</li><li>set route and variant input values</li><li>execute route specific actions</li></ul>'
  }, config: {
    label: 'Admin',
    tooltip: 'Save profiles, set proxies, execute actions and set plugin input values'
  }, har: {
    label: 'HAR Replay',
    tooltip: 'Override the mock server to respond as dictated by the response content (and timings) provided by your har files'
  }
};

var inputVersion = 1;
var api = {
  doPost: function (path, data, method, callback) {
    var successMessage = data && data.successMessage;
    var errorMessage = data && data.errorMessage;
    var incrementState = data && data.incrementState;

    if (data.successMessage) {
      delete data.successMessage;
    }
    if (data.incrementState) {
      delete data.incrementState;
    }

    $.ajax({
      type: method || 'POST',
      url: '/_admin/api' + path + '?returnConfig=true',
      processData: false,
      contentType: 'application/json',
      data: JSON.stringify(data || {}),
      error: function (req, type) {
        if (type === 'abort') {
          return showErrorMessage('smocks server is not running');
        }
        showErrorMessage('could not process your request');
      },
      success: function (_data) {
        if (_data._actionResponse) {
          successMessage = _data._actionResponse;
          delete _data._actionResponse;
        }
        if (_data._actionErrorResponse) {
          errorMessage = _data._actionErrorResponse;
          delete data._actionErrorResponse;
        }

        if (incrementState) {
          inputVersion++;
        }
        if (callback) {
          callback(_data);
        } else {
          resetConfig(_data);
        }

        if (errorMessage) {
          _.defer(function () {
            var message = _.isFunction (successMessage) ? successMessage(_data) : successMessage;
            if (message) {
              showErrorMessage(errorMessage);
            }
          });
        } else if (successMessage) {
          _.defer(function () {
            var message = _.isFunction (successMessage) ? successMessage(_data) : successMessage;
            if (message) {
              showSuccessMessage(message);
            }
          });
        }
      }
    });
  },

  executeAction: function (action, input, route) {
    this.doPost('/action', {
      action: action.id,
      route: route && route.id,
      input: input,
      successMessage: function (data) {
        return data._actionResponse || 'the action was successful';
      }
    }, 'POST');
  },

  proxyTo: function (val) {
    this.doPost('/proxy', {config: val});
  },

  submitHar: function (data) {
    this.doPost('/har', data, 'POST', function (data) {
      resetConfig(data, { viewScope: 'har' });
    });
  },

  removeHar: function (data) {
    this.doPost('/har', {}, 'DELETE');
  },

  resetHar: function () {
    this.doPost('/har', { reset: true }, 'PATCH', function (data) {
      resetConfig(data, { viewScope: 'har' });
    });
  },

  setHarStartIndex: function (index) {
    this.doPost('/har', { startIndex: index }, 'PATCH', function (data) {
      resetConfig(data, { viewScope: 'har' });
    });
  },

  refreshHarData: function (callback) {
    $.ajax({
      type: 'GET',
      url: '/_admin/api/har?returnConfig=true',
      processData: false,
      contentType: 'application/json',
      error: function () {
        data.har = undefined;
        callback(undefined);
      },
      success: function (harData) {
        data.har = harData;
        callback(harData);
      }
    });
  },

  selectVariant: function (routeId, variantId) {
    this.doPost('/route/' + encodeURIComponent(routeId), { variant: variantId });
  },

  selectValue: function (routeId, type, id, value) {
    var payload = {};
    var typePayload = {};
    payload[type] = typePayload;
    typePayload[id] = value;

    this.doPost('/route/' + encodeURIComponent(routeId), {
      input: payload
    });
  },

  globalInputChange: function (pluginId, id, value) {
    this.doPost('/global/input/' + encodeURIComponent(pluginId), {
      id: id,
      value: value
    });
  },

  resetState: function () {
    this.doPost('/state/reset', {
      successMessage: function () {
        return 'The state has been reset';
      },
      incrementState: true
    });
  },

  resetInput: function () {
    this.doPost('/input/reset', {
      successMessage: function () {
        return 'The fixture settings have been reset';
      },
      incrementState: true
    });
  },

  loadProfile: function (profile) {
    if (profile.type === 'remote') {
      this.doPost('/profile/' + encodeURIComponent(profile.name), {
        incrementState: true
      }, 'POST', function (data) {
        React.unmountComponentAtNode(document.body);
        resetConfig(data);
        showSuccessMessage(profile.name + '" was applied');
      });
    } else {
      var _profile = this.getLocalProfile(profile.name);
      if (_profile) {
        this.doPost('/profile', _profile, 'POST', function (data) {
          React.unmountComponentAtNode(document.body);
          resetConfig(data);
          showSuccessMessage(profile.name + '" was applied');
      });
      } else {
        showErrorMessage('invalid profile');
      }
    }
  },

  getLocalProfileNames: function () {
    var rtn = [];
    _.each(profiles, function (profile, name) {
      rtn.push(name);
    });
    return rtn;
  },

  getLocalProfile: function (name) {
    return profiles[name];
  },

  saveLocalProfile: function (name) {
    profiles[name] = this.toProfileData();
    localStorage.setItem(profileDomain, JSON.stringify(profiles));
    showSuccessMessage('profile "' + name + '" was saved');
  },

  deleteLocalProfile: function (profile) {
    delete profiles[profile.name];
    localStorage.setItem('profiles', JSON.stringify(profiles));
    showSuccessMessage('profile "' + profile.name + '" was deleted');
  },

  toProfileData: function () {
    var toSave = {};
    _.each(data.routes, function (route) {
      toSave[route.id] = {
        activeVariant: route.activeVariant,
        selections: route.selections
      };
    });
    return toSave;
  }
};

function resetConfig(_data, input) {
  data = _data;
  input = _.defaults({}, { routes: data.routes }, input);
  React.render(React.createElement(AdminPage, input), document.getElementById('content'));
}



var INPUT_TYPES = {};
_inputs(INPUT_TYPES);


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
          Show by
        </a>
        <a href="#" className={'item ' + (style === 'label' && 'active green')} onClick={this.changeStyle('label')}>
          Label
        </a>
        <a href="#" className={'item ' + (style === 'path' && 'active green')} onClick={this.changeStyle('path')}>
          Route Path
        </a>

        <div className="menu filter-container">
            <div className="ui icon input">
              <input type="text" className="filter-input" placeholder="Search..." onChange={this.onFilter} value={this.props.filterValue}/>
              <i className="search link icon"></i>
            </div>
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

var TipButton = React.createClass({
  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
    var el = $(this.getDOMNode());
    this.state.tip = new Opentip(el, this.props['data-tip'], {
      showOn: 'mouseover'
    })
  },

  componentWillUnmount: function () {
    this.state.tip.deactivate();
  },

  render: function () {
    return <button {...this.props}>{this.props.children}</button>
  }
});

/**************************************************************************
 *  Group Menu
 **************************************************************************/
var RouteGroupMenu = React.createClass({
  displayName: 'RouteGroupMenu',
  render: function () {
    var selectedGroup = this.props.selectedGroup || 'All';
    var routes = this.props.routes;
    var onSelectGroup = this.props.onSelectGroup;
    var groups = {};
    _.each(routes, function (route) {
      if (route.group) {
        var count = groups[route.group] || 0;
        groups[route.group] = count + 1;
      }
    });
    var groupsArr = _.map(groups, function (count, name) {
      return {name: name, count: count};
    });


    if (groupsArr.length) {
      if (groupsArr.length === 1) {
        if (groupsArr[0].count !== routes.length) {
          groupsArr.unshift({name: 'All', count: routes.length});
        } else if (groupsArr[0].count === 1) {
          return <div/>;
        }
      } else {
        groupsArr.unshift({name: 'All', count: routes.length});
      }
    } else {
      return <div/>;
    }

    return (
      <div className="ui compact menu group-menu">
        {_.map(groupsArr, function (data) {
          function onClick () {
            onSelectGroup(data.name === 'All' ? undefined : data.name);
          }
          return (
            <a className="item" onClick={onClick}>
              {data.name}
              <div key={data.name} className={'ui label' + (selectedGroup === data.name ? ' blue' : '')}>{data.count}</div>
            </a>
          );
        })}
      </div>
    );
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
    var self = this;

    return (
      <div className="tab-container">
        <div className="tab-action-buttons">
          <TipButton type="button" data-content="hello" className="ui green button" onClick={_.bind(api.resetState, api)}
            data-tip="Reset any changes made in your application <br/><br/> <b>any changes made in this admin panel will remain</b>">
            Reset State
          </TipButton>
          <TipButton type="button" className="ui green button" onClick={_.bind(api.resetInput, api)}
            data-tip="Reset any changes made in this admin panel <br/><br/> <b>any changes changes you have made in your app will remain</b>">
            Reset Route Settings
          </TipButton>
        </div>

        <div className="ui top attached tabular menu">
        {_.map(tabs, function (data, key) {
        var label = data.label;
        var tooltip = data.tooltip;
        function onClick () {
              self.props.onSelect(key);
            }
            return (
              <TipButton key={key} data-tip={tooltip} type="button" className={'item ' + (selected === key && 'active green')} onClick={onClick}>
                {label}
              </TipButton>
            );
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
    var selectedGroup = props.selectedGroup;

    var match = filter.match(/(POST|GET|PUT|DELETE|PATCH) \"([^\"]+)\"/);
    if (match) {
      routeSpecific = {
        method: match[1],
        path: match[2]
      }
    }

    var _routes = _.compact(_.map(routes, function (route) {
      var valid = true;
      if (routeSpecific) {
        valid = route.method === routeSpecific.method && route.path === routeSpecific.path;
      } else {
        var filterContent = (route.label || '') + ' ' + route.path + ' ' + route.method;
        var filters = filter.split(' ');

        _.each(filters, function (filter) {
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

    _routes.sort(function (routeA, routeB) {
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
        <RouteGroupMenu onSelectGroup={props.onSelectGroup} routes={_routes} selectedGroup={selectedGroup}/>
        <div>
          {_.map(_routes, function (route) {
            if (!selectedGroup || route.group === selectedGroup) {
              return <Route key={route.id} route={route} selected={selectedRoute === route.id || _routes.length === 1}
                onSelect={props.onSelectRoute} onDeselect={props.onDeselectRoute} viewType={viewType}/>
            }
          }, this)}
        </div>
      </div>
    );
  }
});


/**************************************************************************
 *  ADMIN PAGE
 **************************************************************************/
var AdminPage = React.createClass({
  displayName: 'AdminPage',

  getInitialState: function () {
    var hash = (window.location.hash || '').replace('#', '').split('/');
    return {
      filter: decodeURIComponent(hash[1] || ''),
      viewType: decodeURIComponent(hash[0] || 'label'),
      viewScope: this.props.viewScope || 'fixtures',
      'profileState': _.uniqueId('profileState-')
    };
  },

  render: function () {
    var selectedRoute = this.state.selectedRoute;
    var selectedProfile = this.state.selectedProfile;
    var filter = this.state.filter;
    var viewType = this.state.viewType;
    var viewScope = this.state.viewScope;
    var selectedGroup = this.state.selectedGroup;

    var body;
    if (viewScope === 'fixtures') {
      body = (
        <div>
          <RouteStyleController style={viewType} onStyleChange={this.onStyleChange} onFilter={this.onFilter} filterValue={filter}/>
          <div className="routes">
            <RouteListPanel selectedGroup={selectedGroup} routes={this.props.routes} filter={filter} viewType={viewType} selectedRoute={selectedRoute}
              onSelectRoute={this.onSelectRoute} onDeselectRoute={this.onDeselectRoute} onSelectGroup={this.onSelectGroup}/>
          </div>
        </div>
      );
    } else if (viewScope === 'config') {
      body = (
        <div>
          {[<ConfigTab ref="profiles" key={this.state.profileState} display={this.props.display} selected={selectedProfile} remoteConfigComplete={this.remoteProfileConfigComplete}
            onSelectProfile={this.onSelectProfile} onSaveProfile={this.onSaveProfile} onLoadProfile={this.onLoadProfile}
            onDeleteProfile={this.onDeleteProfile} onCancelProfileAction={this.onCancelProfileAction} remoteConfig={this.state.remoteConfig}/>
          ]}
        </div>
      );
    } else if (viewScope === 'har') {
      body = <HarTab onChange={_.bind(this.forceUpdate, this)}/>;
    }

    return (
      <div>
        <a href="https://github.com/jhudson8/smocks" className="logo">Smocks</a>
        <TabPanel tabs={TABS} selected={viewScope} onSelect={this.setViewScope}>
          {body}
        </TabPanel>
      </div>
    );
  },

  setViewScope: function (key) {
    this.setState({
      viewScope: key
    });
  },

  onSelectGroup: function (group) {
    this.setState({
      selectedGroup: group
    });
  },

  onStyleChange: function (type) {
    this._updateHash(type, this.state.filter);

    this.setState({
      viewType: type
    });
  },

  onCancelProfileAction: function () {
    this.setState({
      profileState: _.uniqueId('profileState-'),
      selectedProfile: undefined
    });
  },

  remoteProfileConfigComplete: function () {
    this.setState({
      remoteConfig: undefined,
      profileState: _.uniqueId('profileState-')
    });
  },

  onSelectProfile: function (profile) {
    this.setState({
      selectedProfile: profile
    });
  },

  onLoadProfile: function (profile) {
    api.loadProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onSaveProfile: function (profile) {
    if (profile.type === 'remote') {
      this.setState({remoteConfig: "smocks.profile(" + JSON.stringify(profile.name) + ", " + JSON.stringify(api.toProfileData()) + ");"});
    } else {
      api.saveLocalProfile(profile.name);
      this.forceUpdate();
    }
  },

  onDeleteProfile: function (profile) {
    api.deleteLocalProfile(profile);
    this.refs.profiles.reset();
    this.setState({
      selectedProfile: undefined
    });
  },

  onFilter: function (value) {
    this.setState({ filter: value });

    this._updateHash(this.state.viewType, value);
  },

  _updateHash: function (viewType, filter) {
    var hash = encodeURIComponent(viewType);
    if (filter) {
      hash = hash + '/' + encodeURIComponent(filter);
    }
    if (window.location.hash != hash) {
      window.location.hash = hash;
    }
  },

  onSelectRoute: function (route) {
    this.setState({
      selectedRoute: route.id
    });
  },

  onDeselectRoute: function (route) {
    if (route.id === this.state.selected) {
      this.setState({
        selected: undefined
      });
    }
  },

  resetState: function () {
    api.resetState();
  }
});


var FileUploadBox = React.createClass({
  displayName: 'FileUploadBox',

  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
    var filedrag = this.getDOMNode();
    filedrag.addEventListener("dragover", this.fileDragHover, false);
    filedrag.addEventListener("dragleave", this.fileDragLeave, false);
    filedrag.addEventListener("drop", this.fileSelectHandler, false);
  },

  componentWillUnmount: function () {
    var filedrag = this.getDOMNode();
    filedrag.removeEventListener("dragover", this.fileDragHover, false);
    filedrag.removeEventListener("dragleave", this.fileDragLeave, false);
    filedrag.removeEventListener("drop", this.fileSelectHandler, false);
  },

  fileDragHover: function (e) {
    e.stopPropagation();
    e.preventDefault();
    if (!this.state.hovering) {
      this.setState({
        hovering: true
      });
    }
  },

  fileDragLeave: function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      hovering: false
    });
  },

  fileSelectHandler: function (e) {
    var self = this;

    // cancel event and hover styling
    this.fileDragLeave(e);

    // fetch FileList object
    var files = e.target.files || e.dataTransfer.files;
    var file = files[0];

    if (file) {
      if (file.name.match(/\.har$/i)) {
        var reader = new FileReader();
        reader.onload = function (e) {
          self.uploadHAR(file.name, reader.result);
        }
        reader.readAsText(file);
      } else {
        showErrorMessage('The file must have a ".har" extension');
      }
    }
  },

  uploadHAR: function (fileName, contents) {
    var harData = JSON.parse(contents);
    harData.log.entries = _.filter(harData.log.entries, function (data) {
      return data.response.content.mimeType.match(/application\/json/i);
    });
    api.submitHar({
      fileName: fileName,
      contents: JSON.stringify(harData)
    });
  },

  render: function () {
    var uploading = this.state.uploading;
    var hovering = this.state.hovering;
    var whenWaiting = this.props.whenWaiting;
    var whenHovering = this.props.whenHovering;

    return (
      <div className={'file-upload-box ' + (hovering ? 'hovering' : '')}>
        <h3>HTTP Archive Upload</h3>
        {uploading && (
          <div className="ui active inverted dimmer">
            <div className="ui text large loader">uploading HAR contents...</div>
          </div>
        )}
        {hovering && whenHovering()}
        {!hovering && whenWaiting()}
        {!uploading && this.props.children}
      </div>
    );
  }
});


var HarTab = React.createClass({
  displayName: 'HarTab',

  render: function () {

    if (data.har) {
      return <HarDetails details={data.har} onChange={this.props.onChange}/>;
    }

    return (
      <FileUploadBox
        whenWaiting={
          function () {
            return (
              <div className="waiting-content">
                <i className="massive archive icon"></i>
                <br/>
                <br/>
                <div>
                  Drag and drop your <a href="https://confluence.atlassian.com/display/KB/Generating+HAR+files+and+Analysing+Web+Requests">HAR file</a>
                  &nbsp;here to replay a previous session.
                  <br/>
                  <em>Note: only <b>.json</b> responses will be recorded</em>
                </div>
              </div>
            );
          }
        }
        whenHovering={
          function () {
            return (
              <div className="hovering-content">
                <i className="massive checkmark icon"></i>
                <br/>
                <br/>
                <div>
                  You're all set!  Just drop the file here to load the HAR file.
                </div>
              </div>
            );
          }
        }
      >
      </FileUploadBox>
    );
  },

  submitHar: function () {
    var file = this.refs.file.getDOMNode().value;
    if (file) {
      api.submitHar(file);
    } else {
      showErrorMessage('you must select a file');
    }
  }
})

var HarDetails = React.createClass({
  displayName: 'HarDetails',

  getInitialState: function () {
    return {
      startIndex: this.props.details.startIndex || 0
    };
  },

  componentDidMount: function () {
    this.setState({
      interval: window.setInterval(this.checkForHARUpdates, 3000)
    });

    // figure out element height
    var parentEl = this.refs['file-container'].getDOMNode();
    if (parentEl.children.length > 1) {
      this.state.childHeight = parentEl.children[1].offsetTop - parentEl.children[0].offsetTop;
    }
  },

  componentWillUnmount: function () {
    var interval = this.state.interval;
    window.clearInterval(interval);
    this.stopListening();
  },

  startListening: function () {
    if (!this.state.listening) {
      document.addEventListener('mousemove', this.onMouseOver, true);
      document.addEventListener('mouseup', this.onMouseUp, false);
      this.state.listening = true;
    }
  },

  stopListening: function () {
    if (this.state.listening) {
      document.removeEventListener('mousemove', this.onMouseOver, true);
      document.removeEventListener('mouseup', this.onMouseUp, false);
      delete this.state.listening;
    }
  },

  checkForHARUpdates: function () {
    if (this.props.details) {
      var self = this;
      api.refreshHarData(function () {
        if (self.isMounted()) {
          self.props.onChange();
        }
      });
    }
  },

  render: function () {
    var startIndex = this.state.startIndex || 0;
    var details = this.props.details;
    var duration = details.maxTime - details.minTime;
    if (!details || !details.calls) {
      return React.DOM.div({});
    }

    var i = 0;
    return (
      <div className="har-details">
        <div className="ui info message">
          The <b>{details.fileName}</b> HAR file has been uploaded.
          <br/>
          <br/>
          All responses matching paths from the HAR file will override any mock server response of the same path.  Once the
          HAR response has been rendered, it will be disabled and the standard mock response will be rendered.
          <br/>
          <br/>
          <i>Hint: move the <i className="pointing right icon"/> marker down to bypass earlier calls in the HAR that you do not need</i>
          <br/>
          <br/>
          <button type="button" onClick={_.bind(api.resetHar, api)} className="ui blue button">Reset HAR</button>
          <button type="button" onClick={_.bind(api.removeHar, api)} className="ui red button">Remove HAR</button>
        </div>

        <div className="har-details-file">

          {details.calls.length > 1 && (
            <div className="har-start-marker" style={{top: startIndex * this.state.childHeight}}>
              <div className="har-start-marker-handle">
                <i ref="icon" className="large pointing right icon" onMouseDown={this.onMouseDown}/>
                <div className="har-start-marker-line"/>
              </div>
            </div>
          )}

          <div ref="file-container" className="har-details-file-inner">
            {details.calls.map(function (call, index) {
              var className = call.responded ? 'responded' : 'waiting';
              var icon = call.responded ? 'checkmark' : 'wait';
              var timePct = call.time / duration * 100;
              var timeOffset = call.startTime - details.minTime;
              var timeOffset = timeOffset / duration * 100;
              var isSuccessCode = call.status >= 200 && call.status < 300;

              return (
                <div key={index} className={'har-item ' + (index < startIndex ? 'supressed' : '')}>
                  <i className={'large icon ' + icon}/>
                  <div className="content">
                    <div className="path">
                      <div className="path-method">
                        {call.method}
                      </div>
                      <div className="path-uri">
                        {call.method === 'GET' && !call.responded ?
                          <a className={className} href={call.path} target="_blank">{call.path}</a>
                          :
                          <span className={'har-item-route ' + className}>{call.path}</span>
                        }
                      </div>
                    </div>
                    <div className="response-details">
                      <div className={'response-status-code ' + (isSuccessCode ? 'success' : 'error')}>
                        {call.status}
                      </div>
                      <div className="response-time">
                        {call.time} ms
                      </div>
                      <div className="response-time-graph">
                        <div className={'response-time-fill ' + (isSuccessCode ? 'success' : 'error')} style={{width: timePct + '%', marginLeft: timeOffset + '%'}}/>
                      </div>
                      <div className="response-viewer">
                        <a href={'/_admin/api/har/' + call.id} target="_blank">
                          <i className="search icon"/>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )
  },

  onMouseOver: function (ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var pos = ev.clientY;
    for (var i=0; i<this.state.changingStartValues.length; i++) {
      var value = this.state.changingStartValues[i];
      if (pos >= value.min && pos <= value.max) {
        if (_.isUndefined(this.state.startIndex) || this.state.startIndex !== value.index) {
          this.setState({
            startIndex: value.index
          });
        }
      }
    }
  },

  onMouseUp: function (ev) {
    this.stopListening();
    api.setHarStartIndex(this.state.startIndex);
    this.setState({
      changingStartPos: undefined,
      changingStartValues: undefined
    });
  },

  onMouseDown: function (ev) {
    var parentEl = this.refs['file-container'].getDOMNode();
    this.startListening();

    // calculate the positions

    var values = [];
    for (var i=0; i<parentEl.children.length; i++) {
      var childEl = parentEl.children[i];
      values.push(childEl.offsetTop);
    }
    // move all back to zero (based on first offsetTop)
    var minus = values[0];
    var height = values[1] - values[0];
    var halfHeight = Math.floor(height / 2);
    var containerTop = parentEl.getBoundingClientRect().top;
    values = _.map(values, function (value, index) {
      return {
        index: index,
        min: value - halfHeight + containerTop - minus,
        max: value + halfHeight + containerTop - minus,
        markerOffset: value - minus
      }
    });

    this.setState({
      changingStartPos: true,
      changingStartValues: values
    });
  },
});


var Actions = React.createClass({
  displayName: 'Actions',

  getInitialState: function () {
    return {};
  },

  render: function () {
    var self = this;
    var pendingAction = this.state.pendingAction;
    var pendingActionDetails;
    var route = this.props.route;

    var actions = !pendingAction && _.map(this.props.actions, function (action) {
      var onClick = function () {
        var hasInput = false;
        var pendingInputValues = {};
        _.each(action.input, function (data, id) {
          hasInput = true;
          pendingInputValues[id] = data.defaultValue;
        });
        if (hasInput) {
          self.setState({
            pendingAction: action,
            pendingInputValues: pendingInputValues
          });
        } else {
          // just execute the action
          api.executeAction(action, pendingInputValues, route);
        }
      };

      return <button key={action.id} type="button" className="ui fluid green button" onClick={onClick}>{action.label || action.id}</button>
    }, this);

    if (pendingAction) {
      var pendingActionLabel = pendingAction.label || pendingAction.id;
      var values = {};
      _.each(pendingAction.input, function (data, id) {
        values[id] = data.defaultValue;
      });
      pendingActionDetails = (
        <div className="pending-action-details">
          <div className="pending-action-message">
            <h5>{pendingActionLabel}</h5>
            <div className="ui form">
              <InputList data={pendingAction.input} values={values} onChange={this.onInputChange}/>
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

  onInputChange: function (id, value) {
    this.state.pendingInputValues[id] = value;
  },

  executeAction: function () {
    var action = this.state.pendingAction;
    if (this.state.pendingAction) {
      api.executeAction(this.state.pendingAction, this.state.pendingInputValues, this.props.route);
      this.setState({
        pendingAction: undefined,
        pendingInputValues: undefined
      });
    }
  },

  cancelAction: function () {
    this.setState({
      pendingAction: undefined,
      pendingInputValues: undefined
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

  getInitialState: function () {
    return {
      selected: this.findActive()
    };
  },

  render: function () {
    var route = this.props.route,
        activeVariant = this.findActive(),
        title = this.props.viewType === 'label' ? (route.label || route.path) : route.path,
        actions, display;
    var messageColor = routeColors[route.method];
    var numInputEntries = countProperties(route.input) + countProperties(activeVariant.input);

    if (route.display) {
      display = React.DOM.div({dangerouslySetInnerHTML: {__html: markdownConverter.makeHtml(route.display)}});
    }

    if (route.actions.length > 0) {
      actions = React.createElement(Actions, { actions: route.actions, route: route });
    }

    if (this.props.selected) {
      var self = this;
      var variants = _.map(route.variants, function (variant) {
        return <Variant key={variant.id} variant={variant} selected={variant.id === activeVariant.id} onSelect={self.selectVariant}/>;
      });

      var isLabelType = this.props.viewType === 'label';
      var endpointLabel = isLabelType ? React.DOM.div({className: 'route-label'}, 'Path') : undefined;

      return (
        <div className={'ui ' + messageColor + ' message route-description selected'}>
          <a className={'ui ' + messageColor + ' right ribbon label'}>{route.method}</a>
          <h3 onClick={this.onDeselect}>{title}</h3>
          <a alt="permalink" className="ui icon permalink primary button" target="_blank" href={'#' + this.props.viewType + '/' + route.method + '%20' + encodeURIComponent('"' + route.path + '"')}>
            <i className="bookmark icon"></i>
          </a>
          {(route.method === 'GET') && (
            <button type="button" className="ui icon view-endpoint primary button" onClick={this.viewEndpoint}>
              <i className="unhide icon"></i>
            </button>
            )}

          <div className="route-description-body">
            <div className="ui grid">

              <div className="ten wide column">
                <h5>Details</h5>
                <div className="ui form">
                  <div className="inline field">
                    <label>Route Id</label>
                    {route.id}
                  </div>
                  <div className="inline field">
                    <label>Active Variant Id</label>
                    {activeVariant.id}
                  </div>
                  <div className="inline field">
                    <label>Websocket Path</label>
                    {route.websocketId}
                  </div>
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
                    <h5>Route Details</h5>
                    <div className="ui message display-content">
                      {display}
                    </div>
                  </div>
                )}
              </div>

              <div className="six wide column">
                <h5>Configuration</h5>
                {!numInputEntries && 'No configuration entries are available'}
                <InputList data={route.input} values={route.selections && route.selections.route || {}} onChange={this.onChange('route')}/>
                <InputList data={activeVariant.input} values={route.selections && route.selections.variants && route.selections.variants[activeVariant.id]}
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

  viewEndpoint: function (ev) {
    ev.preventDefault();
    var path = this.props.route.path.replace(/\{[^\}]+}/g, function (val) {
      val = val.substring(1, val.length-1);
      var response = prompt('Enter the value for "' + val + '"');
      return response || val;
    });
    window.open(path, path);
  },

  onDeselect: function () {
    this.props.onDeselect(this.props.route);
  },

  onSelect: function () {
    this.props.onSelect(this.props.route);
  },

  onChange: function (type) {
    var route = this.props.route;
    return function (id, value) {
      api.selectValue(route.id, type, id, value);
    };
  },

  findActive: function () {
    var id = this.props.route.activeVariant;

    var match = _.find(this.props.route.variants, function (variant) {
      return variant.id === id;
    });
    if (!match) {
      match = _.find(data.variants, function (variant) {
        return variant.id === id;
      });
    }
    return match;
  },

  selectVariant: function (id) {
    var route = this.props.route;
    route.activeVariant = id;

    api.selectVariant(route.id, id);
    this.forceUpdate();
  }
});


var Variant = React.createClass({
  displayName: 'Variant',

  getInitialState: function () {
    return { id: _.uniqueId('variant') };
  },

  render: function () {
    var id = this.state.id;
    var variant = this.props.variant;
    var label = variant.label || variant.id;
    var selected = this.props.selected;
    var className = selected ? 'btn btn-primary active' : 'btn btn-secondary';

    return (
      <button type="button" title={label} className={'ui button ' + (selected ? 'primary' : 'basic blue')} onClick={this.onClick}>
        {label}
      </button>
    );
  },

  onClick: function () {
    this.props.onSelect(this.props.variant.id);
  }
});


var InputItemWrapper = React.createClass({
  displayName: 'InputItemWrapper',

  render: function () {
    return <div className={'field ' + (this.props.className || '')}>
      <label htmlFor={this.props.id}>{this.props.label || this.props.id}</label>
      {this.props.children}
    </div>
  }
});


var UndefinedInput = React.createClass({
  render: function () {
    return React.DOM.div({}, 'Undefined input type ' + this.props.type + ' for ' + this.props.id);
  }
});


var InputList = React.createClass({
  displayName: 'InputList',

  render: function () {
    var self = this;
    var inputData = this.props.data;
    var values = this.props.values;

    var children = _.map(inputData, function (data, id) {
      var Input = INPUT_TYPES[data.type];
      if (!Input) {
        return <UndefinedInput ref={id} id={id} type={data.type}/>
      }
      data = _.clone(data);
      var value = values && values[id];
      if (_.isUndefined(value)) {
        value = data.defaultValue;
      }
      data.value = value;
      data.key = id;
      data.ref = id;
      data.onChange = function (value) {
        self.props.onChange(id, value);
      };
      return <Input {...data}/>
    });
    return <form className="ui form">{[<div key={inputVersion}>{children}</div>]}</form>;
  }
});

var DisplaySelectorChoice = React.createClass({
  displayName: 'DisplaySelectorChoice',

  getInitialState: function () {
    return {
      id: _.uniqueId('form')
    };
  },

  render: function () {
    return <span className="display-selector-choice">
      <input id={this.state.id} type="radio" checked={this.props.selected} onChange={this.props.onSelect}/>
      <label htmlFor={this.state.id}>{this.props.label}</label>
    </span>;
  }
});

var ConfigTab = React.createClass({
  displayName: 'ConfigTab',

  render: function () {
    var self = this;
    var chooseProfile;
    var selected = this.props.selected;
    var remoteConfig;
    var localProfiles = api.getLocalProfileNames();
    var hasProfiles = !_.isEmpty(data.profiles) || !_.isEmpty(localProfiles);

    if (!_.isEmpty(data.profiles) || !_.isEmpty(localProfiles)) {
      var choices = [React.DOM.option({key: '_blank', value: ''}, 'select profile')];
      _.each(localProfiles, function (name) {
        choices.push(React.DOM.option({key:'local:' + name, value: 'local:' + name}, name));
      });
      _.each(data.profiles, function (name) {
        choices.push(React.DOM.option({key:'remote:' + name, value: 'remote:' + name}, name));
      });

      var loadProfile = selected && React.DOM.button({type: 'button', className: 'ui primary green button',
        onClick: this.loadProfile}, 'Apply ' + selected.name);
      var deleteProfile = selected && selected.type === 'local' && React.DOM.button({type: 'button', className: 'ui red button',
        onClick: this.deleteProfile}, 'Delete');
      var cancelProfile = selected && React.DOM.button({type: 'button', className: 'ui red basic button',
        onClick: this.cancelProfileAction}, 'Cancel');
    }

    if (this.props.remoteConfig) {
      remoteConfig = React.DOM.div({className: 'profile-remote-config'},
        React.DOM.div({className: 'profile-remote-config-info'}, 'Copy and paste to your smocks setup code to save the profile'),
        React.DOM.textarea({className: 'profile-remote-content form-control', value: this.props.remoteConfig, readOnly: true}),
        React.DOM.div({className: 'profile-remote-config-actions'},
          React.DOM.button({type: 'button', className: 'ui primary button', onClick: this.remoteConfigComplete}, "I'm done")
        )
      );
    }

    return (
      <div className="ui two columns grid">
        <div className="column">
          {data.display && (
            <div>
              <h4>Details</h4>
              <div className="ui message .display-content">
                <div dangerouslySetInnerHTML={{__html: markdownConverter.makeHtml(data.display)}}/>
              </div>
            </div>
          )}

          <h4>Profiles</h4>
          {hasProfiles && (
            <form className="ui form">
              <div className="field">
                <label htmlFor="profile-selector">Load / delete profile</label>
                <select id="profile-selector" ref="select" className="ui fluid dropdown" onChange={this.selectProfile}>
                  {choices}
                </select>
              </div>
              {loadProfile}
              {deleteProfile}
              {cancelProfile}
            </form>
          )}

          <form className="ui form">
            <div className="field">
              <label htmlFor="profile-entry">
                Save current fixture configuration as
              </label>
              <input ref="profileName" onChange={this.setProfile} placeholder="Profile Name"/>
              <div className="ui two buttons">
                <button type="button" className="ui green button" onClick={this.saveProfile('local')}>for me</button>
                <div className="or"/>
                <button type="button" className="ui blue button" onClick={this.saveProfile('remote')}>for everyone</button>
              </div>
            </div>
            {remoteConfig}
          </form>

          {data.proxies && (
            <div>
              <h4>Proxy To</h4>
              <Proxy/>
            </div>
          )}

        </div>

        <div className="column">
          <h4>Input</h4>
          <div>
            {_.map(data.globalInput, function (input) {
              return React.createElement(InputList, { key: input.id, data: input.input, values: data.globalInputValues[input.id],
                onChange: self.onPluginInputChange(input.id) });
            }, this)}
          </div>

          <h4>Actions</h4>
          <div>
            <Actions actions={data.actions}/>
            {!data.actions.length && 'There are no global actions'}
          </div>
        </div>
      </div>
    );
  },

  onPluginInputChange: function (pluginId) {
    return function (id, value) {
      api.globalInputChange(pluginId, id, value);
    };
  },

  remoteConfigComplete: function () {
    this.props.remoteConfigComplete();
    this.refs.profileName.getDOMNode().value = '';
  },

  reset: function () {
    this.refs.select.getDOMNode().selectedIndex = 0;
  },

  selectProfile: function (ev) {
    var profile = ev.currentTarget.value;
    var match  = profile.match(/^([^:]*):(.*)$/);

    this.props.onSelectProfile({
      type: match[1],
      name: match[2]
    });
  },

  cancelProfileAction: function (ev) {
    this.props.onCancelProfileAction();
  },

  loadProfile: function (ev) {
    this.props.onLoadProfile(this.props.selected);
  },

  deleteProfile: function (ev) {
    this.props.onDeleteProfile(this.props.selected);
  },

  saveProfile: function (type) {
    var self = this;
    return function () {
      var profileName = self.refs.profileName.getDOMNode().value;
      if (!profileName) {
        return showErrorMessage('You must enter a profile name');
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

var Proxy = React.createClass({
  render: function () {
    var self = this;
    var proxyTo = data.selectedProxy;
    var proxies = data.proxies;

    return (
      <div className="grouped fields">
        <div className="field">
          <div className="ui radio checkbox">
            <input id="proxy_none" type="radio" name="fruit" checked={!proxyTo} className="hidden" onChange={this.proxyTo()}/>
            <label htmlFor="proxy_none">Do not proxy</label>
          </div>
        </div>
        {_.map(proxies, function (val) {
          return (
            <div key={val} className="field">
              <div className="ui radio checkbox">
                <input id={'proxy=' + val} type="radio" name="fruit" checked={proxyTo === val} className="hidden" onChange={self.proxyTo(val)}/>
                <label htmlFor={'proxy=' + val}>{val}</label>
              </div>
            </div>
          );
        }, this)}
      </div>
    );
  },

  proxyTo: function (config) {
    var self = this;
    return function () {
      api.proxyTo(config);
    }
  }
});

var Message = React.createClass({
  displayName: 'Message',

  render: function () {
    var type = this.props.type;
    var icon = type === 'success' ? 'checkmark' : 'warning sign';
    return (
      <div className={'ui icon message ' + type}>
        <i className={'small icon ' + icon}></i>
        <div className="content">
          <p id="info-message-content">{this.props.message}</p>
        </div>
      </div>
    );
  }
})

function showSuccessMessage(message) {
  showMessage('success', message);
}

function showErrorMessage(message) {
  showMessage('error', message);
}

function showMessage(type, message) {
  var wrapper = document.getElementById('message');
  React.render(React.createElement(Message, { type: type, message: message }), wrapper);

  wrapper.className = 'visible';
  setTimeout(function () {
    wrapper.className = 'fading';
    setTimeout(function () {
      wrapper.className = '';
      React.unmountComponentAtNode(wrapper);
    }, 1000);
  }, 1000);
}

React.render(React.createElement(AdminPage, { routes: data.routes }), document.getElementById('content'));
