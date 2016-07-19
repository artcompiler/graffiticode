import * as React from "react";
import * as ReactDOM from "react-dom";
import GraffView from "./graff-view";
import Dispatcher from "./Dispatcher";
window.dispatcher = new Dispatcher;
ReactDOM.render(
  React.createElement(GraffView, null),
  document.getElementById('graff-view')
);
