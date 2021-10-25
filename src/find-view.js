import * as React from "react";
import * as ReactDOM from "react-dom";
import * as d3 from "d3";
import PropTypes from 'prop-types';

let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});

let findFilter = "";

class FindContent extends React.Component {
  constructor(props) {
    super(props);
    this.items = undefined;
    this.onChange = this.onChange.bind(this);
    this.onFilterBlur = this.onFilterBlur.bind(this);
  }
  componentDidUpdate() {
    clearTimeout(this.timeoutID);
  }

  setTimeout() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }

  componentWillUnmount() {
  }

  componentDidMount() {
    FindView.dispatchToken = window.gcexports.dispatcher.register(this.onChange);
    this.isDirty = false;
  }

  componentDidUpdate() {
    let self = this;
    let findIndex = -1;
    let show = localStorage.getItem('findView-' + window.gcexports.language) === 'true';
    if (!show) {
      return;
    }
    function getCurrentIndex(items) {
      if (findIndex >= 0 && findIndex < items.length) {
        return findIndex;
      }
      let id = window.gcexports.id;
      let filtered = items.filter(item => item.id === id);
      let item;
      item = filtered[filtered.length - 1];
      return item ? item.index : -1;
    }
    getItems((err, items) => {
      let index = getCurrentIndex(items);
      let id;
      if ((id = index >= 0 && items.length > 0 && items[index].id) &&
          id !== window.gcexports.id) {
        updateView(id);
      }
      var width = 960,
          cellSize = 15,
          height = 7 * cellSize + 20;
      var formatPercent = d3.format(".1%");
      var color = d3.scaleQuantize()
        .domain([0, 100])
        .range(['#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529']);
      let startYear, stopYear;
      if (items.length === 0) {
        // No items to render
        startYear = new Date().getFullYear();
        stopYear = startYear + 1;
      } else {
        startYear = +items[0].date.substring(0,4);
        stopYear = +items[items.length - 1].date.substring(0,4) + 1;
      }
      var svg = d3.select("#find-view")
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
          return "#ccc";
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

      d3.select(document)
        .on("keydown", () => {
          if (event.target.type !== "textarea" && event.target.contentEditable !== "true") {
            let name = "";
            if(event.keyCode == 37) {
              name = "PREV";
            }
            else if(event.keyCode == 39) {
              name = "NEXT";
            }
            handleKeyPress(name);
          }
        });
      var buttons = d3.select("#find-view")
        .selectAll("div.buttons").data([1])
        .enter().append("div")
        .attr("class", "buttons")
        .style("margin", "10 50");

      buttons.append("button")
        .style("background", "rgba(8, 149, 194, 0.10)")  // #0895c2
        .classed("btn", true)
        .classed("btn-light", true)
        .on("click", handleButtonClick)
        .text("PREV");
      buttons.append("span")
        .attr("id", "counter")
        .style("margin", "20")
        .text((index + 1) + " of " + items.length);
      buttons.append("button")
        .style("background", "rgba(8, 149, 194, 0.10)")  // #0895c2
        .classed("btn", true)
        .classed("btn-light", true)
        .on("click", handleButtonClick)
        .text("NEXT");
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
        let itemID = data[e][0].id;
        updateView(itemID);
      }
      function handleKeyPress(name) {
        if (name === "NEXT" || name === "PREV") {
          if (name === "NEXT") {
            index = index < items.length - 1 ? index + 1 : 0;
          } else if (name === "PREV") {
            index = index > 0 ? index - 1 : items.length - 1;
          }
          d3.select("#counter").text((index + 1) + " of " + items.length);
          let item = items[index];
          highlightCell(item.date);
          let itemID = item.id;
          updateView(itemID);
        }
      }
      function handleButtonClick(e) {
        if (items.length === 0) {
          return;
        }
        let name = d3.select(this).text();
        if (name === "NEXT" || name === "PREV") {
          handleKeyPress(name);
        }
      }
      function updateView(id) {
        let language = window.gcexports.language;
        window.gcexports.id = id;
        let history = {
          language: language,
          view: gcexports.view,
        };
        window.history.pushState(history, language, "/" + gcexports.view + "?id=" + id);
        updateSrcAndObjViews(id);
        updateGraffView(id);
      }
      function updateSrcAndObjViews(id) {
        // window.location.href = "/" + gcexports.view + "?id=" + itemID;
        let ids = window.gcexports.decodeID(id);
        let codeID = ids[1];
        let dataID = window.gcexports.encodeID(ids.slice(2));
        $.get(location.origin + "/code?id=" + id, function (data) {
          window.gcexports.updateSrc(id, data.src);
        });
        if (ids[2] === 0) {
          window.gcexports.updateObj(dataID, {});
        } else {
          $.get(location.origin + "/data?id=" + dataID, function (data) {
            window.gcexports.updateObj(dataID, data);
          });
        }
      }
      function updateGraffView(id) {
        let state = {}
        state[id] = {
          id: id,
          recompileCode: true,
          refresh: true,
          status: "Compiled",
        };
        window.gcexports.dispatcher.dispatch(state);
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
      if (index !== -1 && items.length > 0) {
        highlightCell(items[index].date);
      }
    });
    // get a list of piece ids that match a search criterial
    // {} -> [{id}]
    function getData(table, fields, where, resume) {
      if (!table) {
        resume(null, []);
      } else {
        $.ajax({
          type: "GET",
          url: "/items",
          data : {
            fields: fields,
            where: where,
            table: table,
          },
          dataType: "json",
          success: function(data) {
            resume(null, data.data);
          },
          error: function(xhr, msg, err) {
            console.log(msg+" "+err);
            resume("error", []);
          }
        });
      }
    }
    function getCommandParam(str, cmd) {
      // cmd=`xxx`, cmd=xxx
      let t = str.split(cmd + "=");
      t = t.length > 1 && t[1].trim().split("`") || [];
      t = t.length > 2 && t[0] === "" && t[1] || t.length > 0 && t[0].split(" ")[0] || "";
      return t.trim();
    }
    function parseFilter(str) {
      let filter = {};
      let mark = "";
      let param;
      switch (getCommandParam(str, "mark")) {
      case "red":
      case "-1":
        mark = "='-1'";
        break;
      case "yellow":
      case "0":
        mark = "='0'";
        break;
      case "green":
      case "1":
        mark = "='1'";
        break;
      case "blue":
      case "2":
        mark = "='2'";
        break;
      case "purple":
      case "3":
        mark = "='3'";
        break;
      case "grey":
      case "4":
        mark = "='4'";
        break;
      case "any":
        mark = " is not null";
        break;
      case "none":
        mark = " is null";
        break;
      default:
        break;
      }
      let label = "";
      switch ((param = getCommandParam(str, "label"))) {
      case "any":
        label = " is not null and label!=''";
        break;
      case "none":
        label = " is null";
        break;
      case "show":
      default:
        label = param !== "" && " SIMILAR TO '%\\m" + param + "\\M%'" || "";
        break;
      }
      let year = getCommandParam(str, "created");
      let code = getCommandParam(str, "code");
      let index = getCommandParam(str, "index");
      let userid = getCommandParam(str, "userid");
      return {
        mark: mark && " and mark" + mark || "",
        label: label && " and label" + label || "",
        created: year && " and created >= '" + year + "-01-01' and created <= '" + year + "-12-31'",
        code: code && " and src like '%" + code + "%'",
        index: index - 1,  // Zero based.
        userid: userid && " and userid='" + userid + "'" || "",
      };
    }
    function getItems(resume) {
      if (self.items) {
        resume(null, self.items);
        return;
      }
      let excludeItems = false;
      let filter = parseFilter(findFilter);
      let piecesFilter = "";
      let itemsFilter = "";
      Object.keys(filter).forEach(k => {
        let v = filter[k];
        if (v !== undefined) {
          switch (k) {
          case "mark":
            if (v === " and mark is null") {
              excludeItems = true;
              itemsFilter += " and mark is not null";
            } else {
              itemsFilter +=  v;
            }
            break;
          case "userid":
            itemsFilter += v;
            break;
          case "label":
            itemsFilter += v;
            break;
          case "code":
            piecesFilter += v;
            break;
          case "created":
            itemsFilter += v;
            break;
          case "index":
            findIndex = v;
            break;
          default:
            break;
          }
        }
      });
      let lang = window.gcexports.language;
      getData(
        piecesFilter && "pieces" || null,
        "id, created",
        "language='" + lang + "'" + piecesFilter,
        (err, data1) => {
          let langID = lang.slice(1);
          getData(
            itemsFilter && "items" || null,
            "created, codeid, itemid",
            "langid=" + langID + itemsFilter,
            (err, data2) => {
              let itemsHash = data2 && data2.length > 0 && {} || null;
              if (itemsHash) {
                // Put items from the items DB into the itemsHash.
                data2.forEach(d => {
                  if (!itemsHash[d.codeid]) {
                    itemsHash[d.codeid] = [];
                  }
                  itemsHash[d.codeid].push({
                    id: d.itemid,
                    created: d.created
                  });
                });
              }
              let items = [];
              data1 = data1.reverse();  // Make ascending.
              data2 = data2.reverse();  // Make ascending.
              let index = 0;
              if (data1.length > 0) {
                for (let i = 0; i < data1.length; i++) {
                  let id = data1[i].id;
                  if (!itemsHash ||
                      excludeItems && !itemsHash[id] ||
                      !excludeItems && itemsHash[id]) {
                    if (itemsHash && itemsHash[id]) {
                      // We have items so use them to filter the set.
                      for (let j = 0; j < itemsHash[id].length; j++) {
                        items[index] = {
                          index: index,
                          id: itemsHash[id][j].id,
                          date: data1[i].created.substring(0,10),
                        };
                        index++;
                      }
                    } else {
                      // We don't have items so use all 'pieces' matches.
                      items[index] = {
                        index: index,
                        id: window.gcexports.encodeID([langID, data1[i].id, 0]),
                        date: data1[i].created.substring(0,10),
                      };
                      index++;
                    }
                  }
                }
              } else if (data2.length > 0) {
                for (let i = 0; i < data2.length; i++) {
                  let id = data2[i].id;
                  items[index] = {
                    index: index,
                    id: data2[i].itemid,
                    date: data2[i].created.substring(0,10),
                  };
                  index++;
                }
              } else if (itemsHash) {
                // Just use items.
                Object.keys(itemsHash).forEach(id => {
                  for (let j = 0; j < itemsHash[id].length; j++) {
                    items[index] = {
                      index: index,
                      date: itemsHash[id][j].created.substring(0,10),
                      id: itemsHash[id][j].id,
                    };
                    index++;
                  }
                });
              }
              self.items = items;
              resume(null, items);
            }
          );
        }
      );
    }
  }

  onChange(data) {
    this.setState(data);
  }

  render() {
    let show = localStorage.getItem('findView-' + window.gcexports.language) === 'true';
    if (!show) {
      return <div/>;
    }
    return (
      <div>
        <textarea id="filter" className="u-full-width"
                  value={this.state && this.state.value}
                  onBlur={this.onFilterBlur} rows="1"
                  placeholder="Enter filter here..."
                  style={{margin: "10 35", width: "812"}} />
      </div>
    );
  }

  onFilterBlur(e) {
    this.items = null;
    findFilter = e.target.value;
    d3.select("#find-view")
      .selectAll("svg").remove();
    d3.select("#find-view")
      .selectAll("div.buttons").remove();
    this.setState({
      findFilter: e.target.value
    });
  }
}

class FindView extends React.Component {
  componentDidUpdate() {
    clearTimeout(this.timeoutID);
  }

  setTimeout() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }

  render() {
    return (
      <FindContent className="findContentStage" />
    );
  }

  componentDidMount() {
  }
  componentDidUpdate(prevProps, prevState) {
  }
}
export default FindView;
