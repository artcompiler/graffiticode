import * as React from "react";
import * as ReactDOM from "react-dom";
import GraffView from "./graff-view";
import Dispatcher from "./Dispatcher";
// This is the one and only dispatcher. It is used by embedded views as well.
try {
  window.gcexports.dispatcher = window.parent.gcexports && window.parent.gcexports.dispatcher
                              ? window.parent.gcexports.dispatcher
    : new Dispatcher;
} catch (x) {
  // Catch cross domain error.
  window.gcexports.dispatcher = new Dispatcher;
}
ReactDOM.render(
  React.createElement(GraffView, null),
  document.getElementById('graff-view')
);
