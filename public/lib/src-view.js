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
      this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
        mode: 'graffiti',
        lineNumbers: this.props.lineNumbers,
        lineWrapping: true,
        smartIndent: true,
        matchBrackets: true,
        theme: 'neat',
        readOnly: this.props.readOnly,
        viewportMargin: Infinity,
        extraKeys: { 'Ctrl-Space': 'autocomplete' } });
      this.editor.on('change', this.handleChange);
    },
    componentDidUpdate: function componentDidUpdate() {
      if (this.props.readOnly) {
        this.editor.setValue(this.props.codeText);
      }
    },
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
    MODES: { JSX: 'JSX', JS: 'JS' }, //keyMirror({JSX: true, JS: true}),
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
        codeText: 'equivSymbolic "10" "20-10"..' };
    },
    getInitialState: function getInitialState() {
      return {
        mode: this.MODES.JSX,
        code: this.props.codeText };
    },
    handleCodeChange: function handleCodeChange(value) {},
    handleCodeModeSwitch: function handleCodeModeSwitch(mode) {},
    compileCode: function compileCode() {},
    render: function render() {
      var isJS = this.state.mode === this.MODES.JS;
      var compiledCode = '';
      try {
        compiledCode = this.compileCode();
      } catch (err) {}
      return React.createElement(
        'div',
        { className: 'playground' },
        React.createElement(
          'div',
          { className: 'playgroundCode' },
          React.createElement(CodeMirrorEditor, {
            key: 'jsx',
            onChange: this.handleCodeChange,
            className: 'playgroundStage',
            codeText: 'equivSymbolic "10" "20-10"..',
            lineNumbers: this.props.showLineNumbers
          })
        )
      );
    },
    componentDidMount: function componentDidMount() {
      this.executeCode();
    },
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
      // execute code only when the state's not being updated by switching tab
      // this avoids re-displaying the error, which comes after a certain delay
      if (this.props.transformer !== prevProps.transformer || this.state.code !== prevState.code) {
        this.executeCode();
      }
    },
    executeCode: function executeCode() {
      return;
      var mountNode = React.findDOMNode(this.refs.mount);
      try {
        React.unmountComponentAtNode(mountNode);
      } catch (e) {}
      try {
        var compiledCode = this.compileCode();
        if (this.props.renderCode) {
          React.render(React.createElement(CodeMirrorEditor, { codeText: compiledCode, readOnly: true }), mountNode);
        } else {
          eval(compiledCode);
        }
      } catch (err) {
        this.setTimeout(function () {
          React.render(React.createElement(
            'div',
            { className: 'playgroundError' },
            'ERROR:' + err.toString()
          ), mountNode);
        }, 500);
      }
    }
  });
  module.exports = SourceView;
});
