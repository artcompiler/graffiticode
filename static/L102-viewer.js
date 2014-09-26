/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {

  function update(obj, src, pool) {

    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;

    // Create a new directed graph
    var g = new dagreD3.Digraph();
    
    obj = JSON.parse(obj);
    var startNode, stopNode;
    startNode = obj.start;
    stopNode = obj.stop;
    if (obj.nodes) {
      obj.nodes.forEach(function (n) {
        g.addNode(n, {label: n});
      });
    }
    if (obj.edges) {
      obj.edges.forEach(function (e) {
        g.addEdge(null, e.from, e.to, {label: e.label});
      });
    }
    
    $("#graff-view").html(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="10000">' +
        '<defs>' +
        '<style>' +
        'svg {' +
        '    overflow: hidden;' +
        '}' +
        '.node rect {' +
        '    stroke: #333;' +
        '    stroke-width: 1.5px;' +
        '    fill: #fff;' +
        '}' +
        '#start rect {' +
        '    fill: #0f0;' +
        '}' +
        '#stop rect {' +
        '    fill: #f00;' +
        '}' +
        '.edgeLabel rect {' +
        '    fill: #fff;' +
        '}' +
        '.edgePath {' +
        '    stroke: #333;' +
        '    stroke-width: 1.5px;' +
        '    fill: none;' +
        '}' +
        'text {' +
        '  font-weight: 300;' +
        '  font-family: "Helvetica Neue", Helvetica, Arial, sans-serf;' +
        '  font-size: 11px;' +
        '}' +
        '</style>' +
        '</defs>' +
        '    <g transform="translate(20,20)"/>' +
        '</svg>'
    );

    var renderer = new dagreD3.Renderer();
    renderer.zoom(false);
    renderer.run(g, d3.select("#graff-view svg g"));
    startNode.forEach(function(n) {
      $(".node:contains('" + n + "')").attr("id", "start");
    });
    stopNode.forEach(function(n) {
      $(".node:contains('" + n + "')").attr("id", "stop");
    });
    var bbox = $("#graff-view svg g")[0].getBBox();
    $("#graff-view svg").attr("height", (bbox.height + 40) + "px");
    $("#graff-view svg").attr("width", (bbox.width + 40) + "px");

  }

  function capture() {

    // My SVG file as s string.
    var mySVG = $("#graff-view").html();
    // Create a Data URI.
    // Load up our image.

    // Set up our canvas on the page before doing anything.
    var old = document.getElementById('graff-view').children[0];
    var myCanvas = document.createElement('canvas');
    var bbox = $("#graff-view svg")[0].getBBox();
    myCanvas.width = bbox.width;
    myCanvas.height = bbox.height;

    document.getElementById('graff-view').replaceChild(myCanvas, old);
    // Get drawing context for the Canvas
    var myCanvasContext = myCanvas.getContext('2d');
    // Load up our image.
    // Render our SVG image to the canvas once it loads.
    var source = new Image();
    source.src = "data:image/svg+xml,"+mySVG;
    myCanvasContext.drawImage(source,0,0);
    var dataURL = myCanvas.toDataURL();
    return '<html><img class="thumbnail" src="' + dataURL + '"/></html>';
  }

  return {
    update: update,
    capture: capture,
  };
})();
