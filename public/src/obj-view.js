/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

import * as React from "react";
import * as ReactDOM from "react-dom";

var CodeMirrorEditor = React.createClass({
  propTypes: {
    lineNumbers: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {
      lineNumbers: false,
    };
  },
  componentDidMount: function() {
    if (true || this.refs && thie.refs.editor) {
      this.editor = CodeMirror.fromTextArea(ReactDOM.findDOMNode(this.refs.editor), {
        mode: 'javascript',
        lineNumbers: this.props.lineNumbers,
        lineWrapping: true,
        smartIndent: true,
        matchBrackets: true,
        theme: 'neat',
        readOnly: this.props.readOnly,
        viewportMargin: Infinity,
        extraKeys: {"Ctrl-Space": "autocomplete"},
      });
      CodeMirrorEditor.dispatchToken = window.gcexports.dispatcher.register(this.onChange);
    }
  },
  componentDidUpdate: function() {
    this.editor.setValue(this.props.codeText);
  },
  onChange: function (data) {
    let objectCode = "";
    let lang = window.gcexports.language;
    let itemID = window.gcexports.id;
    if (data[itemID] && data[itemID].obj) {
      let obj = data[itemID].obj;
      if (obj.objectCode) {
        objectCode = JSON.stringify(obj.objectCode, null, 2);
      } else {
        objectCode = JSON.stringify(obj, null, 2);
      }
      this.editor.setValue(objectCode);
    } else if (data && !data.error && window.gcexports.viewer.getObjectCode) {
      objectCode = window.gcexports.viewer.getObjectCode(data.obj);
      this.editor.setValue(objectCode);
    }
  },
  handleChange: function() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },
  render: function() {
    if (!window.gcexports.showdata) {
      return <div/>;
    }
    let editor = <textarea ref="editor" defaultValue={""} />;
    return (
      <div style={this.props.style} className={this.props.className}>
        {editor}
      </div>
    );
  }
});
var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }
};
var ObjectView = React.createClass({
  mixins: [selfCleaningTimeout],
  MODES: {JSX: 'JSX', JS: 'JS'}, //keyMirror({JSX: true, JS: true}),
  propTypes: {
    codeText: React.PropTypes.string.isRequired,
    transformer: React.PropTypes.func,
    renderCode: React.PropTypes.bool,
    showCompiledJSTab: React.PropTypes.bool,
    showLineNumbers: React.PropTypes.bool,
    editorTabTitle: React.PropTypes.string
  },
  getDefaultProps: function() {
    return {
      editorTabTitle: 'Object',
      showCompiledJSTab: true,
      showLineNumbers: true,
      codeText: '',
    };
  },
  getInitialState: function() {
    return {
      mode: this.MODES.JSX,
      code: this.props.codeText,
    };
  },
  handleCodeChange: function(value) {
  },
  handleCodeModeSwitch: function(mode) {
  },
  compileCode: function() {
  },
  render: function() {
    var isJS = this.state.mode === this.MODES.JS;
    var compiledCode = '';
    try {
      compiledCode = this.compileCode();
    } catch (err) {
    }
    return (
      <div className="playground">
        <div className="playgroundCode">
          <CodeMirrorEditor
            key="jsx"
            onChange={this.handleCodeChange}
            className="playgroundStage"
            codeText={this.props.codeText}
            lineNumbers={this.props.showLineNumbers}
          />
        </div>
      </div>
    );
  },
  componentDidMount: function() {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
  executeCode: function() {
    return;
    var mountNode = ReactDOM.findDOMNode(this.refs.mount);
    try {
      React.unmountComponentAtNode(mountNode);
    } catch (e) {
    }
    try {
      var compiledCode = this.compileCode();
      if (this.props.renderCode) {
        ReactDOM.render(
          <CodeMirrorEditor codeText={compiledCode} readOnly={true} />,
          mountNode
        );
      } else {
        eval(compiledCode);
      }
    } catch (err) {
      this.setTimeout(function() {
        React.render(
          <div className="playgroundError">{"ERROR:" + err.toString()}</div>,
          mountNode
        );
      }, 500);
    }
  }
});
export default ObjectView;
