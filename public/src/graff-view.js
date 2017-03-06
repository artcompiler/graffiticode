import Dispatcher from "./Dispatcher";
import * as React from "react";
import * as ReactDOM from "react-dom";
window.gcexports.ReactDOM = ReactDOM;
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
var GraffContent = React.createClass({
  componentWillUnmount: function() {
  },
  componentDidMount: function() {
    GraffView.dispatchToken = window.dispatcher.register(this.onChange);
    this.isDirty = false;
    let gcexports = window.gcexports;
    let self = this;
    let pieces = [];
    let id = gcexports.id;
    if (id) {
      let dataId = "";
      if (gcexports.data) {
        // If there is a dataId, include it when getting the code.
        id += "+" + gcexports.data;
      }
      d3.json(location.origin + "/data?id=" + id, (err, obj) => {
        if (+gcexports.data) {
          d3.json(location.origin + "/data?id=" + gcexports.data, (err, data) => {
            dispatcher.dispatch({
              id: id,
              obj: obj,
              data: data,
            });
          });
        } else {
          dispatcher.dispatch({
            id: id,
            obj: obj,
            data: {}, // Clear state
          });
        }
      });
    }
  },
  componentDidUpdate: function() {
    let gcexports = window.gcexports;
    let viewer = gcexports.viewer;
    let el = ReactDOM.findDOMNode(this);
    if (this.state && !this.state.errors) {
      let ast = this.state.ast;
      let src = this.state.src;
      let obj = this.state.obj;
      let id = this.state.id;
      let data = this.state.data;
      let label = this.state.label;
      if (!viewer.Viewer && obj) {
        // Legacy code path
        viewer.update(el, obj, src, ast);
      }
      let codeId = String(id).split("+")[0];
      gcexports.id = codeId;
      this.postData(codeId, data, label);
    }
  },
  postData: function postData(codeId, obj, label) {
    let gcexports = window.gcexports;
    let user = $("#username").data("user");
    let parent = gcexports.parent;
    let language = gcexports.language;
    let updateHistory = this.state.updateHistory;
    // Append host language to label.
    label = label ? language + " " + label : language;
    if (Object.keys(obj).length > 0) {
      $.ajax({
        type: "PUT",
        url: "/code",
        data: {
          src: JSON.stringify(obj) + "..",  // Some JSON is valid source.
          ast: "",
          obj: JSON.stringify(obj),
          img: "",
          user: user ? user.id : 1,
          parent: parent,
          language: "L113",
          label: label + " data",
        },
        dataType: "json",
        success: function(data) {
          // FIXME add to state
          if (codeId) {
            // Wait until we have a codeId to update URL.
            gcexports.dataid = data.id;
            if (updateHistory) {
              window.history.pushState(codeId, language, "/" + gcexports.view + "?id=" + codeId + "+" + data.id);
            }
          }
        },
        error: function(xhr, msg, err) {
          console.log("Unable to submit code. Probably due to a SQL syntax error");
        }
      });
    }
  },
  onChange: function (data) {
    this.setState(data);
  },
  render: function () {
    var Viewer = window.gcexports.viewer.Viewer;
    if (Viewer) {
      if (this.state && this.state.obj) {
        var obj = this.state.obj;
        var data = this.state.data;
        return (
            <Viewer className="viewer" obj={obj} {...data} />
        );
      } else {
        return <div/>;
      }
    } else {
      return (
        <svg height="0" width="100%" style={{background: "transparent"}}>
          <g>
            <rect width="100%" height="100%" fill="white"/>
          </g>
        </svg>
      );
    }
  },
});
var GraffView = React.createClass({
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
      <GraffContent className="graffContentStage" />
    );
  },
  componentDidMount: function() {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
});
export default GraffView;
