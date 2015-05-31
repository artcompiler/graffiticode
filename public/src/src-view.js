/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

import Dispatcher from "../lib/Dispatcher.js";

var IS_MOBILE = (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
);
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
    if (IS_MOBILE) {
      return;
    }
    this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
      mode: 'graffiti',
      lineNumbers: this.props.lineNumbers,
      lineWrapping: true,
      smartIndent: true,
      matchBrackets: true,
      theme: 'neat',
      readOnly: this.props.readOnly,
      viewportMargin: Infinity,
      extraKeys: {"Ctrl-Space": "autocomplete"},
    });
    this.editor.on('change', this.handleChange);
  },
  componentDidUpdate: function() {
    if (this.props.readOnly) {
      this.editor.setValue(this.props.codeText);
    }
  },
  handleChange: function() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },
  render: function() {
    // wrap in a div to fully contain CodeMirror
    var editor;
    if (IS_MOBILE) {
      editor = <pre style={{overflow: 'scroll'}}>{this.props.codeText}</pre>;
    } else {
      editor = <textarea ref="editor" defaultValue={this.props.codeText} />;
    }
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
var SourceView = React.createClass({
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
      editorTabTitle: 'Source',
      showCompiledJSTab: true,
      showLineNumbers: true,
      codeText: 'equivSymbolic "10" "20-10"..',
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
            codeText={'equivSymbolic "10" "20-10"..'}
            lineNumbers={this.props.showLineNumbers}
          />
        </div>
      </div>
    );
  },
  componentDidMount: function() {
    this.executeCode();
  },
  componentDidUpdate: function(prevProps, prevState) {
    // execute code only when the state's not being updated by switching tab
    // this avoids re-displaying the error, which comes after a certain delay
    if (this.props.transformer !== prevProps.transformer ||
        this.state.code !== prevState.code) {
      this.executeCode();
    }
  },
  executeCode: function() {
    return;
    var mountNode = React.findDOMNode(this.refs.mount);
    try {
      React.unmountComponentAtNode(mountNode);
    } catch (e) {
    }
    try {
      var compiledCode = this.compileCode();
      if (this.props.renderCode) {
        React.render(
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
export default SourceView;
