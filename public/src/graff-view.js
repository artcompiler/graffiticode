import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  assert,
  message,
  messages,
  reserveCodeRange,
  decodeID,
  encodeID,
} from "./share.js"
window.gcexports.ReactDOM = ReactDOM;
window.gcexports.decodeID = decodeID;
window.gcexports.encodeID = encodeID;
let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});
window.gcexports.compileSrc = (lang, src, resume) => {
  $.ajax({
    type: "PUT",
    url: "/compile",
    data: {
      "language": lang,
      "src": src,
    },
    dataType: "json",
    success: function(data) {
      resume(null, data);
    },
    error: function(xhr, msg, err) {
      console.log("ERROR " + msg + " " + err);
    }
  });
};

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
    let params = "";
    if (window.gcexports.refresh) {
      params += "&refresh=true";
    }
    if (codeID) {
      let itemID = encodeID(ids);
      d3.json(location.origin + "/data?id=" + itemID + params, (err, obj) => {
        if (dataID && +dataID !== 0) {
          // This is the magic where we collapse the "tail" into a JSON object.
          // Next this JSON object gets interned as static data (in L113).
          console.log(decodeID(window.gcexports.id).join("+") + " --> " + dataID); 
          d3.json(location.origin + "/data?id=" + encodeID(dataID) + params, (err, data) => {
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
      let parentID = state.parentID;
      if (viewer && !viewer.Viewer && obj) {
        // Legacy code path
        viewer.update(el, obj, src, ast);
      }
      gcexports.id = itemID;
      this.postData(itemID, data, label, parentID);
    }
  },
  postData: function postData(itemID, obj, label, parentID) {
    // Save the data and recompile code with data if the viewer requests it by
    // setting recompileCode=true. See L121 for an example.
    let gcexports = window.gcexports;
    let user = $("#username").data("user");
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
          src: JSON.stringify(obj) + "..",  // JSON is valid source.
          ast: "",
          obj: JSON.stringify(obj),
          img: "",
          user: user ? user.id : 1,
          parent: parentID,
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
//        return <img key="0" className="preloader" width="30" height="30" src="logo.png"/>
        return <div/>;
      }
    } else {
      // Legacy path.
      return (
        <svg height="0" width="100%" style={{background: "transparent"}}>
          <g>
            <rect key="1" width="100%" height="100%" fill="white"/>
          </g>
        </svg>
      );
    }
  },
});
var GraffView = React.createClass({
  render: function() {
    return (
      <GraffContent className="graffContentStage" />
    );
  },
});
export default GraffView;
