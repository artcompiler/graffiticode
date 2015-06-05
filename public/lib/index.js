define(["exports", "../lib/tool-view", "../lib/src-view", "../lib/graff-view", "../lib/obj-view", "../lib/Dispatcher"], function (exports, _libToolView, _libSrcView, _libGraffView, _libObjView, _libDispatcher) {
  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _ToolView = _interopRequireDefault(_libToolView);

  var _SourceView = _interopRequireDefault(_libSrcView);

  var _GraffView = _interopRequireDefault(_libGraffView);

  var _ObjectView = _interopRequireDefault(_libObjView);

  var _Dispatcher = _interopRequireDefault(_libDispatcher);

  // This is the one and only dispatcher.
  window.dispatcher = new _Dispatcher["default"]();
  React.render(React.createElement(_ToolView["default"], null), document.getElementById("tool-view"));
  React.render(React.createElement(_SourceView["default"], null), document.getElementById("src-view"));
  React.render(React.createElement(_GraffView["default"], null), document.getElementById("graff-view"));
  React.render(React.createElement(_ObjectView["default"], null), document.getElementById("obj-view"));
});
