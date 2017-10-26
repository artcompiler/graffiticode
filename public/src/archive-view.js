import * as React from "react";
import * as ReactDOM from "react-dom";
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
  },
  componentDidUpdate: function() {
    let state = this.state[window.gcexports.language];
    if (!state ||
        !state.data ||
        !state.data.views ||
        !state.data.views.archive) {
      return;
    }
    getItems((err, items) => {
      let index = items.length - 1;
      var width = 960,
          cellSize = 15,
          height = 7 * cellSize + 20;
      var formatPercent = d3.format(".1%");
      var color = d3.scaleQuantize()
        .domain([0, 100])
        .range(['#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529']);
      let startYear = +items[0].date.substring(0,4);
      let stopYear = +items[items.length - 1].date.substring(0,4) + 1;

      var svg = d3.select("#archive-view")
        .selectAll("svg")
        .data(d3.range(startYear, stopYear))
        .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + 50 + "," + (height - cellSize * 7 - 11) + ")");

      svg.append("text")
        .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .text(function(d) { return d; });

      var rect = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", (d) => {
          return "#ccc"
        })
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

      rect
        .filter(function(d) { return d in data; })
        .attr("id", (d) => {
          let id = "ID" + d.split("-").join("");
          return id;
        })
        .attr("fill", function(d) {
          let c = color(data[d].length);
          return c;
        })
        .on("click", handleCalendarClick)
        .append("title")
        .text(function(d) {
          return d + ": " + data[d].length + " items";
        });

      var buttons = d3.select("#archive-view")
        .selectAll("div.buttons").data([1])
        .enter().append("div")
        .attr("class", "buttons")
        .style("margin", "10 50");
      buttons.append("button")
        .attr("id", "hide-button")
        .style("background", "rgba(8, 149, 194, 0.10)")  // #0895c2
        .style("margin", "0 20 0 0")
        .on("click", handleButtonClick);
      buttons.append("button")
        .style("background", "rgba(8, 149, 194, 0.10)")  // #0895c2
        .on("click", handleButtonClick)
        .text("PREV");
      buttons.append("span")
        .attr("id", "counter")
        .style("margin", "20")
        .text(items.length + " of " + items.length);
      buttons.append("button")
        .style("background", "rgba(8, 149, 194, 0.10)")  // #0895c2
        .on("click", handleButtonClick)
        .text("NEXT");

      let ids = window.gcexports.decodeID(window.gcexports.id);
      updateHideButton(ids[1]);

      function updateHideButton(id) {
        $.ajax({
          type: "GET",
          url: "/label",
          data: {
            id: id,
          },
          dataType: "text",
          success: function(label) {
            d3.select("#hide-button").text(label === "show" ? "HIDE" : "SHOW");
          },
          error: function(xhr, msg, err) {
            console.log(msg + " " + err);
          }
        });
      }

      let prevElt, prevFill;
      function highlightCell(id) {
        if (prevElt) {
          prevElt.attr("fill", prevFill);
        }
        let elt = d3.select("#ID" + id.split("-").join(""));
        let fill = elt.attr("fill");
        elt.attr("fill", "#F00");
        prevElt = elt;
        prevFill = fill;
      }

      function handleCalendarClick(e) {
        highlightCell(e);
        index = data[e][data[e].length - 1].index;
        d3.select("#counter").text((index + 1) + " of " + items.length);
        let language = window.gcexports.language;
        let langID = +language.substring(1);
        let codeID = +data[e][0].id;
        let dataID = 0;
        let itemID = window.gcexports.encodeID([langID, codeID, dataID]);
        // window.location.href = "/" + gcexports.view + "?id=" + itemID;
        $.get(location.origin + "/code?id=" + itemID, function (data) {
          window.gcexports.updateSrc(itemID, data.src);
        });
        let history = {
          language: language,
          view: gcexports.view,
        };
        window.history.pushState(history, language, "/" + gcexports.view + "?id=" + itemID);
      }

      function hideItem(id, hide) {
        let label = hide ? "hide" : "show";
        $.ajax({
          type: "PUT",
          url: "/label",
          data: {
            id: id,
            label: label,
          },
          dataType: "text",
          success: function(data) {
            d3.select("#hide-button").text(hide ? "SHOW" : "HIDE");
          },
          error: function(xhr, msg, err) {
            console.log(msg + " " + err);
          }
        });
      }

      function handleButtonClick(e) {
        let name = d3.select(this).text();
        if (name === "HIDE") {
          hideItem(items[index].id, true);
          return;
        } else if (name === "SHOW") {
          hideItem(items[index].id, false);
          return;
        } else if (name === "NEXT") {
          index = index < items.length - 1 ? index + 1 : 0;
        } else {
          index = index > 0 ? index - 1 : items.length - 1;
        }
        d3.select("#counter").text((index + 1) + " of " + items.length);
        let language = window.gcexports.language;
        let item = items[index];
        let langID = +language.substring(1);
        let codeID = +item.id;
        let dataID = 0;
        let itemID = window.gcexports.encodeID([langID, codeID, dataID]);
        // window.location.href = "/" + gcexports.view + "?id=" + itemID;
        $.get(location.origin + "/code?id=" + itemID, function (data) {
          window.gcexports.updateSrc(itemID, data.src);
        });
        let history = {
          language: language,
          view: gcexports.view,
        };
        window.history.pushState(history, language, "/" + gcexports.view + "?id=" + itemID);
        let id = item.date;
        highlightCell(id);
        updateHideButton(codeID);
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

      highlightCell(items[index].date);
    });

    // get a list of piece ids that match a search criterial
    // {} -> [{id}]
    function getItems(resume) {
      $.ajax({
        type: "GET",
        url: "/pieces/" + window.gcexports.language,
        data: {
          label: "show|hide",
        },
        dataType: "json",
        success: function(data) {
          let items = [];
          data = data.reverse();  // Make ascending.
          for (let i = 0; i < data.length; i++) {
            items[i] = {
              index: i,
              date: data[i].created.substring(0,10),
              id: data[i].id,
            }
          }
          resume(null, items);
        },
        error: function(xhr, msg, err) {
          console.log(msg+" "+err)
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
