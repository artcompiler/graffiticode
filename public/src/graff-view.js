import * as React from "react";
import * as ReactDOM from "react-dom";
import Hashids from "hashids";
window.gcexports.ReactDOM = ReactDOM;
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
  // console.log("[1] decodeID() >> " + id);
  // 123456, 123+534653+0, Px4xO423c, 123+123456+0+Px4xO423c, Px4xO423c+Px4xO423c
  if (id === undefined) {
    id = "0";
  }
  if (Number.isInteger(id)) {
    id = "" + id;
  }
  if (Array.isArray(id)) {
    // Looks like it is already decoded.
    assert(Number.isInteger(id[0]) && Number.isInteger(id[1]));
    return id;
  }
  assert(typeof id === "string", "Invalid id " + id);
  id = id.replace(/\+/g, " ");
  let parts = id.split(" ");
  let ids = [];
  // Concatenate the first two integer ids and the last hash id. Everything
  // else gets erased.
  for (let i = 0; i < parts.length; i++) {
    let n;
    if (ids.length > 2) {
      // Found the head, now skip to the last part to get the tail.
      ids = ids.slice(0, 2);
      i = parts.length - 1;
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
  } else if (ids.length === 3 && ids[2] !== 0) {
    ids = [ids[0], ids[1], 113, ids[2], 0];
  }
  // console.log("[2] decodeID() << " + JSON.stringify(ids));
  return ids;
}
function encodeID(ids) {
  // console.log("[1] encodeID() >> " + JSON.stringify(ids));
  if (ids.length === 1) {
    if (+ids[0] === 0) {
      // [0,0,0] --> "0"
      return "0";
    }
    ids = [0, +ids[0], 0];
  } else if (ids.length === 2) {
    ids = [0, +ids[0], 113, +ids[1], 0];
  }
  let id = hashids.encode(ids);
  // console.log("[2] encodeID() << " + id);
  return id;
}
window.gcexports.decodeID = decodeID;
window.gcexports.encodeID = encodeID;

let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});

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
    let lang = window.gcexports.language;
    let state = this.state && this.state[lang] ? this.state[lang] : {};
    // Deprecated?
    //this.state[lang].recompileCode = false;
    if (codeID) {
      let itemID = encodeID(ids);
      let lang = window.gcexports.language;
      d3.json(location.origin + "/data?id=" + itemID, (err, obj) => {
        let lang = window.gcexports.language;
        if (dataID && +dataID !== 0) {
          // This is the magic where we collapse the "tail" into a JSON object.
          // Next this JSON object gets interned as static data (in L113).
          d3.json(location.origin + "/data?id=" + encodeID(dataID), (err, data) => {
            let state = {};
            state[lang] = {
              id: itemID,
              obj: obj,
              data: data,
            };
            dispatch(state);
          });
        } else {
          let state = {};
          state[lang] = {
            id: itemID,
            obj: obj,
            data: {},  // clear data
          };
          dispatch(state);
        }
      });
    }
  },
  componentDidMount: function() {
    GraffView.dispatchToken = window.gcexports.dispatcher.register(this.onChange);
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
    let el = ReactDOM.findDOMNode(this);
    let lang = gcexports.language;
    if (this.state[lang] && this.state[lang].id && !this.state[lang].errors) {
      let state = this.state[lang];
      let ast = state.ast;
      let src = state.src;
      let obj = state.obj;
      let itemID = state.id;
      let data = state.data;
      let label = state.label;
      let viewer = window.gcexports.viewer;
      if (viewer && !viewer.Viewer && obj) {
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
    let lang = gcexports.language;
    let state = this.state[lang];
    let updateHistory = state.updateHistory;
    let self = this;
    // Append host language to label.
    label = label ? lang + " " + label : lang;
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
            if (dataID !== lastDataID && state.recompileCode) {
              self.compileCode(itemID);
            }
            if (state.dontUpdateID !== true) {
              gcexports.id = itemID;
              let history = {
                language: lang,
                view: gcexports.view,
                itemID: itemID,
              };
              if (updateHistory) {
                window.history.pushState(history, lang, "/" + gcexports.view + "?id=" + itemID);
              } else {
                window.history.replaceState(history, lang, "/" + gcexports.view + "?id=" + itemID);
              }
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
    if (!window.gcexports) {
      // Not ready yet.
      return;
    }
    let lang = window.gcexports.language;
    if (this.state === null) {
      this.setState(data);
    } else {
      // Copy state for the current language.
      let state = {};
      state[lang] = Object.assign({}, this.state[lang], data[lang]);
      if (this.state[lang] && data[lang]) {
        state[lang].data = Object.assign({}, this.state[lang].data, data[lang].data);
      }
      this.setState(Object.assign({}, this.state, state));
    }
  },
  render: function () {
    if (window.gcexports &&
        window.gcexports.viewer &&
        window.gcexports.viewer.Viewer) {
      // Legacy path.
      let Viewer = window.gcexports.viewer.Viewer;
      let lang = window.gcexports.language;
      if (this.state && this.state[lang] && this.state[lang].obj) {
        let state = this.state[lang];
        let obj = state.obj;
        let data = state.data;
        return (
          <Viewer id="graff-view" className="viewer" obj={obj} data={data} {...data} />
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
