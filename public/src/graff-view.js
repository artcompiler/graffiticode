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

function assert(b, str) {
  if (!b) {
    throw new Error(str);
  }
}

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
  console.log("[1] decodeID() >> " + id);
  // 123456, 123+534653+0, Px4xO423c, 123+123456+0+Px4xO423c, Px4xO423c+Px4xO423c
  if (id === undefined) {
    id = "0";
  }
  assert(typeof id === "string", "Invalid id " + id);
  id = id.replace(/\+/g, " ");
  let parts = id.split(" ");
  let ids = [];
  for (let i = 0; i < parts.length; i++) {
    let n;
    if (ids.length > 1 && ids[ids.length - 1] === 0) {
      // If the current prefix ends with zero but is not the first id,
      // discard that zero.
      ids.pop();
    }
    if (Number.isInteger(n = +parts[i])) {
      ids.push(n);
    } else {
      ids = ids.concat(hashids.decode(parts[i]));
    }
  }
  // Fix short ids.
  if (ids.length === 1) {
    ids = [0, ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, ids[0], 113, ids[1], 0];
  }
  console.log("[2] decodeID() << " + JSON.stringify(ids));
  return ids;
}
function encodeID(ids, force) {
  console.log("[1] encodeID() >> " + JSON.stringify(ids));
  let id;
  if (ids.length === 1) {
    ids = [0, +ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, +ids[0], 113, +ids[1], 0];
  }
  if (force || gcexports.view === "form") {
    id = hashids.encode(ids);
  } else {
    // If not "form" view, then return raw id.
    id = ids.join("+");
  }
  console.log("[2] encodeID() << " + id);
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
    if (!itemID) {
      // Wait for valid id.
      return;
    }
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
          if (itemID) {
            // Wait until we have an itemID to update URL.
            let ids = decodeID(itemID);
            let lastDataID = encodeID(ids.slice(2));
            let dataID = data.id;
            ids = ids.slice(0, 2).concat(decodeID(dataID));
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
