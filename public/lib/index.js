define(["exports", "../lib/src-view", "../lib/graff-view", "../lib/Dispatcher"], function (exports, _libSrcView, _libGraffView, _libDispatcher) {
  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _SourceView = _interopRequireDefault(_libSrcView);

  var _GraffView = _interopRequireDefault(_libGraffView);

  var _Dispatcher = _interopRequireDefault(_libDispatcher);

  // This is the one and only dispatcher.
  window.dispatcher = new _Dispatcher["default"]();
  React.render(React.createElement(_SourceView["default"], null), document.getElementById("src-view"));
  React.render(React.createElement(_GraffView["default"], null), document.getElementById("graff-view"));
});
