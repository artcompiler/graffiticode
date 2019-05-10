import * as React from "react";
import * as ReactDOM from "react-dom";
import AlertView from "./alert-view";
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
ReactDOM.render(
 React.createElement(AlertView, null),
 document.getElementById('alert-view')
);
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
      localStorage.setItem("accessToken", data.jwt);
      localStorage.setItem("userID", data.userID);
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
  localStorage.removeItem("userID");
  d3.select("input#name-txt").classed("is-valid", false);
  d3.select("input#number-txt").classed("is-valid", false);
  d3.select("div#name-feedback").classed("valid-feedback", false).text("");
  d3.select("button#signin").html("SIGN IN");
  d3.select("button#signin").classed("is-signup", false);
  d3.select("input#passcode-txt").node().value = "";
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
    let name = d3.select("input#name-txt").node().value
    let number = d3.select("input#number-txt").node().value
    signIn(name, number);
    break;
  case "passcode":
    let passcode = d3.select("input#passcode-txt").node().value
    finishSignIn(passcode);
    break;
  case "retry":
    d3.select("button#retry").attr("id", "passcode");
    d3.select("button#passcode").classed("btn-danger", false);
    d3.select("button#passcode").classed("btn-success", true);
    d3.select("button#passcode").html("VERIFY");
    d3.select("input#passcode-txt").classed("is-invalid", false);
    d3.select("#passcode-txt").node().value = "";
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
  let language = window.gcexports.language;
  let id = e.target.id;
  let show = !d3.select("#" + id).classed("btn-secondary");
  d3.select("#" + id).classed("btn-outline-secondary", !show);
  d3.select("#" + id).classed("btn-secondary", show);
  let selector, target;
  switch (id) {
  case "help-btn":
    selector = "#help-view";
    localStorage.setItem("helpView-" + language, show);
    d3.select("button#help-btn").attr("title", show ? "Hide help view" : "Show help view");
    break;
  case "find-btn":
    window.gcexports.archive = show;  // Avoid unnecessary computation.
    selector = "#archive-view";
    localStorage.setItem("findView-" + language, show);
    d3.select("button#find-btn").attr("title", show ? "Hide find view" : "Show find view");
    break;
  case "code-btn":
    selector = "#src-view";
    localStorage.setItem("codeView-" + language, show);
    if (show) {
      let itemID = window.gcexports.id;
      let ids = window.gcexports.decodeID(itemID);
      let codeID = ids[1];
      if (codeID !== 0) {
        $.get(location.origin + "/code?id=" + codeID, function (data) {
          window.gcexports.updateSrc(codeID, data.src);
        });
      }
    }
    d3.select("button#code-btn").attr("title", show ? "Hide code view" : "Show code view");
    break;
  case "form-btn":
    selector = "#graff-view";
    localStorage.setItem("formView-" + language, show);
    d3.select("button#form-btn").attr("title", show ? "Hide form view" : "Show form view");
    break;
  case "data-btn":
    selector = "#obj-view";
    localStorage.setItem("dataView-" + language, show);
    if (show) {
      let itemID = window.gcexports.id;
      let dataID = window.gcexports.encodeID(window.gcexports.decodeID(itemID).slice(2));
      $.get(location.origin + "/data?id=" + dataID, function (data) {
        window.gcexports.updateObj(dataID, data);
      });
    }
    d3.select("button#data-btn").attr("title", show ? "Hide data view" : "Show data view");
    break;
  default:
    break;
  }
  dispatch({});
  d3.select(selector).style("display", show ? "block" : "none");
  if (show) {
    d3.select(selector).node().scrollIntoView(true);
  } else {
    window.scrollTo(0, 0);
  }
}
window.handleOpenClick = function (e) {
  e.preventDefault();
  let url, name;
  let id = window.gcexports.id;
  switch (e.target.id) {
  case "open-fork":
    url = "/item?id=" + id + "&fork=true";
    break;
  case "open-data":
    url = "/d/" + id;
    break;
  case "open-form":
    url = "/form?id=" + id;
    break;
  case "open-snap":
    // let html = d3.select("#graff-view").html();
    // putSnap(html, (err, val) => {
    //   url = "/snap?id=" + id;
    //   let win = window.open(url, id);
    // });
    // return;
    url = "/snap?id=" + id + "&fmt=png&refresh=true";
    break;
  }
  let win = window.open(url, id);
}
function putSnap(img, resume) {
  $.ajax({
    type: "PUT",
    url: "/snap",
    data: {
      id: window.gcexports.id,
      img: img,
    },
    dataType: "text",
    success: function(data) {
      resume(null, data);
    },
    error: function(xhr, msg, err) {
      console.log("Unable to submit code. Probably due to a SQL syntax error");
    }
  });
}
window.handleRefresh = () => {
  // let state = {}
  // let id = window.gcexports.id;
  // state[id] = {
  //   id: id,
  // };
  // window.gcexports.dispatcher.dispatch(state);
  window.location.href = "/item" + "?id=" + window.gcexports.id + "&refresh=true";
}
function putMark(mark, resume) {
  let userID = localStorage.getItem("userID");
  let itemID = window.gcexports.id;
  $.ajax({
    type: "PUT",
    url: "/stat",
    data: {
      userID: userID,
      itemID: itemID,
      mark: mark,
    },
    dataType: "text",
    success: function(data) {
      resume && resume(null, data);
    },
    error: function(xhr, msg, err) {
      console.log("Unable to submit code. Probably due to a SQL syntax error");
    }
  });
}
function updateMark(id) {
  let user = localStorage.getItem("userID");
  $.get(location.origin + "/stat?id=" + id + "&user=" + user, function (data) {
    let mark = data[0] && data[0].mark;
    localStorage.setItem("markItem", mark);
    colorMark();
  });
}
window.gcexports.updateMark = updateMark;
const CLEAR = "#FEFEFE";
const YELLOW = "#E7B416";
const RED = "#CC3232";
const GREEN = "#2DC937";
function colorMark() {
  let state = +localStorage.getItem("markItem");
  let color;
  switch (state) {
  default:
    color = "#FEFEFE";  // clear
    break;
  case 0:
    color = "#E7B416";  // yellow
    break;
  case -1:
    color = "#CC3232";  // red
    break;
  case 1:
    color = "#2DC937";  // green
    break;
  }
  d3.select("#mark-circle").attr("fill", color);
}
window.handleMark = (e) => {
  let mark = +localStorage.getItem("markItem");
  switch (mark) {
  case -1:
    mark = null;
    break;
  case 1:
    mark = 0;
    break;
  case 0:
    mark = -1;
    break;
  default:
    mark = 1;
    break;
  }
  localStorage.setItem("markItem", mark);
  colorMark();
  putMark(mark);
}
const btnOn = "btn-secondary";
const btnOff = "btn-outline-secondary";
window.onload = () => {
  window.gcexports._id = window.gcexports.id;
  Object.defineProperty(window.gcexports, 'id', {
    get: function() { return this._id },
    set: function(id) { this._id = id }
  });
  let href = document.location.href;
  let language = window.gcexports.language;
  let hideViews;
  if (!window.gcexports.globalLexicon) {
    // Apparently this language is not available. Tell user.
    d3.select("#alert-view").html(
      "<div class='alert alert-danger' role='alert'>" +
      window.gcexports.language +
      " is currently unavailable.</div>");
    hideViews = true;
  }
  let helpID = window.gcexports.helpID;
  // Restore state of the app.
  if (helpID) {
    let helpView = hideViews ? false : localStorage.getItem("helpView-" + language) === "true";
    d3.select("button#help-btn").classed("btn-secondary", helpView);
    d3.select("button#help-btn").classed("btn-outline-secondary", !helpView);
    d3.select("button#help-btn").style("display", helpID ? "block" : "none");
    d3.select("div#help-view").html("<iframe frameBorder='0' width='100%' height='600px' src='/form?id=" + helpID + "'></iframe>");
    d3.select("div#help-view").style("display", helpView ? "block" : "none");
    d3.select("button#help-btn").attr("title", helpView ? "Hide help view" : "Show help view");
  }
  let findView = hideViews ? false : localStorage.getItem("findView-" + language) === "true";
  d3.select("button#find-btn").classed("btn-secondary", findView);
  d3.select("button#find-btn").classed("btn-outline-secondary", !findView);
  d3.select("button#find-btn").style("display", "block");
  d3.select("button#find-btn").attr("title", findView ? "Hide find view" : "Show find view");
  d3.select("div#archive-view").style("display", findView ? "block" : "none");
  window.gcexports.archive = findView;  // Avoid unnecessary computation.
  // For now, always open code view on reload to avoid code loading bug.
  let codeView = hideViews ? false : localStorage.getItem("codeView-" + language) !== "false";
  d3.select("button#code-btn").classed("btn-secondary", codeView);
  d3.select("button#code-btn").classed("btn-outline-secondary", !codeView);
  d3.select("button#code-btn").style("display", "block");
  d3.select("button#code-btn").attr("title", codeView ? "Hide code view" : "Show code view");
  d3.select("div#src-view").style("display", codeView ? "block" : "none");
  let formView = hideViews ? false : localStorage.getItem("formView-" + language) !== "false";
  d3.select("button#form-btn").classed("btn-secondary", formView);
  d3.select("button#form-btn").classed("btn-outline-secondary", !formView);
  d3.select("button#form-btn").style("display", "block");
  d3.select("button#form-btn").attr("title", formView ? "Hide form view" : "Show form view");
  d3.select("div#graff-view").style("display", formView ? "block" : "none");
  let dataView = hideViews ? false : localStorage.getItem("dataView-" + language) === "true";
  d3.select("button#data-btn").classed("btn-secondary", dataView);
  d3.select("button#data-btn").classed("btn-outline-secondary", !dataView);
  d3.select("button#data-btn").style("display", "block");
  d3.select("button#data-btn").attr("title", dataView ? "Hide data view" : "Show data view");
  d3.select("div#obj-view").style("display", dataView ? "block" : "none");
  updateMark(window.gcexports.id);
  d3.select("button#mark-btn").style("display", "block");
  d3.selectAll("a.nav-link").style("display", "block");
  if (localStorage.getItem("accessToken")) {
    d3.select("form#signout").style("display", "block");
  } else {
    d3.select("form#signin").style("display", "block");
  }
};
