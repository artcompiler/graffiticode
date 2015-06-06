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
    let exports = window.exports;
    let editor = window.exports.editor = this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
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
    let pieces = [];
    let id = +exports.id;
    if (id) {
      $.get("http://"+location.host+"/code/" + id, function (data) {
        updateSrc(data[0].id, data[0].src);
      });
    } else {
      $.ajax({
        type: "GET",
        url: "/pieces/" + exports.language,
        data: {},
        dataType: "json",
        success: function(data) {
          let pieces = [];
          for (var i = 0; i < data.length; i++) {
            pieces[i] = data[i].id;
          }
          exports.pieces = pieces;
          $.get("http://"+location.host+"/code/"+pieces[0], function (data) {
            updateSrc(data[0].id, data[0].src);
          });
        },
        error: function(xhr, msg, err) {
          console.log(msg+" "+err)
        }
      });
    }
    function updateSrc(id, src) {
      exports.parent = exports.id;
      exports.id = id;
      if (src) {
        editor.setValue(src.split(/\\n[^umber]/).join("\n"));
      }
    };
  },
  componentDidUpdate: function() {    
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
      codeText: ".",
    };
  },
  getInitialState: function() {
    return {
      code: this.props.codeText,
    };
  },
  handleKeyDown: function (e) {
    console.log("handleKeyDown() e=" + e.keyCode);
  },
  render: function() {
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
  },
  componentDidMount: function() {
    $(document.body).on('keydown', this.handleKeyDown);
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
});
export default SourceView;