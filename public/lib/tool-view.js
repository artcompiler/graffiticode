define(["exports", "module", "../lib/graff-view"], function (exports, module, _libGraffView) {
  /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
  /* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _GraffView = _interopRequireDefault(_libGraffView);

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
  var ToolContent = React.createClass({
    displayName: "ToolContent",

    hideItem: function hideItem(e, id) {
      $.ajax({
        type: "PUT",
        url: "/label",
        data: {
          id: id,
          label: "hide" },
        dataType: "text",
        success: function success(data) {},
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    },
    showItem: function showItem() {
      var exports = window.exports;
      var id = exports.id;
      var el = React.findDOMNode(this);
      $.ajax({
        type: "PUT",
        url: "/label",
        data: {
          id: id,
          label: "show" },
        dataType: "text",
        success: function success(data) {
          d3.select(el).select("#save").style("visibility", "hidden");
        },
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    },
    componentDidMount: function componentDidMount() {
      var el = React.findDOMNode(this);
      ToolView.dispatchToken = window.dispatcher.register(this.onChange);
      this.isDirty = false;
      d3.select(el).select("#save").on("click", this.onClick);
    },
    componentDidUpdate: function componentDidUpdate() {},
    onChange: function onChange(data) {
      window.dispatcher.waitFor([_GraffView["default"].dispatchToken]);
      if (!window.exports.id) {
        return;
      }
      var el = React.findDOMNode(this);
      d3.select(el).select("#save").style("visibility", "visible");
    },
    onClick: function onClick(e) {
      this.showItem();
    },
    render: function render() {
      return React.createElement(
        "svg",
        { height: "40", width: "100%", style: { background: "rgb(240, 240, 240)" } },
        React.createElement(
          "g",
          null,
          React.createElement(
            "circle",
            { id: "save", r: "12", cx: "30", cy: "20", style: { fill: "#555", visibility: "hidden" } },
            React.createElement(
              "title",
              null,
              "Save"
            )
          ),
          React.createElement(
            "title",
            null,
            "Saved"
          )
        )
      );
    } });
  var ToolView = React.createClass({
    displayName: "ToolView",

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
      return React.createElement(ToolContent, { className: "toolContentStage" });
    },
    componentDidMount: function componentDidMount() {},
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {} });
  module.exports = ToolView;
});

//hideItem(id);
