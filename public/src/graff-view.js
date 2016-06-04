import Dispatcher from "./Dispatcher";
import * as React from "react";
import * as ReactDOM from "react-dom";
window.exports.ReactDOM = ReactDOM;
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
    let exports = window.exports;
    let self = this;
    let pieces = [];
    let id = +exports.id;
    if (id) {
      $.get("http://"+location.host+"/code/" + id, function (data) {
        let obj = data[0].obj;
        let src = data[0].src;
        let ast = data[0].ast;
        if (+exports.data) {
          $.get("http://"+location.host+"/data?id=" + exports.data, function (data) {
            dispatcher.dispatch({
              id: id,
              src: src,
              ast: ast,
              obj: obj,
              data: data,
            });
          });
        } else {
          dispatcher.dispatch({
            id: id,
            src: src,
            ast: ast,
            obj: obj,
            data: {}, // Clear state
          });
        }
      });
    }
  },
  componentDidUpdate: function() {
    var exports = window.exports;
    var viewer = exports.viewer;
    var el = ReactDOM.findDOMNode(this);
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
      exports.id = id
      this.postData(id, data, label);
    }
  },
  postCode: function postCode(ast, src, obj, img) {
    let exports = window.exports;
    let user = $("#username").data("user");
    let parent = exports.parent;
    let language = exports.language;
    let self = this;
    $.ajax({
      type: "POST",
      url: "/code",
      data: {
        src: src,
        ast: ast,
        obj: obj,
        img: img ? img.replace(/\\/g, "\\\\") : "",
        user: user ? user.id : 1,
        parent: parent,
        language: language,
        label: "show",
      },
      dataType: "json",
      success: function(data) {
        exports.id = data.id;
        exports.gist_id = data.gist_id
        window.history.pushState("string", "title", "/" + exports.view + "?id=" + data.id);
        self.setState({id: data.id, postCode: false, data: undefined});
      },
      error: function(xhr, msg, err) {
        console.log("Unable to submit code. Probably due to a SQL syntax error");
      }
    });
  },
  postData: function postData(codeid, obj, label) {
    let exports = window.exports;
    let user = $("#username").data("user");
    let parent = exports.parent;
    let language = exports.language;
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
          if (codeid) {
            // Wait until we have a codeid to update URL.
            exports.dataid = data.id;
            if (updateHistory) {
              window.history.pushState(codeid, language, "/" + exports.view + "?id=" + codeid + "+" + data.id);
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
    var Viewer = window.exports.viewer.Viewer;
    if (Viewer) {
      if (this.state && this.state.obj) {
        var obj = this.state && this.state.obj ? JSON.parse(this.state.obj) : {};
        var data = this.state && this.state.data ? this.state.data : {};
        return (
            <Viewer className="viewer" {...obj} {...data} />
        );
      } else {
        return <div/>;
      }
    } else {
      return (
        <svg height="0" width="100%" style={{background: "white"}}>
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
