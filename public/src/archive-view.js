/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
import Dispatcher from "./Dispatcher";
var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  },
};
var ArchiveContent = React.createClass({
  componentWillUnmount: function() {
  },
  componentDidMount: function() {
    ArchiveView.dispatchToken = window.dispatcher.register(this.onChange);
    this.isDirty = false;
  },
  componentDidUpdate: function() {
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
        success: function(data) {
          var pieces = []
          for (var i = 0; i < data.length; i++) {
            pieces[i] = data[i].id
          }
          window.exports.pieces = pieces
          window.exports.nextThumbnail = 0
          loadMoreThumbnails(true)
        },
        error: function(xhr, msg, err) {
          console.log(msg+" "+err)
        }
      });
    }
    function loadItems(list, data, resume) {
      var sublist = list.slice(0, ITEM_COUNT);
      $.ajax({
        type: "GET",
        url: "/code",
        data : {list: sublist},
        dataType: "json",
        success: function(dd) {
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
        error: function(xhr, msg, err) {
          console.log(msg+" "+err);
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
        data : {list: list},
        dataType: "json",
        success: function(data) {
          for (var i = 0; i < data.length; i++) {
            var d = data[i];
            window.exports.currentThumbnail = start + i;  // keep track of the current thumbnail in case of async
            addItem(d.obj, d.src);
          }
        },
        error: function(xhr, msg, err) {
          console.log(msg+" "+err);
        }
      });
    }
  },
  onChange: function (data) {
    this.replaceState(data);
  },
  render: function () {
    return (
      <svg height="0" width="100%" style={{background: "white"}}>
        <g>
          <rect width="100%" height="100%" fill="white"/>
        </g>
      </svg>
    );
  },
});
var ArchiveView = React.createClass({
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
      <ArchiveContent className="archiveContentStage" />
    );
  },
  componentDidMount: function() {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
});
export default ArchiveView;
