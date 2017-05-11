import Dispatcher from "./Dispatcher";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Hashids from "hashids";
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
let hashids = new Hashids("Art Compiler LLC");  // This string shall never change!
function decodeID(id) {
  // Return the three parts of an ID. Takes bare and hashed IDs.
  let ids;
  if (+id || id.split(" ").length > 1) {
    let a = id.split(" ");
    if (a.length === 1) {
      ids = [0, a[0], 0];
    } else if (a.length === 2) {
      ids = [0, a[0], a[1]];
    } else if (a.length === 3) {
      ids = [a[0], a[1], a[2]];
    } else {
      console.log("ERROR bad id: " + id);
      ids = [0, 0, 0];
    }
  } else {
    ids = hashids.decode(id);
  }
  console.log("decodeID() ids=" + ids);
  return ids;
}
function encodeID(baseID, codeID, dataID) {
  console.log("encodeID() baseID=" + baseID + " codeID=" + codeID + " dataID=" + dataID);
  baseID = +baseID ? baseID : 0;
  codeID = +codeID ? codeID : 0;
  dataID = +dataID ? dataID : 0;
  console.log("encodeID() baseID=" + baseID + " codeID=" + codeID + " dataID=" + dataID);
  let hashid = hashids.encode([baseID, codeID, dataID]);
  console.log("encodeID() hashid=" + hashid);
  return hashid;
}
var GraffContent = React.createClass({
  componentWillUnmount: function() {
  },
  compileCode: function(codeID, dataID) {
    if (/[a-zA-Z]/.test(codeID)) {
      // We have a hashid, so decode it.
      let ids = decodeID(codeID);
      codeID = ids[1];
      dataID = dataID ? dataID : ids[2];
    }
    console.log("compileCode() codeID=" + codeID + " dataID=" + dataID);
    let gcexports = window.gcexports;
    let self = this;
    if (!this.state) {
      this.state = {};
    }
    this.state.recompileCode = false;
    let pieces = [];
    if (codeID) {
      let id = "" + codeID;
      if (dataID) {
        // If there is a dataId, include it when getting the code.
        id += "+" + dataID;
      }
      d3.json(location.origin + "/data?id=" + id, (err, obj) => {
        if (dataID) {
          d3.json(location.origin + "/data?id=" + dataID, (err, data) => {
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
  componentDidMount: function() {
    GraffView.dispatchToken = window.dispatcher.register(this.onChange);
    let codeID = window.gcexports.id;
    let dataID = window.gcexports.data;
    this.compileCode(codeID, dataID);
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
  postData: function postData(codeID, obj, label) {
    // Save the data and recompile code with data if the viewer requests it by
    // setting recompileCode=true. See L121 for an example.
    let gcexports = window.gcexports;
    let user = $("#username").data("user");
    let parent = gcexports.parent;
    let language = gcexports.language;
    let updateHistory = this.state.updateHistory;
    let self = this;
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
          if (codeID) {
            // Wait until we have a codeId to update URL.
            let dataID = "" + data.id;
            if (gcexports.dataid !== dataID && self.state.recompileCode) {
              self.compileCode(codeID, dataID);
            }
            gcexports.dataid = dataID;
            let id;
            if (gcexports.view === "form") {
              // We have a hashid, so update it.
              let ids = decodeID(codeID);
              ids[2] = dataID;
              id = encodeID(...ids);
            } else {
              // Keep bare id.
              id = codeID + "+" + dataID;
            }
            let history = {
              language: language,
              view: gcexports.view,
              codeId: codeID,
              dataId: dataID,
            };
            if (updateHistory) {
              window.history.pushState(history, language, "/" + gcexports.view + "?id=" + id);
            } else {
              window.history.replaceState(history, language, "/" + gcexports.view + "?id=" + id);
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
          <Viewer className="viewer" obj={obj} data={data} {...data} />
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
