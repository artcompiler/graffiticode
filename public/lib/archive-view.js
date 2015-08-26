define(["exports", "module"], function (exports, module) {
  /* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
  /* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
  "use strict";

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
    }) };
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
      function addItem(obj, src, pool) {}
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
    } });
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
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {} });
  module.exports = ArchiveView;
});

//      viewer.update(el, obj, src, pool);
