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
  console.log("decodeID() id=" + id);
  // Return the three parts of an ID. Takes bare and hashed IDs.
  let ids;
  if (!isNaN(+id) || id.split("+").length > 1) {
    let a = id.split("+");
    if (a.length === 1) {
      ids = [0, a[0], 0];
    } else if (a.length === 2) {
      ids = [0, a[0], 113, a[1]];
    } else {
      ids = a;
    }
  } else {
    ids = hashids.decode(id);
  }
  console.log("decodeID() ids=" + ids);
  return ids;
}
function encodeID(ids, force) {
  console.log("encodeID() ids=" + JSON.stringify(ids));
  let id;
  if (ids.length === 1) {
    ids = [0, +ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, +ids[0], +ids[1]];
  }
  if (force || gcexports.view === "form") {
    id = hashids.encode(ids);
  } else {
    // If not "form" view, then return raw id.
    id = ids.join("+");
  }
  console.log("encodeID() id=" + id);
  return id;
}
window.gcexports.decodeID = decodeID;
window.gcexports.encodeID = encodeID;

var GraffContent = React.createClass({
  componentWillUnmount: function() {
  },
  compileCode: function(itemID) {
    let langID, codeID, dataID;
    let ids = decodeID(itemID);
    langID = ids[0];
    codeID = ids[1];
    dataID = ids.slice(2);
    let self = this;
    if (!this.state) {
      this.state = {};
    }
    this.state.recompileCode = false;
    if (codeID) {
      let itemID = encodeID(ids, true);
      d3.json(location.origin + "/data?id=" + itemID, (err, obj) => {
        if (dataID && +dataID !== 0) {
          d3.json(location.origin + "/data?id=" + encodeID(dataID, true), (err, data) => {
            dispatcher.dispatch({
              id: itemID,
              obj: obj,
              data: data,
            });
          });
        } else {
          dispatcher.dispatch({
            id: itemID,
            obj: obj,
            data: {}, // Clear state
          });
        }
      });
    }
  },
  componentDidMount: function() {
    GraffView.dispatchToken = window.dispatcher.register(this.onChange);
    let itemID = window.gcexports.id;
    this.compileCode(itemID);
    let language = window.gcexports.language;
    let history = {
      language: language,
      view: gcexports.view,
      itemID: itemID,
    };
    window.history.replaceState(history, language, "/" + gcexports.view + "?id=" + itemID);
  },
  componentDidUpdate: function() {
    let gcexports = window.gcexports;
    let viewer = gcexports.viewer;
    let el = ReactDOM.findDOMNode(this);
    if (this.state && !this.state.errors) {
      let ast = this.state.ast;
      let src = this.state.src;
      let obj = this.state.obj;
      let itemID = this.state.id;
      let data = this.state.data;
      let label = this.state.label;
      if (!viewer.Viewer && obj) {
        // Legacy code path
        viewer.update(el, obj, src, ast);
      }
      gcexports.id = itemID;
      this.postData(itemID, data, label);
    }
  },
  postData: function postData(itemID, obj, label) {
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
          if (itemID) {
            // Wait until we have an itemID to update URL.
            let dataID = "" + data.id;
            let ids = decodeID(itemID);
            let lastDataID = ids[2];
            ids[2] = dataID;
            itemID = encodeID(ids);
            gcexports.id = itemID;
            if (dataID !== lastDataID && self.state.recompileCode) {
              self.compileCode(itemID);
            }
            let history = {
              language: language,
              view: gcexports.view,
              itemID: itemID,
            };
            if (updateHistory) {
              window.history.pushState(history, language, "/" + gcexports.view + "?id=" + itemID);
            } else {
              window.history.replaceState(history, language, "/" + gcexports.view + "?id=" + itemID);
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
