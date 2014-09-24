/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {

  function update(obj, src, pool) {
    console.log("obj=" + obj);
/*
    $("#graff-view").html("<div " +
         "scrolling:no>" + obj + "</div>");
    $("#graff-view div")
      .load(function() {
        var width = $(this).contents().width();
        var height = $(this).contents().height();
        $("#graff-view div").css("height", height + "px");
        $("#graff-view div").css("width", width + "px");
      });
*/
    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;

    // Create a new directed graph
    var g = new dagreD3.Digraph();
    
    obj = JSON.parse(obj);
    if (obj.nodes) {
      obj.nodes.forEach(function (n) {
        console.log("n=" + n);
        g.addNode(n, {label: n});
      });
    }
    if (obj.edges) {
      obj.edges.forEach(function (e) {
        g.addEdge(null, e.from, e.to, {label: e.label});
      });
    }
    
    $("#graff-view").html(
      '<svg xmlns="http://www.w3.org/2000/svg" width="650" height="680">' +
        '<defs>' +
        '<style>' +
        'svg {' +
        '    overflow: hidden;' +
        '}' +
        '' +
        '.node rect {' +
        '    stroke: #333;' +
        '    stroke-width: 1.5px;' +
        '    fill: #fff;' +
        '}' +
        '' +
        '.edgeLabel rect {' +
        '    fill: #fff;' +
        '}' +
        '' +
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
    renderer.run(g, d3.select("#graff-view svg g"));

  }

  function capture() {

    // My SVG file as s string.
    var mySVG = $("#graff-view").html();
/*
    // Create a Data URI.
//    var mySrc = 'data:image/svg+xml;base64,'+window.btoa(mySVG);
    // Load up our image.
    var source = new Image();
    source.src = "data:image/svg+xml;base64,"+window.btoa(mySVG);

    // Set up our canvas on the page before doing anything.
    var myCanvas = document.createElement('canvas');
    myCanvas.width = 640;
    myCanvas.height = 480;
    document.getElementById('graff-view').appendChild(myCanvas);
    // Get drawing context for the Canvas
    var myCanvasContext = myCanvas.getContext('2d');
    // Load up our image.
    // Render our SVG image to the canvas once it loads.
    source.onload = function(){
      myCanvasContext.drawImage(source,0,0);
    }
*/
    return mySVG;
  }

  return {
    update: update,
    capture: capture,
  };
})();
