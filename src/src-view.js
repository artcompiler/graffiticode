import * as React from "react";
import * as ReactDOM from "react-dom";
import PropTypes from 'prop-types';

class CodeMirrorEditor extends React.Component {
  componentDidMount() {
    if (this.refs && this.refs.editor) {
      let editor = window.gcexports.editor = this.editor = CodeMirror.fromTextArea(ReactDOM.findDOMNode(this.refs.editor), {
        mode: 'graffiti',
        lineNumbers: this.props.lineNumbers,
        lineWrapping: true,
        smartIndent: true,
        matchBrackets: true,
        theme: 'neat',
        readOnly: this.props.readOnly,
        viewportMargin: Infinity,
        extraKeys: {"Ctrl-Space": "autocomplete"},
        gutters: ["CodeMirror-lint-markers"],
        lint: true,
      });
      let pieces = [];
      let id = window.gcexports.id;
      if (id) {
        id = window.gcexports.encodeID(window.gcexports.decodeID(id), true); // hash it
        $.get(location.origin + "/code?id=" + id, function (data) {
          updateSrc(id, data.src);
        });
      } else {
        console.log("ERROR missing ID");
      }
      let updateSrc = window.gcexports.updateSrc = function updateSrc(id, src) {
        window.gcexports.parent = window.gcexports.id;
        window.gcexports.id = id;
        window.gcexports.firstTime = true;
        window.gcexports.updateMark(id);
        if (src) {
          // Avoid adding newlines for commands that begin with \n
          src = src.split(/\\n[^abcdefghijklmnopqrstuvwxyz]/); // number, ne, ngtr, nless
          editor.setValue(src.join("\n"));
        }
      };
    }
  }

  componentDidUpdate() {
  }

  handleChange() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  }

  render() {
    // wrap in a div to fully contain CodeMirror
    var editor = <textarea ref="editor" defaultValue={this.props.codeText} />;
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

class SourceView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {code: this.props.codeText}
  }

  componentDidUpdate() {
    clearTimeout(this.timeoutID);
  }

  setTimeout() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }

  render() {
    return (
      <div className="playground">
        <div className="playgroundCode">
          <CodeMirrorEditor
            className="playgroundStage"
            codeText={this.props.codeText}
            lineNumbers={this.props.showLineNumbers}
          />
        </div>
      </div>
    );
  }

  componentDidMount() {
    $(document.body).on('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps, prevState) {
  }
}

SourceView.propTypes = {
  codeText: PropTypes.string.isRequired,
  transformer: PropTypes.func,
  renderCode: PropTypes.bool,
  showCompiledJSTab: PropTypes.bool,
  showLineNumbers: PropTypes.bool,
  editorTabTitle: PropTypes.string
};

SourceView.defaultProps = {
  editorTabTitle: 'Source',
  showCompiledJSTab: true,
  showLineNumbers: true,
  codeText: ".",
};

export default SourceView;
