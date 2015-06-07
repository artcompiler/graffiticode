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
      GraffView.dispatchToken = window.dispatcher.register(this.onChange);
      this.isDirty = false;
    },
    componentDidUpdate: function componentDidUpdate() {
      var viewer = window.exports.viewer;
      var el = React.findDOMNode(this);
      if (this.state && !this.state.error) {
        var pool = this.state.pool;
        var src = this.state.src;
        var obj = this.state.obj;
        viewer.update(el, obj, src, pool);
        if (this.state.postCode) {
          var img = viewer.capture(el);
          postPiece(pool, src, obj, img);
        }
      }
      function postPiece(pool, src, obj, img) {
        var exports = window.exports;
        var user = $("#username").data("user");
        src = src.replace(/\\/g, "\\\\");
        var parent = exports.parent;
        var language = exports.language;
        $.ajax({
          type: "POST",
          url: "/code",
          data: {
            src: src,
            ast: pool,
            obj: obj,
            img: img.replace(/\\/g, "\\\\"),
            user: user ? user.id : 1,
            parent: parent,
            language: language,
            label: "show" },
          dataType: "json",
          success: function success(data) {
            // FIXME add to state
            exports.id = data.id;
            exports.gist_id = data.gist_id;
            window.history.pushState("object or string", "title", "/item?id=" + data.id);
          },
          error: function error(xhr, msg, err) {
            console.log("Unable to submit code. Probably due to a SQL syntax error");
          }
        });
      }
    },
    onChange: function onChange(data) {
      this.replaceState(data);
    },
    render: function render() {
      return React.createElement(
        "svg",
        { height: "0", width: "100%", style: { background: "white" } },
        React.createElement(
          "g",
          null,
          React.createElement("rect", { width: "100%", height: "100%", fill: "white" })
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
