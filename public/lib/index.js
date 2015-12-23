(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict" /**
              * Use invariant() to assert state which your program assumes to be true.
              *
              * Provide sprintf-style format (only %s is supported) and arguments
              * to provide information about what broke and what you were
              * expecting.
              *
              * The invariant message will be stripped in production, but the invariant
              * will remain to ensure logic does not differ in production.
              */;

Object.defineProperty(exports, "__esModule", {
  value: true
});
var invariant = function invariant(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error('Invariant Violation: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

exports.default = invariant;

},{}],2:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 * @preventMunge
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _invariant = require("../lib/invariant.js");

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

function Dispatcher() {
  this._lastID = 1;
  this._callbacks = {};
  this._isPending = {};
  this._isHandled = {};
  this._isDispatching = false;
  this._pendingPayload = null;
}

/**
 * Registers a callback to be invoked with every dispatched payload. Returns
 * a token that can be used with `waitFor()`.
 *
 * @param {function} callback
 * @return {string}
 */
Dispatcher.prototype.register = function (callback) {
  var id = _prefix + this._lastID++;
  this._callbacks[id] = callback;
  return id;
};

/**
 * Removes a callback based on its token.
 *
 * @param {string} id
 */
Dispatcher.prototype.unregister = function (id) {
  (0, _invariant2.default)(this._callbacks[id], 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id);
  delete this._callbacks[id];
};

/**
 * Waits for the callbacks specified to be invoked before continuing execution
 * of the current callback. This method should only be used by a callback in
 * response to a dispatched payload.
 *
 * @param {array<string>} ids
 */
Dispatcher.prototype.waitFor = function (ids) {
  (0, _invariant2.default)(this._isDispatching, 'Dispatcher.waitFor(...): Must be invoked while dispatching.');
  for (var ii = 0; ii < ids.length; ii++) {
    var id = ids[ii];
    if (this._isPending[id]) {
      (0, _invariant2.default)(this._isHandled[id], 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id);
      continue;
    }
    (0, _invariant2.default)(this._callbacks[id], 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id);
    this._invokeCallback(id);
  }
};

/**
 * Dispatches a payload to all registered callbacks.
 *
 * @param {object} payload
 */
Dispatcher.prototype.dispatch = function (payload) {
  (0, _invariant2.default)(!this._isDispatching, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.');
  this._startDispatching(payload);
  try {
    for (var id in this._callbacks) {
      if (this._isPending[id]) {
        continue;
      }
      this._invokeCallback(id);
    }
  } finally {
    this._stopDispatching();
  }
};

/**
 * Is this Dispatcher currently dispatching.
 *
 * @return {boolean}
 */
Dispatcher.prototype.isDispatching = function () {
  return this._isDispatching;
};

/**
 * Call the callback stored with the given id. Also do some internal
 * bookkeeping.
 *
 * @param {string} id
 * @internal
 */
Dispatcher.prototype._invokeCallback = function (id) {
  this._isPending[id] = true;
  this._callbacks[id](this._pendingPayload);
  this._isHandled[id] = true;
};

/**
 * Set up bookkeeping needed when dispatching.
 *
 * @param {object} payload
 * @internal
 */
Dispatcher.prototype._startDispatching = function (payload) {
  for (var id in this._callbacks) {
    this._isPending[id] = false;
    this._isHandled[id] = false;
  }
  this._pendingPayload = payload;
  this._isDispatching = true;
};

/**
 * Clear bookkeeping used for dispatching.
 *
 * @internal
 */
Dispatcher.prototype._stopDispatching = function () {
  this._pendingPayload = null;
  this._isDispatching = false;
};

exports.default = Dispatcher;

},{"../lib/invariant.js":1}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Dispatcher = require("./Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var selfCleaningTimeout = {
  componentDidUpdate: function componentDidUpdate() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: (function (_setTimeout) {
    function setTimeout() {
      return _setTimeout.apply(this, arguments);
    }

    setTimeout.toString = function () {
      return _setTimeout.toString();
    };

    return setTimeout;
  })(function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  })
}; /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var ArchiveContent = React.createClass({
  displayName: "ArchiveContent",

  componentWillUnmount: function componentWillUnmount() {},
  componentDidMount: function componentDidMount() {
    ArchiveView.dispatchToken = window.dispatcher.register(this.onChange);
    this.isDirty = false;
  },
  componentDidUpdate: function componentDidUpdate() {
    var viewer = window.exports.viewer;
    var el = React.findDOMNode(this);
    queryPieces();
    // get a list of piece ids that match a search criterial
    // {} -> [{id}]
    function queryPieces() {
      $.ajax({
        type: "GET",
        url: "/pieces/" + window.exports.language,
        data: {},
        dataType: "json",
        success: function success(data) {
          var pieces = [];
          for (var i = 0; i < data.length; i++) {
            pieces[i] = data[i].id;
          }
          window.exports.pieces = pieces;
          window.exports.nextThumbnail = 0;
          loadMoreThumbnails(true);
        },
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    }
    function loadItems(list, data, resume) {
      var sublist = list.slice(0, ITEM_COUNT);
      $.ajax({
        type: "GET",
        url: "/code",
        data: { list: sublist },
        dataType: "json",
        success: function success(dd) {
          for (var i = 0; i < dd.length; i++) {
            data.push(dd[i]);
          }
          list = list.slice(ITEM_COUNT);
          if (list.length > 0) {
            loadItems(list, data, resume);
          } else {
            resume(data);
          }
        },
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    }
    function addItem(obj, src, pool) {
      //      viewer.update(el, obj, src, pool);
    }
    function loadMoreThumbnails(firstLoad) {
      var start = window.exports.nextThumbnail;
      var end = window.exports.nextThumbnail = start + (firstLoad ? 50 : 2);
      var len = window.exports.pieces.length;
      if (start >= len || window.exports.currentThumbnail >= len) {
        return;
      }
      if (end > len) {
        end = len;
      }
      var list = window.exports.pieces.slice(start, end);
      $.ajax({
        type: "GET",
        url: "/code",
        data: { list: list },
        dataType: "json",
        success: function success(data) {
          for (var i = 0; i < data.length; i++) {
            var d = data[i];
            window.exports.currentThumbnail = start + i; // keep track of the current thumbnail in case of async
            addItem(d.obj, d.src);
          }
        },
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    }
  },
  onChange: function onChange(data) {
    this.replaceState(data);
  },
  render: function render() {
    return React.createElement(
      "svg",
      { height: "0", width: "100%", style: { background: "white" } },
      React.createElement(
        "g",
        null,
        React.createElement("rect", { width: "100%", height: "100%", fill: "white" })
      )
    );
  }
});
var ArchiveView = React.createClass({
  displayName: "ArchiveView",

  mixins: [selfCleaningTimeout],
  MODES: {},
  propTypes: {},
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  getInitialState: function getInitialState() {
    return {};
  },
  render: function render() {
    return React.createElement(ArchiveContent, { className: "archiveContentStage" });
  },
  componentDidMount: function componentDidMount() {},
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {}
});
exports.default = ArchiveView;

},{"./Dispatcher":2}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Dispatcher = require("./Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i); /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var selfCleaningTimeout = {
  componentDidUpdate: function componentDidUpdate() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: (function (_setTimeout) {
    function setTimeout() {
      return _setTimeout.apply(this, arguments);
    }

    setTimeout.toString = function () {
      return _setTimeout.toString();
    };

    return setTimeout;
  })(function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  })
};
var GraffContent = React.createClass({
  displayName: "GraffContent",

  componentWillUnmount: function componentWillUnmount() {},
  componentDidMount: function componentDidMount() {
    GraffView.dispatchToken = window.dispatcher.register(this.onChange);
    this.isDirty = false;
  },
  componentDidUpdate: function componentDidUpdate() {
    var viewer = window.exports.viewer;
    var el = React.findDOMNode(this);
    if (this.state && !this.state.errors) {
      var pool = this.state.pool;
      var src = this.state.src;
      var obj = this.state.obj;
      var id = this.state.id;
      viewer.update(el, obj, src, pool);
      if (id) {
        exports.id = id;
        window.history.pushState("object or string", "title", "/item?id=" + id);
      } else if (this.state.postCode) {
        var img = viewer.capture(el);
        postPiece(pool, src, obj, img);
      }
    }
    function postPiece(pool, src, obj, img) {
      var exports = window.exports;
      var user = $("#username").data("user");
      //      src = src.replace(/\\/g, "\\\\");
      var parent = exports.parent;
      var language = exports.language;
      $.ajax({
        type: "POST",
        url: "/code",
        data: {
          src: src,
          ast: pool,
          obj: obj,
          img: img ? img.replace(/\\/g, "\\\\") : "",
          user: user ? user.id : 1,
          parent: parent,
          language: language,
          label: "show"
        },
        dataType: "json",
        success: function success(data) {
          // FIXME add to state
          exports.id = data.id;
          exports.gist_id = data.gist_id;
          window.history.pushState("object or string", "title", "/item?id=" + data.id);
        },
        error: function error(xhr, msg, err) {
          console.log("Unable to submit code. Probably due to a SQL syntax error");
        }
      });
    }
  },
  onChange: function onChange(data) {
    this.replaceState(data);
  },
  render: function render() {
    return React.createElement(
      "svg",
      { height: "0", width: "100%", style: { background: "white" } },
      React.createElement(
        "g",
        null,
        React.createElement("rect", { width: "100%", height: "100%", fill: "white" })
      )
    );
  }
});
var GraffView = React.createClass({
  displayName: "GraffView",

  mixins: [selfCleaningTimeout],
  MODES: {},
  propTypes: {},
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  getInitialState: function getInitialState() {
    return {};
  },
  render: function render() {
    return React.createElement(GraffContent, { className: "graffContentStage" });
  },
  componentDidMount: function componentDidMount() {},
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {}
});
exports.default = GraffView;

},{"./Dispatcher":2}],5:[function(require,module,exports){
"use strict";

var _toolView = require("./tool-view");

var _toolView2 = _interopRequireDefault(_toolView);

var _srcView = require("./src-view");

var _srcView2 = _interopRequireDefault(_srcView);

var _graffView = require("./graff-view");

var _graffView2 = _interopRequireDefault(_graffView);

var _objView = require("./obj-view");

var _objView2 = _interopRequireDefault(_objView);

var _archiveView = require("./archive-view");

var _archiveView2 = _interopRequireDefault(_archiveView);

var _Dispatcher = require("./Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// This is the one and only dispatcher.
window.dispatcher = new _Dispatcher2.default();
React.render(React.createElement(_toolView2.default, null), document.getElementById('tool-view'));
React.render(React.createElement(_srcView2.default, null), document.getElementById('src-view'));
React.render(React.createElement(_graffView2.default, null), document.getElementById('graff-view'));
React.render(React.createElement(_objView2.default, null), document.getElementById('obj-view'));
React.render(React.createElement(_archiveView2.default, null), document.getElementById('archive-view'));

},{"./Dispatcher":2,"./archive-view":3,"./graff-view":4,"./obj-view":6,"./src-view":7,"./tool-view":8}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Dispatcher = require('./Dispatcher.js');

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i); /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var CodeMirrorEditor = React.createClass({
  displayName: 'CodeMirrorEditor',

  propTypes: {
    lineNumbers: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },
  getDefaultProps: function getDefaultProps() {
    return {
      lineNumbers: false
    };
  },
  componentDidMount: function componentDidMount() {
    this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
      mode: 'javascript',
      lineNumbers: this.props.lineNumbers,
      lineWrapping: true,
      smartIndent: true,
      matchBrackets: true,
      theme: 'neat',
      readOnly: this.props.readOnly,
      viewportMargin: Infinity,
      extraKeys: { "Ctrl-Space": "autocomplete" }
    });
    CodeMirrorEditor.dispatchToken = window.dispatcher.register(this.onChange);
  },
  componentDidUpdate: function componentDidUpdate() {
    if (this.props.readOnly) {
      this.editor.setValue(this.props.codeText);
    }
  },
  onChange: function onChange(data) {
    var objectCode = "";
    var obj = JSON.parse(data.obj);
    if (obj) {
      if (obj.objectCode) {
        objectCode = JSON.stringify(obj.objectCode, null, 2);
      } else {
        objectCode = JSON.stringify(obj, null, 2);
      }
    } else if (data && !data.error && window.exports.viewer.getObjectCode) {
      objectCode = window.exports.viewer.getObjectCode(data.obj);
    }
    this.editor.setValue(objectCode);
  },
  handleChange: function handleChange() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },
  render: function render() {
    // wrap in a div to fully contain CodeMirror
    var editor = undefined;
    if (IS_MOBILE) {
      editor = React.createElement(
        'pre',
        { style: { overflow: 'scroll' } },
        ""
      );
    } else {
      editor = React.createElement('textarea', { ref: 'editor', defaultValue: "" });
    }
    return React.createElement(
      'div',
      { style: this.props.style, className: this.props.className },
      editor
    );
  }
});
var selfCleaningTimeout = {
  componentDidUpdate: function componentDidUpdate() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: (function (_setTimeout) {
    function setTimeout() {
      return _setTimeout.apply(this, arguments);
    }

    setTimeout.toString = function () {
      return _setTimeout.toString();
    };

    return setTimeout;
  })(function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  })
};
var ObjectView = React.createClass({
  displayName: 'ObjectView',

  mixins: [selfCleaningTimeout],
  MODES: { JSX: 'JSX', JS: 'JS' }, //keyMirror({JSX: true, JS: true}),
  propTypes: {
    codeText: React.PropTypes.string.isRequired,
    transformer: React.PropTypes.func,
    renderCode: React.PropTypes.bool,
    showCompiledJSTab: React.PropTypes.bool,
    showLineNumbers: React.PropTypes.bool,
    editorTabTitle: React.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      editorTabTitle: 'Object',
      showCompiledJSTab: true,
      showLineNumbers: true,
      codeText: ''
    };
  },
  getInitialState: function getInitialState() {
    return {
      mode: this.MODES.JSX,
      code: this.props.codeText
    };
  },
  handleCodeChange: function handleCodeChange(value) {},
  handleCodeModeSwitch: function handleCodeModeSwitch(mode) {},
  compileCode: function compileCode() {},
  render: function render() {
    var isJS = this.state.mode === this.MODES.JS;
    var compiledCode = '';
    try {
      compiledCode = this.compileCode();
    } catch (err) {}
    return React.createElement(
      'div',
      { className: 'playground' },
      React.createElement(
        'div',
        { className: 'playgroundCode' },
        React.createElement(CodeMirrorEditor, {
          key: 'jsx',
          onChange: this.handleCodeChange,
          className: 'playgroundStage',
          codeText: this.props.codeText,
          lineNumbers: this.props.showLineNumbers
        })
      )
    );
  },
  componentDidMount: function componentDidMount() {
    this.executeCode();
  },
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    // execute code only when the state's not being updated by switching tab
    // this avoids re-displaying the error, which comes after a certain delay
    if (this.props.transformer !== prevProps.transformer || this.state.code !== prevState.code) {
      this.executeCode();
    }
  },
  executeCode: function executeCode() {
    return;
    var mountNode = React.findDOMNode(this.refs.mount);
    try {
      React.unmountComponentAtNode(mountNode);
    } catch (e) {}
    try {
      var compiledCode = this.compileCode();
      if (this.props.renderCode) {
        React.render(React.createElement(CodeMirrorEditor, { codeText: compiledCode, readOnly: true }), mountNode);
      } else {
        eval(compiledCode);
      }
    } catch (err) {
      this.setTimeout(function () {
        React.render(React.createElement(
          'div',
          { className: 'playgroundError' },
          "ERROR:" + err.toString()
        ), mountNode);
      }, 500);
    }
  }
});
exports.default = ObjectView;

},{"./Dispatcher.js":2}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Dispatcher = require('./Dispatcher.js');

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i); /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var CodeMirrorEditor = React.createClass({
  displayName: 'CodeMirrorEditor',

  propTypes: {
    lineNumbers: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },
  getDefaultProps: function getDefaultProps() {
    return {
      lineNumbers: false
    };
  },
  componentDidMount: function componentDidMount() {
    var exports = window.exports;
    var editor = window.exports.editor = this.editor = CodeMirror.fromTextArea(React.findDOMNode(this.refs.editor), {
      mode: 'graffiti',
      lineNumbers: this.props.lineNumbers,
      lineWrapping: true,
      smartIndent: true,
      matchBrackets: true,
      theme: 'neat',
      readOnly: this.props.readOnly,
      viewportMargin: Infinity,
      extraKeys: { "Ctrl-Space": "autocomplete" },
      gutters: ["CodeMirror-lint-markers"],
      lint: true
    });
    var pieces = [];
    var id = +exports.id;
    if (id) {
      $.get("http://" + location.host + "/code/" + id, function (data) {
        updateSrc(data[0].id, data[0].src);
      });
    } else {
      $.ajax({
        type: "GET",
        url: "/pieces/" + exports.language,
        data: {},
        dataType: "json",
        success: function success(data) {
          var pieces = [];
          for (var i = 0; i < data.length; i++) {
            pieces[i] = data[i].id;
          }
          exports.pieces = pieces;
          $.get("http://" + location.host + "/code/" + pieces[0], function (data) {
            updateSrc(data[0].id, data[0].src);
          });
        },
        error: function error(xhr, msg, err) {
          console.log(msg + " " + err);
        }
      });
    }
    function updateSrc(id, src) {
      exports.parent = exports.id;
      exports.id = id;
      if (src) {
        editor.setValue(src.split(/\\n[^umber]/).join("\n"));
      }
    };
  },
  componentDidUpdate: function componentDidUpdate() {},
  handleChange: function handleChange() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },
  render: function render() {
    // wrap in a div to fully contain CodeMirror
    var editor;
    if (IS_MOBILE) {
      editor = React.createElement(
        'pre',
        { style: { overflow: 'scroll' } },
        this.props.codeText
      );
    } else {
      editor = React.createElement('textarea', { ref: 'editor', defaultValue: this.props.codeText });
    }
    return React.createElement(
      'div',
      { style: this.props.style, className: this.props.className },
      editor
    );
  }
});
var selfCleaningTimeout = {
  componentDidUpdate: function componentDidUpdate() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: (function (_setTimeout) {
    function setTimeout() {
      return _setTimeout.apply(this, arguments);
    }

    setTimeout.toString = function () {
      return _setTimeout.toString();
    };

    return setTimeout;
  })(function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  })
};
var SourceView = React.createClass({
  displayName: 'SourceView',

  mixins: [selfCleaningTimeout],
  propTypes: {
    codeText: React.PropTypes.string.isRequired,
    transformer: React.PropTypes.func,
    renderCode: React.PropTypes.bool,
    showCompiledJSTab: React.PropTypes.bool,
    showLineNumbers: React.PropTypes.bool,
    editorTabTitle: React.PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      editorTabTitle: 'Source',
      showCompiledJSTab: true,
      showLineNumbers: true,
      codeText: "."
    };
  },
  getInitialState: function getInitialState() {
    return {
      code: this.props.codeText
    };
  },
  handleKeyDown: function handleKeyDown(e) {
    console.log("handleKeyDown() e=" + e.keyCode);
  },
  render: function render() {
    return React.createElement(
      'div',
      { className: 'playground' },
      React.createElement(
        'div',
        { className: 'playgroundCode' },
        React.createElement(CodeMirrorEditor, {
          className: 'playgroundStage',
          codeText: this.props.codeText,
          lineNumbers: this.props.showLineNumbers
        })
      )
    );
  },
  componentDidMount: function componentDidMount() {
    $(document.body).on('keydown', this.handleKeyDown);
  },
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {}
});
exports.default = SourceView;

},{"./Dispatcher.js":2}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Dispatcher = require("./Dispatcher");

var _Dispatcher2 = _interopRequireDefault(_Dispatcher);

var _graffView = require("./graff-view");

var _graffView2 = _interopRequireDefault(_graffView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);
var selfCleaningTimeout = {
  componentDidUpdate: function componentDidUpdate() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: (function (_setTimeout) {
    function setTimeout() {
      return _setTimeout.apply(this, arguments);
    }

    setTimeout.toString = function () {
      return _setTimeout.toString();
    };

    return setTimeout;
  })(function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  })
};
var ToolContent = React.createClass({
  displayName: "ToolContent",

  hideItem: function hideItem(e, id) {
    $.ajax({
      type: "PUT",
      url: "/label",
      data: {
        id: id,
        label: "hide"
      },
      dataType: "text",
      success: function success(data) {
        //hideItem(id);
      },
      error: function error(xhr, msg, err) {
        console.log(msg + " " + err);
      }
    });
  },
  showItem: function showItem() {
    var exports = window.exports;
    var id = exports.id;
    var el = React.findDOMNode(this);
    $.ajax({
      type: "PUT",
      url: "/label",
      data: {
        id: id,
        label: "show"
      },
      dataType: "text",
      success: function success(data) {
        d3.select(el).select("#save").style("visibility", "hidden");
      },
      error: function error(xhr, msg, err) {
        console.log(msg + " " + err);
      }
    });
  },
  componentDidMount: function componentDidMount() {
    var el = React.findDOMNode(this);
    ToolView.dispatchToken = window.dispatcher.register(this.onChange);
    d3.select(el).select("#save").on("click", this.onClick);
  },
  componentDidUpdate: function componentDidUpdate() {},
  onChange: function onChange(data) {
    return;
    window.dispatcher.waitFor([_graffView2.default.dispatchToken]);
    var el = React.findDOMNode(this);
    if (data.id) {
      $.get("http://" + location.host + "/label/" + state.item, function (data) {
        d3.select(el).select("#save").style("visibility", data === "show" ? "visible" : "hidden");
      });
    } else {
      d3.select(el).select("#save").style("visibility", "hidden");
    }
  },
  onClick: function onClick(e) {
    this.showItem();
  },
  render: function render() {
    return React.createElement(
      "svg",
      { height: "40", width: "100%", style: { background: "rgb(240, 240, 240)" } },
      React.createElement(
        "g",
        null,
        React.createElement(
          "circle",
          { id: "save", r: "12", cx: "30", cy: "20", style: { fill: "#555", visibility: "hidden" } },
          React.createElement(
            "title",
            null,
            "Save"
          )
        ),
        React.createElement(
          "title",
          null,
          "Saved"
        )
      )
    );
  }
});
var ToolView = React.createClass({
  displayName: "ToolView",

  mixins: [selfCleaningTimeout],
  MODES: {},
  propTypes: {},
  getDefaultProps: function getDefaultProps() {
    return {};
  },
  getInitialState: function getInitialState() {
    return {};
  },
  render: function render() {
    return React.createElement(ToolContent, { className: "toolContentStage" });
  },
  componentDidMount: function componentDidMount() {},
  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {}
});
exports.default = ToolView;

},{"./Dispatcher":2,"./graff-view":4}]},{},[5]);
