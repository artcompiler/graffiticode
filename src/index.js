import * as React from "react";
import * as ReactDOM from "react-dom";
import AlertView from "./alert-view";
import SourceView from "./src-view";
import GraffView from "./graff-view";
import ObjectView from "./obj-view";
import FindView from "./find-view";
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
let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});
ReactDOM.render(
 React.createElement(AlertView, null),
 document.getElementById('alert-view')
);
ReactDOM.render(
 React.createElement(FindView, null),
 document.getElementById('find-view')
);
ReactDOM.render(
  React.createElement(SourceView, null),
  document.getElementById('code-view')
);
ReactDOM.render(
  React.createElement(GraffView, null),
  document.getElementById('form-view')
);
ReactDOM.render(
  React.createElement(ObjectView, null),
  document.getElementById('data-view')
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
  let show = false;
  switch (id) {
  case "help-btn":
    show = localStorage.getItem('helpView-' + language) !== 'true';
    localStorage.setItem("helpView-" + language, show);
    break;
  case "find-btn":
    show = localStorage.getItem('findView-' + language) !== 'true';
    localStorage.setItem("findView-" + language, show);
    break;
  case "code-btn":
    show = localStorage.getItem('codeView-' + language) !== 'true';
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
    break;
  case "form-btn":
    show = localStorage.getItem('formView-' + language) !== 'true';
    localStorage.setItem("formView-" + language, show);
    if (show) {
      // FIXME refresh form view.
    }
    break;
  case "data-btn":
    show = localStorage.getItem('dataView-' + language) !== 'true';
    localStorage.setItem("dataView-" + language, show);
    if (show) {
      let itemID = window.gcexports.id;
      let dataID = window.gcexports.encodeID(window.gcexports.decodeID(itemID).slice(2));
      $.get(location.origin + "/data?id=" + dataID, function (data) {
        window.gcexports.updateObj(dataID, data);
      });
    }
    break;
  default:
    break;
  }
  dispatch({});
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
    url = "/data?id=" + id;
    break;
  case "open-code":
    url = "/code?id=" + id;
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
//  window.location.href = "/item" + "?id=" + window.gcexports.id + "&refresh=true";
  let id = window.gcexports.id;
  let state = {};
  state[id] = {
    id: id,
    refresh: true,
  };
  window.gcexports.dispatcher.dispatch(state);
}
function putStat(data, resume) {
  let userID = localStorage.getItem("userID");
  let itemID = window.gcexports.id;
  $.ajax({
    type: "PUT",
    url: "/stat",
    data: {
      userID: userID,
      itemID: itemID,
      mark: data.mark,
      label: data.label,
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
function updateStat(id) {
  let user = localStorage.getItem("userID");
  $.get(location.origin + "/stat?id=" + id + "&user=" + user, function (data) {
    let mark = data[0] && data[0].mark;
    let label = data[0] && data[0].label;
    localStorage.setItem("markItem", mark);
    localStorage.setItem("labelItem", label);
    updateMarkAndLabel();
  });
}
window.gcexports.updateStat = updateStat;
const CLEAR = "#FEFEFE";
const AMBER = "#E7B416";
const RED = "#D75A5A"; //"#CC3232";
const GREEN = "#2DC937";
const BLUE = "#5FCEFF"; //"#45C6FF"; //"#12B6FF"; //"#009ADE";
const PURPLE = "#C98ED0"; //"#C07CC9"; //"#AF58BA";
const GREY = "#BEC9CF"; //"#A0B1BA";

function updateMarkAndLabel() {
  let state = +localStorage.getItem("markItem");
  let color;
  switch (state) {
  default:
    color = CLEAR;
    break;
  case 0:
    color = AMBER;
    break;
  case -1:
    color = RED;
    break;
  case 1:
    color = GREEN;
    break;
  case 2:
    color = BLUE;
    break;
  case 3:
    color = PURPLE;
    break;
  case 4:
    color = GREY;
    break;
  }
  let label = localStorage.getItem("labelItem");
  d3.select("#mark-circle").attr("fill", color);
  d3.select("#label-txt").node().value = label !== 'undefined' && label !== 'null' && label || '';
}
window.gcexports.updateMarkAndLabel = updateMarkAndLabel;
window.handleMark = (e) => {
  let mark = +localStorage.getItem("markItem");
  switch (mark) {
  case -1:  // red -> grey
    mark = 4;
    break;
  case 0:   // yellow -> red
    mark = -1;
    break;
  case 1:   // green -> blue
    mark = 2;
    break;
  case 2:   // blue -> purple
    mark = 3;
    break;
  case 3:   // purple -> yellow
    mark = 0; 
    break;
  case 4:   // grey -> clear
    mark = null;
    break;
  default:  // clear -> green
    mark = 1;
    break;
  }
  localStorage.setItem("markItem", mark);
  updateMarkAndLabel();
  putStat({mark: mark});
}
window.handleLabel = (e) => {
  let value = e.target.value;
  let label = localStorage.getItem("labelItem");
  if (value === label) {
    return;
  }
  localStorage.setItem("labelItem", value);
  updateMarkAndLabel();
  putStat({label: value});
}
const btnOn = "btn-secondary";
const btnOff = "btn-outline-secondary";

function initView(name, language, hideViews) {
  d3.select("div#" + name + "-view").style("display", "block");
  let view = hideViews ? false : localStorage.getItem(name + "View-" + language) === "true";
  d3.select("div#collapse-" + name).classed("show", view);
}

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
  initView('find', language, hideViews);
  initView('code', language, hideViews);
  initView('form', language, hideViews);
  initView('data', language, hideViews);
  initView('help', language, hideViews);
  let helpID = window.gcexports.helpID;
  if (helpID) {
    d3.select("div#help-view").html("<iframe frameBorder='0' width='100%' height='600px' src='/form?id=" + helpID + "'></iframe>");
  }

  updateStat(window.gcexports.id);
  d3.select("button#mark-btn").style("display", "block");
  d3.selectAll("a.nav-link").style("display", "block");
  if (localStorage.getItem("accessToken")) {
    d3.select("form#signout").style("display", "block");
  } else {
    d3.select("form#signin").style("display", "block");
  }
};
