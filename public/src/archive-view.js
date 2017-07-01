import * as React from "react";
import * as d3 from "../d3.v4.min.js";
var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  },
};
let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});
var ArchiveContent = React.createClass({
  componentWillUnmount: function() {
  },
  componentDidMount: function() {
    ArchiveView.dispatchToken = window.gcexports.dispatcher.register(this.onChange);
    this.isDirty = false;
    queryPieces((err, items) => {
      var width = 960,
      height = 136,
      cellSize = 12;

      var formatPercent = d3.format(".1%");

      var color = d3.scaleQuantize()
        .domain([-0.05, 0.05])
        .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);

      let startYear = +items[items.length - 1].date.substring(0,4);
      //let startYear = +items[0].date.substring(0,4);
      let stopYear = +items[0].date.substring(0,4) + 1;

      var svg = d3.select("#archive-view")
        .selectAll("svg")
        .data(d3.range(startYear, stopYear))
        .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

      svg.append("text")
        .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return d; });

      var rect = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .selectAll("rect")
        .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append("rect")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .datum(d3.timeFormat("%Y-%m-%d"));

      svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#777")
        .selectAll("path")
        .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append("path")
        .attr("d", pathMonth);

      var data = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(d) { return d; })
        .object(items);

        rect.filter(function(d) { return d in data; })
          .attr("fill", function(d) { return color(data[d].length / 5000); })
          .on("click", clickHandler)
          .append("title")
          .text(function(d) {
            return d + ": " + data[d].length;
          });

      function clickHandler(e) {
        let language = window.gcexports.language;
        let langID = +language.substring(1);
        let codeID = +data[e][0].id;
        let dataID = 0;
        let itemID = window.gcexports.encodeID([langID, codeID, dataID]);
        // dispatch({
        //   id: itemID,
        //   data: {},
        // });
        // let history = {
        //   language: language,
        //   view: gcexports.view,
        //   itemID: itemID,
        // };
        // window.history.replaceState(history, language, "/" + gcexports.view + "?id=" + itemID);
        window.location.href = "/" + gcexports.view + "?id=" + itemID;
      }

      function pathMonth(t0) {
        var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
        d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
        return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
          + "H" + w0 * cellSize + "V" + 7 * cellSize
          + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
          + "H" + (w1 + 1) * cellSize + "V" + 0
          + "H" + (w0 + 1) * cellSize + "Z";
      }

    });

    // get a list of piece ids that match a search criterial
    // {} -> [{id}]
    function queryPieces(resume) {
      $.ajax({
        type: "GET",
        url: "/pieces/" + window.gcexports.language,
        data: {},
        dataType: "json",
        success: function(data) {
          var pieces = []
          for (var i = 0; i < data.length; i++) {
            pieces[i] = {
              date: data[i].created.substring(0,10),
              id: data[i].id,
            }
          }
          resume(null, pieces);
        },
        error: function(xhr, msg, err) {
          console.log(msg+" "+err)
        }
      });
    }
  },
  componentDidUpdate: function() {
    var viewer = window.gcexports.viewer;
    var el = React.findDOMNode(this);
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
      var start = window.gcexports.nextThumbnail;
      var end = window.gcexports.nextThumbnail = start + (firstLoad ? 50 : 2);
      var len = window.gcexports.pieces.length;
      if (start >= len || window.gcexports.currentThumbnail >= len) {
        return;
      }
      if (end > len) {
        end = len;
      }
      var list = window.gcexports.pieces.slice(start, end);
      $.ajax({
        type: "GET",
        url: "/code",
        data : {list: list},
        dataType: "json",
        success: function(data) {
          for (var i = 0; i < data.length; i++) {
            var d = data[i];
            window.gcexports.currentThumbnail = start + i;  // keep track of the current thumbnail in case of async
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
      <div />
      // <svg height="0" width="100%" style={{background: "white"}}>
      //   <g>
      //     <rect width="100%" height="100%" fill="white"/>
      //   </g>
      // </svg>
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
