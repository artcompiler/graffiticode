define(['exports', 'module', '../lib/Dispatcher.js'], function (exports, module, _libDispatcherJs) {
  /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
  /* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _Dispatcher = _interopRequireDefault(_libDispatcherJs);

  var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);
  var CodeMirrorEditor = React.createClass({
    displayName: 'CodeMirrorEditor',

    propTypes: {
      lineNumbers: React.PropTypes.bool,
      onChange: React.PropTypes.func
    },
    getDefaultProps: function getDefaultProps() {
      return {
        lineNumbers: false };
    },
    componentDidMount: function componentDidMount() {
      if (IS_MOBILE) {
        return;
      }
      var exports = window.exports;
      var editor = window.exports.editor = this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
        mode: 'graffiti',
        lineNumbers: this.props.lineNumbers,
        lineWrapping: true,
        smartIndent: true,
        matchBrackets: true,
        theme: 'neat',
        readOnly: this.props.readOnly,
        viewportMargin: Infinity,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
        gutters: ['CodeMirror-lint-markers'],
        lint: true });
      var pieces = [];
      var id = +exports.id;
      if (id) {
        $.get('http://' + location.host + '/code/' + id, function (data) {
          updateSrc(data[0].id, data[0].src);
        });
      } else {
        $.ajax({
          type: 'GET',
          url: '/pieces/' + exports.language,
          data: {},
          dataType: 'json',
          success: function success(data) {
            var pieces = [];
            for (var i = 0; i < data.length; i++) {
              pieces[i] = data[i].id;
            }
            exports.pieces = pieces;
            $.get('http://' + location.host + '/code/' + pieces[0], function (data) {
              updateSrc(data[0].id, data[0].src);
            });
          },
          error: function error(xhr, msg, err) {
            console.log(msg + ' ' + err);
          }
        });
      }
      function updateSrc(id, src) {
        exports.parent = exports.id;
        exports.id = id;
        if (src) {
          editor.setValue(src.split(/\\n[^umber]/).join('\n'));
        }
      };
    },
    componentDidUpdate: function componentDidUpdate() {},
    handleChange: function handleChange() {
      if (!this.props.readOnly) {
        this.props.onChange && this.props.onChange(this.editor.getValue());
      }
    },
    render: function render() {
      // wrap in a div to fully contain CodeMirror
      var editor;
      if (IS_MOBILE) {
        editor = React.createElement(
          'pre',
          { style: { overflow: 'scroll' } },
          this.props.codeText
        );
      } else {
        editor = React.createElement('textarea', { ref: 'editor', defaultValue: this.props.codeText });
      }
      return React.createElement(
        'div',
        { style: this.props.style, className: this.props.className },
        editor
      );
    }
  });
  var selfCleaningTimeout = {
    componentDidUpdate: function componentDidUpdate() {
      clearTimeout(this.timeoutID);
    },
    setTimeout: (function (_setTimeout) {
      function setTimeout() {
        return _setTimeout.apply(this, arguments);
      }

      setTimeout.toString = function () {
        return _setTimeout.toString();
      };

      return setTimeout;
    })(function () {
      clearTimeout(this.timeoutID);
      this.timeoutID = setTimeout.apply(null, arguments);
    })
  };
  var SourceView = React.createClass({
    displayName: 'SourceView',

    mixins: [selfCleaningTimeout],
    propTypes: {
      codeText: React.PropTypes.string.isRequired,
      transformer: React.PropTypes.func,
      renderCode: React.PropTypes.bool,
      showCompiledJSTab: React.PropTypes.bool,
      showLineNumbers: React.PropTypes.bool,
      editorTabTitle: React.PropTypes.string
    },
    getDefaultProps: function getDefaultProps() {
      return {
        editorTabTitle: 'Source',
        showCompiledJSTab: true,
        showLineNumbers: true,
        codeText: '.' };
    },
    getInitialState: function getInitialState() {
      return {
        code: this.props.codeText };
    },
    handleKeyDown: function handleKeyDown(e) {
      console.log('handleKeyDown() e=' + e.keyCode);
    },
    render: function render() {
      return React.createElement(
        'div',
        { className: 'playground' },
        React.createElement(
          'div',
          { className: 'playgroundCode' },
          React.createElement(CodeMirrorEditor, {
            className: 'playgroundStage',
            codeText: this.props.codeText,
            lineNumbers: this.props.showLineNumbers
          })
        )
      );
    },
    componentDidMount: function componentDidMount() {
      $(document.body).on('keydown', this.handleKeyDown);
    },
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {} });
  module.exports = SourceView;
});
