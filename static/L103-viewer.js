/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {

  function update(obj, src, pool) {
    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;
    d3.select("#graff-view").html("<div class='latex'/>");
    d3.select("#graff-view .latex").html("<svg width='100px' height='100px'>" + obj.replace(/span/g, "g") + "</svg>");
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
