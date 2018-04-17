import * as React from "react";
import * as ReactDOM from "react-dom";
import ToolView from "./tool-view";
import SourceView from "./src-view";
import GraffView from "./graff-view";
import ObjectView from "./obj-view";
import ArchiveView from "./archive-view";
import Dispatcher from "./Dispatcher";
// This is the one and only dispatcher. It is used by embedded views as well.
window.gcexports.dispatcher = window.parent.gcexports && window.parent.gcexports.dispatcher
                              ? window.parent.gcexports.dispatcher
                              : new Dispatcher;
let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});
//ReactDOM.render(
//  React.createElement(ToolView, null),
//  document.getElementById('tool-view')
//);
ReactDOM.render(
 React.createElement(ArchiveView, null),
 document.getElementById('archive-view')
);
ReactDOM.render(
  React.createElement(SourceView, null),
  document.getElementById('src-view')
);
ReactDOM.render(
  React.createElement(GraffView, null),
  document.getElementById('graff-view')
);
ReactDOM.render(
  React.createElement(ObjectView, null),
  document.getElementById('obj-view')
);
let signInJWT;
function signIn(name, number) {
  $.ajax({
    type: "POST",
    url: "/signIn",
    data: {
      name: name,
      number: number,
    },
    dataType: "json",
    success: function(data) {
      signInJWT = data.jwt;
    },
    error: function(xhr, msg, err) {
      console.log("ERROR " + msg + " " + err);
    }
  });
}
function finishSignIn(passcode) {
  $.ajax({
    type: "POST",
    url: "/finishSignIn",
    data: {
      jwt: signInJWT,
      passcode: passcode,
    },
    dataType: "json",
    success: function(data) {
      data = data;
    },
    error: function(xhr, msg, err) {
      console.log("ERROR " + msg + " " + err);
    }
  });
}
window.handleSignInClick = function handleSignInClick(e) {
  switch (e.target.id) {
  case "signin":
    let name = d3.select("#name-txt")[0][0].value
    let number = d3.select("#number-txt")[0][0].value
    d3.select("form#signin").style("display", "none");
    d3.select("form#passcode").style("display", "block");
    signIn(name, number);
    break;
  case "passcode":
    let passcode = d3.select("#passcode-txt")[0][0].value
    d3.select("form#passcode").style("display", "none");
    d3.select("form#signout").style("display", "block");
    finishSignIn(passcode);
    break;
  case "signout":
    d3.select("form#signout").style("display", "none");
    d3.select("form#signin").style("display", "block");
    break;
  }
}
window.handleViewClick = function handleSignInClick(e) {
  let id = e.target.id;
  let show = !d3.select("#" + id).classed("btn-success");
  d3.select("#" + id).classed("btn-outline-secondary", !show);
  d3.select("#" + id).classed("btn-success", show);
  let selector;
  switch (id) {
  case "repo-btn":
    window.gcexports.archive = show;
    selector = "#archive-view";
    break;
  case "docs-btn":
    selector = "#docs-view";
    break;
  case "code-btn":
    selector = "#src-view";
    break;
  case "form-btn":
    selector = "#graff-view";
    break;
  case "data-btn":
    window.gcexports.showdata = show;
    selector = "#obj-view";
    break;
  default:
    break;
  }
  dispatch({});
  d3.select(selector).style("display", show ? "block" : "none");
}
