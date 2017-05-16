import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Nes from 'nes/client';
import { request } from 'fetchum';
import './App.css';

function getRes (res) {
  const data = {};
  const attrs = ['data', 'body', 'bodyUsed', 'headers', 'ok', 'status', 'statusText', 'type', 'url'];
  attrs.forEach(key => {
    data[key] = res[key];
  })
  return data;
}

const style = {
  backgroundColor: '#1f4662',
  color: '#fff',
  fontSize: '12px',
  width: '100%',
};

const headerStyle = {
  backgroundColor: '#193549',
  padding: '5px 10px',
  fontFamily: 'monospace',
  color: '#ffc600',
};

const preStyle = {
  display: 'block',
  padding: '10px 30px',
  margin: '0',
  overflow: 'scroll',
  textAlign: 'left'
};

const DEFAULT_STATE = {
  output: {},
  messageOutput: {},
  subscriptionOutput: {},
  isWs: false,
  host: 'localhost:8000',
  path: '/api/counter',
  method: 'GET',
  isFormData: false,
  body: {},
  headers: {},
  subscriptions: ['/test/subscription'],
  time: new Date().getTime()
};

class JSONEditor extends Component {

  state = {
    content: '',
    valid: true
  };

  componentDidMount() {
    this.handleChange({ target: { value: this.props.content } }, false);
  }

  componentWillReceiveProps(nextProps) {
    this.handleChange({ target: { value: nextProps.content } }, false);
  }

  handleChange = (e, emitChange = true) => {
    let valid = true;
    try {
      JSON.parse(e.target.value);
    } catch (e) {
      valid = false;
    }
    this.setState({ content: e.target.value, valid }, () => {
      if (emitChange && valid) {
        this.props.onChange({
          target: {
            value: this.state.content
          }
        });
      }
    });
  };

  render() {
    const { content, _, ...props } = this.props;
    return (
      <textarea
        key={_}
        {...props}
        style={!this.state.valid ? { borderColor: 'red' } : {}}
        cols={20} rows={7}
        ref={node => (this.node = node)}
        onChange={this.handleChange}
        value={this.state.content}
      ></textarea>
    );
  }
};

class Input extends Component {
  static displayName = 'Input';

  static propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    options: PropTypes.array,
    inputProps: PropTypes.object,
    scope: PropTypes.object,
    _: PropTypes.any,
  };

  static defaultProps = {
    type: 'text',
    options: [],
    inputProps: { className: 'Input' }
  }

  state = {
    innerVal: '',
  };

  componentWillMount() {
    if (this.props.type === 'json') {
      this.setState({ innerVal: this.value(this.props) });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.type === 'json' && this.state.innerVal !== this.value(nextProps)) {
      this.setState({ innerVal: this.value(nextProps) });
    }
  }

  onChange = (event) => {
    const { type, scope, name } = this.props;
    let val = event.target.value;
    if (type === 'json') {
      this.setState({ innerVal: val });
      try {
        val = JSON.parse(val);
      } catch (e) {

      }
      if (typeof val !== 'string') {
        scope.setState({ [name]: val });
      }
    } else {
      if (type === 'checkbox') { val = !scope.state[name]; }
      if (type === 'array') { val = val.split(', ') }
      scope.setState({ [name]: val });
    }
  };

  value = (props) => {
    const { type, scope, name } = props || this.props;
    let val = scope.state[name];
    if (type === 'json') { val = JSON.stringify(val, null, 2); }
    if (type === 'array') { val = val.join(', '); }
    return val;
  }

  render() {
    const { type, options, inputProps, name, _ } = this.props;
    switch (type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={this.value()}
            onChange={this.onChange}
            {...inputProps}
          />
        );
      case 'options':
        return (
          <select name={name} onChange={this.onChange} {...inputProps}>
            {options.map((option, i) => (
              <option key={i} value={option.value}>{option.text}</option>
            ))}
          </select>
        );
      case 'json':
        return (
          <JSONEditor content={this.state.innerVal} onChange={this.onChange} {...inputProps} _={_} />
        );
      case 'array':
        return <textarea cols={20} rows={7} value={this.value()} onChange={this.onChange} {...inputProps} />;
      default:
        return <input value={this.value()} onChange={this.onChange} type={type} {...inputProps} />;
    }
  }
}

class JSONView extends Component {

  static displayName = 'JSONView';

  render() {
    return (
      <div style={style}>
        <div style={headerStyle}>
          <strong>{this.props.title}</strong>
        </div>
        <pre style={preStyle}>
          {JSON.stringify(this.props.data, null, 2) }
        </pre>
      </div>
    );
  }
}

class App extends Component {

  state = { ...DEFAULT_STATE };

  resetState = () => {
    this.setState({ ...DEFAULT_STATE, time: new Date().getTime() });
  };

  makeRequest = () => {
    const { isWs, host, path, method, isFormData, body, headers, loading } = this.state;
    if (!loading) {
      if (isWs) {
        const client = new Nes.Client(`ws://${host}`);
        client.connect((error) => {
          if (error) {
            this.setState({ output: { error } });
          } else {
            this.state.subscriptions.forEach(sub => {
              client.subscribe(
                sub,
                (update, flags) => this.setState({ subscriptionOutput: { update, flags } }),
                (error) => this.setState({ output: { error } })
              );
            });

            client.request(path, (err, payload) => {
              this.setState({ output: { error: err, payload } });
            });
          }
        });
      } else {
        request(isFormData, method, `http://${host}${path}`, body, headers).then(res => {
          this.setState({ output: getRes(res) });
        }).catch(res => {
          this.setState({ output: getRes(res) });
        });
      }
    }
  };

  sendMessage = () => {
    const { isWs, host, body } = this.state;
    if (isWs) {
      const client = new Nes.Client(`ws://${host}`);
      client.connect((error) => {
        if (error) {
          this.setState({ output: { error } });
        } else {
          client.message(
            body,
            (err, message) => {
              if (err) {
                this.setState({ messageOutput: { error: error } });
              } else {
                this.setState({ messageOutput: { message } });
              }
            }
          );
        }
      });
    }
  }

  render() {
    return (
      <div className="App">
        <div className="Inputs">
          <h2>Test Endpoints</h2>
          <div className="Input-group">
            <div className="Input-box">
              <label>Host</label>
              <Input name="host" scope={this} />
            </div>
            <div className="Input-box">
              <label>Path</label>
              <Input name="path" scope={this} />
            </div>
          </div>
          <div className="Input-group">
            <div className="Input-box">
              <label>Websocket Connection</label>
              <Input name="isWs" type="checkbox" scope={this} />
            </div>
            <div className="Input-box">
              <label>Form Data</label>
              <Input name="isFormData" type="checkbox" scope={this} />
            </div>
            <div className="Input-box">
              <label>Method</label>
              <Input name="method" type="options"
                options={[
                  { text: 'GET', value: 'GET' },
                  { text: 'POST', value: 'POST' },
                  { text: 'PUT', value: 'PUT' },
                  { text: 'DELETE', value: 'DELETE' },
                  { text: 'PATCH', value: 'PATCH' },
                ]}
                scope={this}
              />
            </div>
          </div>
          <div className="Input-group" style={{ flex: 3 }}>
            <div className="Input-box">
              <label>Body</label>
              <Input name="body" type="json" scope={this} _={this.state.time} />
            </div>
            <div className="Input-box">
              <label>Headers</label>
              <Input name="headers" type="json" scope={this} _={this.state.time} />
            </div>
            <div className="Input-box">
              <label>Subscriptions</label>
              <Input name="subscriptions" type="array" scope={this} _={this.state.time} />
            </div>
          </div>
          <div className="Input-group">
            <button className="Button" onClick={this.makeRequest}>Request</button>
            {this.state.isWs ? (
              <button className="Button" onClick={this.sendMessage}>WS Message</button>
            ) : null }
            <button className="Button" onClick={this.resetState}>Reset State</button>
          </div>
        </div>
        <div className="Output">
          {this.state.loading ? 'loading' : (
            <JSONView data={this.state.output} title="Request Output" />
          )}
          {this.state.isWs ? (
            <JSONView data={this.state.subscriptionOutput} title="Subscription Output" />
          ) : null }
          {this.state.isWs ? (
            <JSONView data={this.state.messageOutput} title="Message Output" />
          ) : null }
          {/* <JSONView data={this.state} title="State" /> */}
        </div>
      </div>
    );
  }
}

export default App;
