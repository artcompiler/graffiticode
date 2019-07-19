/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

import * as React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from 'prop-types';

class CodeMirrorEditor extends React.Component {
  componentDidMount() {
    if (this.refs && this.refs.editor) {
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
      self = this;
      let updateObj = window.gcexports.updateObj = (id, obj) => {
        if (obj) {
          obj = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
          self.editor.setValue(obj);
        }
      };
      let itemID = window.gcexports.id;
      let dataID = window.gcexports.encodeID(window.gcexports.decodeID(itemID).slice(2));
      if (dataID !== "0") {
        $.get(location.origin + "/data?id=" + dataID, function (data) {
          updateObj(dataID, data);
        });
      } else {
        updateObj(dataID, {});
      }
    }
  }

  render() {
    if (window.gcexports.showdata === false) {
      return <div/>;
    }
    let editor = <textarea ref="editor" defaultValue={""} />;
    return (
      <div style={this.props.style} className={this.props.className}>
        {editor}
      </div>
    );
  }
}

CodeMirrorEditor.propTypes = {
  lineNumbers: PropTypes.bool,
  onChange: PropTypes.func
};

CodeMirrorEditor.defaultProps = {lineNumbers: false};

class ObjectView extends React.Component {
  constructor(props) {
    super(props);
    this.MODES = {JSX: 'JSX', JS: 'JS'};
    this.state = {
      mode: this.MODES.JSX,
      code: this.props.codeText,
    };
  }

  componentDidUpdate() {
    clearTimeout(this.timeoutID);
  }

  setTimeout() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }

  handleCodeChange(value) {
  }

  handleCodeModeSwitch(mode) {
  }

  compileCode() {
  }

  render() {
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
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  executeCode() {
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
}

ObjectView.propTypes = {
  codeText: PropTypes.string.isRequired,
  transformer: PropTypes.func,
  renderCode: PropTypes.bool,
  showCompiledJSTab: PropTypes.bool,
  showLineNumbers: PropTypes.bool,
  editorTabTitle: PropTypes.string
};

ObjectView.defaultProps = {
  editorTabTitle: 'Object',
  showCompiledJSTab: true,
  showLineNumbers: true,
  codeText: '',
};

export default ObjectView;
