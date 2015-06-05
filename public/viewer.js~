/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {
  function reset() {
  }
  var height;
  function updateObj(obj) {
    objCodeMirror.setValue(obj);
  }
  function update(obj, src, pool) {
    reset();
    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;
    obj = JSON.parse(obj);
    if (!obj.json) {
      return;
    }
    var fill, fontStyle;
    var value = obj.json.validation.valid_response.value[0];
    var options = "";
    var method = value.method;
    Object.keys(value.options).sort().forEach(function (v) {
      switch(v) {
      case "inverseResult":
        if (value.options[v] === true) {
          method = "NOT " + method;
        }
        break;
      case "dontExpandPowers":
      case "dontFactorDenominators":
        // Erase.
        delete value.options[v];
        break;
      case "decimalPlaces":
      case "field":
      default:
        options += v + "=" + JSON.stringify(value.options[v]) + " ";
        break;
      }
    });
    updateObj(JSON.stringify(obj.json, null, 2));
    var svg = obj.svg;
    function getSize(svg) {
      svg = svg.slice(svg.indexOf("width=") + 7 + 5);
      var width = svg.slice(0, svg.indexOf("ex")) * 8;  // ex=8px
      svg = svg.slice(svg.indexOf("height=") + 8 + 5);
      var height = svg.slice(0, svg.indexOf("ex")) * 8 + 5;
      if (isNaN(width) || isNaN(height)) {
        width = 640;
        height = 30;
      }
      return {
        width: width,
        height: height
      }
    }
    var text =
      "<text x='30' y='20'>" +
      "<tspan font-size='14' font-weight='600'>" + method + "</tspan> " +
      "<tspan font-weight='400' font-style='italic'>" + options  + "</tspan>" +
      "</text> ";
    var svg;
    if (obj.valueSVG) {
      var valueSize = getSize(obj.valueSVG);
      var responseSize = getSize(obj.responseSVG);
      svg =
        "<image width='" + valueSize.width +
        "' height='" + valueSize.height +
        "' x='4' y='30' xlink:href='data:image/svg+xml;utf8," + obj.valueSVG +
        "'/><image width='" + responseSize.width +
        "' height='" + responseSize.height +
        "' x='4' y='" + (valueSize.height + 40) +
        "' xlink:href='data:image/svg+xml;utf8," + obj.responseSVG +
        "'/>";
    } else {
      var valueHeight = 0;
      if (obj.value) {
        text += 
        "<text x='4' y='45'><tspan font-size='12' font-weight='400'>" + obj.value + "</tspan></text>";
        valueHeight = 20;
      }
      var responseSize = getSize(obj.responseSVG);
      svg =
        "<image width='" + responseSize.width +
        "' height='" + responseSize.height +
        "' x='4' y='" + (valueHeight + 35) + "' xlink:href='data:image/svg+xml;utf8," + obj.responseSVG +
        "'/>";
    }
    var border;
    if (obj.score > 0) {
      fill = "#FFF";
      border = "rgb(100,255,100)";
      fontStyle = "normal";
      heading = text;
      checkSrc = 
        '<rect x="4" y="4" width="20" height="20" fill="rgb(100, 255, 100)" ' +
        'fill-opacity="1" stroke-opacity="0"/> ';
    } else if (obj.score < 0) {
      fill = "#FFF";
      border = "rgb(255,100,100)";
      fontStyle = "normal";
      heading = text;
      checkSrc = 
        '<rect x="4" y="4" width="20" height="20" fill="rgb(255, 100, 100)" ' +
        'fill-opacity="1" stroke-opacity="0"/> ';
    } else {
      fill = "#FFF";
      border = "rgb(255,255,100)";
      fontStyle = "italic";
      heading = "ERROR " + src;
      text = "Invalid program code.";
      checkSrc = 
        '<rect x="4" y="4" width="20" height="20" fill="rgb(255, 255, 100)" ' +
        'fill-opacity="1" stroke-opacity="0"/> ';
    }
    var data = [];
    data.push(text);
    height = 28;
    $("#graff-view")
      .html('<svg style="background-color:" ' + fill +
            'xmlns="http://www.w3.org/2000/svg" width="640" height="' +
            height +
            '"><g>' + checkSrc + text + svg + '</g></svg>');
    var bbox = $("#graff-view svg g")[0].getBBox();
    $("#graff-view svg").attr("height", (bbox.height + 20) + "px");
    $("#graff-view svg").attr("width", (bbox.width + 40) + "px");
  }
  function capture() {
    // My SVG file as s string.
    var mySVG = $("#graff-view").html();
/*
    // Create a Data URI.
    // Load up our image.
    // Set up our canvas on the page before doing anything.
    var old = document.getElementById('graff-view').children[0];
    var myCanvas = document.createElement('canvas');
    var bbox = $("#graff-view svg g")[0].getBBox();
    myCanvas.height = bbox.height + 12;
    myCanvas.width = bbox.width + 40;
    document.getElementById('graff-view').replaceChild(myCanvas, old);
    // Get drawing context for the Canvas
    var myCanvasContext = myCanvas.getContext('2d');
    // Load up our image.
    // Render our SVG image to the canvas once it loads.
    var source = new Image();
    source.src = "data:image/svg+xml;base64," + window.btoa(mySVG);
    myCanvasContext.drawImage(source,0,0);
    var dataURL = myCanvas.toDataURL();
    document.getElementById('graff-view').replaceChild(old, myCanvas);
    return '<html><img class="thumbnail" src="' + dataURL + '"/></html>';
*/
    return '<html>' + mySVG + '</html>';
  }
  return {
    update: update,
    capture: capture,
  };
})();

