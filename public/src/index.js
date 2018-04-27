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
  let isNew = d3.select("button#signin").classed("is-signup");
  $.ajax({
    type: "POST",
    url: "/signIn",
    data: {
      name: name,
      number: number,
      isNew: isNew,
    },
    dataType: "json",
    success: function(data) {
      if (data.err && data.err.code) {
        switch (data.err.code) {
        case 1000:
          if (!isNew) {
            // signin --> signup
            d3.select("input#name-txt").classed("is-valid", true);
            d3.select("input#number-txt").classed("is-valid", true);
            d3.select("div#name-feedback").classed("valid-feedback", true).text("New user? Sign-up!");
            d3.select("button#signin").html("SIGN UP");
            d3.select("button#signin").classed("btn-outline-secondary", false);
            d3.select("button#signin").classed("btn-success", true);
            d3.select("button#signin").classed("is-signup", true);
            return;
          }
          break;
        case 1001:
          d3.select("input#name-txt").classed("is-invalid", true);
          d3.select("div#name-feedback").classed("invalid-feedback", true).text("Letters, numbers and spaces only.");
          break;
        case 1002:
          d3.select("input#number-txt").classed("is-invalid", true);
          d3.select("div#number-feedback").classed("invalid-feedback", true).text("If a non-US, use int'l '+' format.");
          return;
        case 1003:
          d3.select("input#name-txt").classed("is-invalid", true);
          d3.select("input#number-txt").classed("is-invalid", true);
          d3.select("div#name-feedback").classed("invalid-feedback", true).text(data.err.message);
          return;
        case 1004:
          d3.select("input#passcode-txt").classed("is-invalid", true);
          d3.select("div#passcode-feedback").classed("invalid-feedback", true).text(data.err.message);
          
          return;
        }
      }
      signInJWT = data.jwt;
      d3.select("form#signin").style("display", "none");
      d3.select("form#passcode").style("display", "block");
      d3.select("input#passcode-txt").node().focus();
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
      if (data.err && data.err.code) {
        switch (data.err.code) {
        case 1004:
          d3.select("input#passcode-txt").classed("is-invalid", true);
          d3.select("div#passcode-feedback").classed("invalid-feedback", true).text(data.err.message);
          d3.select("button#passcode").html("RETRY");
          d3.select("button#passcode").classed("btn-success", false);
          d3.select("button#passcode").classed("btn-danger", true);
          d3.select("button#passcode").attr("id", "retry");
          return;
        }
      }
      data = data;
      localStorage.setItem("accessToken", data.jwt);
      d3.select("form#passcode").style("display", "none");
      d3.select("form#signout").style("display", "block");
    },
    error: function(xhr, msg, err) {
      console.log("ERROR " + msg + " " + err);
    }
  });
}
function signOut() {
  // Restore sign-in state.
  localStorage.removeItem("accessToken");
  d3.select("input#name-txt").classed("is-valid", false);
  d3.select("input#number-txt").classed("is-valid", false);
  d3.select("div#name-feedback").classed("valid-feedback", false).text("");
  d3.select("button#signin").html("SIGN IN");
  d3.select("button#signin").classed("is-signup", false);
  d3.select("input#passcode-txt")[0][0].value = "";
}
window.handleSignInBlur = (e) => {
  switch (e.target.id) {
  case "name-txt":
    d3.select("input#name-txt").classed("is-invalid", false);
    d3.select("#name-feedback").classed("invalid-feedback", false).text("");
    break;
  case "number-txt":
    d3.select("input#number-txt").classed("is-invalid", false);
    d3.select("#number-feedback").classed("invalid-feedback", false).text("");
    break;
  case "passcode-txt":
    d3.select("input#passcode-txt").classed("is-invalid", false);
    d3.select("#passcode-feedback").classed("invalid-feedback", false).text("");
    break;
  }
}
window.handleSignInClick = (e) => {
  switch (e.target.id) {
  case "signin":
    let name = d3.select("#name-txt")[0][0].value
    let number = d3.select("#number-txt")[0][0].value
    signIn(name, number);
    break;
  case "passcode":
    let passcode = d3.select("#passcode-txt")[0][0].value
    finishSignIn(passcode);
    break;
  case "retry":
    d3.select("button#retry").attr("id", "passcode");
    d3.select("button#passcode").classed("btn-danger", false);
    d3.select("button#passcode").classed("btn-success", true);
    d3.select("button#passcode").html("VERIFY");
    d3.select("input#passcode-txt").classed("is-invalid", false);
    d3.select("#passcode-txt")[0][0].value = "";
    d3.select("div#passcode-feedback").classed("invalid-feedback", false).text("");
    d3.select("form#passcode").style("display", "none");
    d3.select("form#signin").style("display", "block");
    break;
  case "signout":
    d3.select("form#signout").style("display", "none");
    d3.select("form#signin").style("display", "block");
    signOut();
    break;
  }
}
window.handleViewClick = function (e) {
  let id = e.target.id;
  let show = !d3.select("#" + id).classed("btn-secondary");
  d3.select("#" + id).classed("btn-outline-secondary", !show);
  d3.select("#" + id).classed("btn-secondary", show);
  let selector;
  switch (id) {
  case "help-btn":
    selector = "#help-view";
    localStorage.setItem("helpView", show);
    break;
  case "find-btn":
    window.gcexports.archive = show;  // Avoid unnecessary computation.
    selector = "#archive-view";
    localStorage.setItem("findView", show);
    break;
  case "code-btn":
    selector = "#src-view";
    localStorage.setItem("codeView", show);
    break;
  case "form-btn":
    selector = "#graff-view";
    localStorage.setItem("formView", show);
    break;
  case "data-btn":
    selector = "#obj-view";
    localStorage.setItem("dataView", show);
    break;
  default:
    break;
  }
  dispatch({});
  d3.select(selector).style("display", show ? "block" : "none");
}
const btnOn = "btn-secondary";
const btnOff = "btn-outline-secondary";
window.onload = () => {
  let helpID = window.gcexports.helpID || "XZLuq1vYIM";
  // Restore state of the app.
  let helpView = localStorage.getItem("helpView") === "true";
  d3.select("button#help-btn").classed("btn-secondary", helpView);
  d3.select("button#help-btn").classed("btn-outline-secondary", !helpView);
  d3.select("button#help-btn").style("display", "block");
  d3.select("div#help-view").html("<iframe frameBorder='0' width='100%' height='300' src='/form?id=" + helpID + "'></iframe>");
  d3.select("div#help-view").style("display", helpView ? "block" : "none");
  let findView = localStorage.getItem("findView") === "true";
  d3.select("button#find-btn").classed("btn-secondary", findView);
  d3.select("button#find-btn").classed("btn-outline-secondary", !findView);
  d3.select("button#find-btn").style("display", "block");
  d3.select("div#archive-view").style("display", findView ? "block" : "none");
  window.gcexports.archive = findView;  // Avoid unnecessary computation.
  // For now, always open code view on reload to avoid code loading bug.
  let codeView = true; //localStorage.getItem("codeView") !== "false";
  d3.select("button#code-btn").classed("btn-secondary", codeView);
  d3.select("button#code-btn").classed("btn-outline-secondary", !codeView);
  d3.select("button#code-btn").style("display", "block");
  d3.select("div#src-view").style("display", codeView ? "block" : "none");
  let formView = localStorage.getItem("formView") !== "false";
  d3.select("button#form-btn").classed("btn-secondary", formView);
  d3.select("button#form-btn").classed("btn-outline-secondary", !formView);
  d3.select("button#form-btn").style("display", "block");
  d3.select("div#graff-view").style("display", formView ? "block" : "none");
  let dataView = localStorage.getItem("dataView") === "true";
  d3.select("button#data-btn").classed("btn-secondary", dataView);
  d3.select("button#data-btn").classed("btn-outline-secondary", !dataView);
  d3.select("button#data-btn").style("display", "block");
  d3.select("div#obj-view").style("display", dataView ? "block" : "none");
  if (localStorage.getItem("accessToken")) {
    d3.select("form#signout").style("display", "block");
  } else {
    d3.select("form#signin").style("display", "block");
  }
};
