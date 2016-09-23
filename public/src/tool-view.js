/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
import Dispatcher from "./Dispatcher";
import * as React from "react";
import GraffView from "./graff-view";
var IS_MOBILE = (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
);
var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  },
};
var ToolContent = React.createClass({
  hideItem: function hideItem(e, id) {
    $.ajax({
      type: "PUT",
      url: "/label",
      data: {
        id: id,
        label: "hide",
      },
      dataType: "text",
      success: function(data) {
        //hideItem(id);
      },
      error: function(xhr, msg, err) {
        console.log(msg + " " + err);
      }
    });
  },
  showItem: function () {
    let exports = window.exports;
    let id = exports.id;
    let el = React.findDOMNode(this);
    $.ajax({
      type: "PUT",
      url: "/label",
      data: {
        id: id,
        label: "show",
      },
      dataType: "text",
      success: function(data) {
        d3.select(el).select("#save").style("visibility", "hidden");
      },
      error: function(xhr, msg, err) {
        console.log(msg + " " + err);
      }
    });
  },
  componentDidMount: function() {
    var el = React.findDOMNode(this);
    ToolView.dispatchToken = window.dispatcher.register(this.onChange);
    d3.select(el).select("#save").on("click", this.onClick);
  },
  componentDidUpdate: function() {
  },
  onChange: function (data) {
    return;
    window.dispatcher.waitFor([GraffView.dispatchToken]);
    var el = React.findDOMNode(this);
    if (data.id) {
      $.get(location.origin + "/label/" + state.item, function (data) {
        d3.select(el).select("#save").style("visibility", data === "show" ? "visible" : "hidden");
      });
    } else {
      d3.select(el).select("#save").style("visibility", "hidden");
    }
  },
  onClick: function (e) {
    this.showItem();
  },
  render: function () {
    return (
      <svg height="40" width="100%" style={{background: "rgb(240, 240, 240)"}}>
        <g>
          <circle id="save" r="12" cx="30" cy="20" style={{fill: "#555", visibility: "hidden"}}><title>Save</title></circle>
          <title>Saved</title>
        </g>
      </svg>
    );
  },
});
var ToolView = React.createClass({
  mixins: [selfCleaningTimeout],
  MODES: {},
  propTypes: {
  },
  getDefaultProps: function() {
    return {
    };
  },
  getInitialState: function() {
    return {
    };
  },
  render: function() {
    return (
      <ToolContent className="toolContentStage" />
    );
  },
  componentDidMount: function() {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
});
export default ToolView;
