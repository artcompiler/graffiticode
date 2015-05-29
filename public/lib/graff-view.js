define(["exports", "module"], function (exports, module) {
  /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
  /* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
  "use strict";

  var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);
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
    }) };
  var GraffContent = React.createClass({
    displayName: "GraffContent",

    componentDidMount: function componentDidMount() {
      GraffContent.dispatchToken = window.dispatcher.register(this.onChange);
    },
    componentDidUpdate: function componentDidUpdate() {
      var el = React.findDOMNode(this);
      if (this.state) {
        viewer.update(el, this.state);
      }
    },
    onChange: function onChange(data) {
      this.setState(data);
    },
    render: function render() {
      return React.createElement(
        "svg",
        { height: "380", width: "100%" },
        React.createElement(
          "g",
          null,
          React.createElement("rect", { width: "100%", height: "100%", fill: "#ffffff" })
        )
      );
    } });
  var GraffView = React.createClass({
    displayName: "GraffView",

    mixins: [selfCleaningTimeout],
    MODES: {},
    propTypes: {},
    getDefaultProps: function getDefaultProps() {
      return {};
    },
    getInitialState: function getInitialState() {
      return {};
    },
    render: function render() {
      return React.createElement(GraffContent, { className: "graffContentStage" });
    },
    componentDidMount: function componentDidMount() {},
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {} });
  module.exports = GraffView;
});
