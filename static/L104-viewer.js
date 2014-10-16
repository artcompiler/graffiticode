/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {

  function update(obj, src, pool) {
    var stimulus;
    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;
    var obj = JSON.parse(exports.obj);
    var html = "";
    html += "<div class='piece' style='width: auto; background-color: #FFF; padding: 10px;'>";
    obj.forEach(function (item, n) {
      if (n > 0) {
        html += "<p/>";
      }
      var type = item.type;
      switch (type) {
      case "association":
        item = item.data;
        stimulus = item[0].stimulus;
        html += "<div style=' font-size: 150%;'><b>" + "Association" + "</b></div>";
        html += "<div class='piece' style='width: auto; background-color: #FFF;'>";
        html += "<div style=' font-size: 100%;'><b>" + stimulus + "</b></div>";
        html += "<table style='text-align: left;'>";
        html += "<tr><th>#</th><th>Cities</th><th>Countries</th><th>Key</th></tr>";
        item.forEach(function (row, i) {
          html += "<tr><th style='padding-right: 15px'>" + (i + 1) + "</th>";
          html += "<td style='padding-right: 15px'>" + row.stimulus_list + "</td>";
          html += "<td style='padding-right: 15px'>" + row.possible_responses + "</td>";
          html += "<td style='padding-right: 15px'>" + row.validation.valid_response.value + "</td>";
          html += "</tr>";
        });
        html += "</table></div>";
        break;
      case "mcq":
        item = item.data;
        stimulus = item[0].stimulus;
        html += "<div style=' font-size: 150%;'><b>" + "Multiple Choice" + "</b></div>";
        html += "<div class='piece' style='width: auto; background-color: #FFF;'><div style=' font-size: 100%;'><b>" + stimulus + "</b></div>";
        html += "<table style='text-align: left;'>";
        html += "<tr><th>#</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Key</th></tr>";
        item.forEach(function (row, i) {
          html += "<tr><th style='padding-right: 15px'>" + (i + 1) + "</th>";
          var correctResponse = row.validation.valid_response.value;
          row.options.forEach(function (col, i) {
            var label = col.label;
            if (col.value === correctResponse) {
              label = "<b>" + label + "</b>";
              key = i;
            }
            html += "<td style='padding-right: 15px'>" + label + "</td>";
          });
          html += "<td style='padding-right: 15px'>" + ["A", "B", "C", "D"][key] + "</td>";
          html += "</tr>";
        });
        html += "</table></div>";
        break;
      case "formulaV2":
        html += "<div style=' font-size: 150%;'><b>" + "Formula Questions" + "</b></div>";
        html += "<table style='text-align: left;'>";
        html += "<tr><th>#</th><th>Stimulus</th><th>Value</th></tr>";
        item.data.forEach(function (item, i) {
          html += "<tr><th style='padding-right: 15px'>" + (i + 1) + "</th>";
          html += "<td style='padding-right: 15px'>" + item.stimulus + "</td>";
          html += "<td style='padding-right: 15px'>" + item.validation.valid_response.value + "</td>";
          html += "</tr>";
        });
        html += "</table>";
        break;
      case "show":
        html += item.html;
        break;
      }
    });
    html += "</div>";
    d3.select("#graff-view").html(html);
  }

  function capture() {
    var html = d3.select("#graff-view").html();
    return "<div style='padding: 10px;'>" + html + "</div>";
  }

  return {
    update: update,
    capture: capture,
  };
})();
