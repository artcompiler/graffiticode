/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.viewer = (function () {

  function update(obj, src, pool) {
    $("#graff-view").html("<div " +
         "scrolling:no>" + obj + "</div>");
    $("#graff-view div")
      .load(function() {
        var width = $(this).contents().width();
        var height = $(this).contents().height();
        $("#graff-view div").css("height", height + "px");
        $("#graff-view div").css("width", width + "px");
      });
    exports.src = src;
    exports.pool = pool;
    exports.obj = obj;
    if (exports.lexiconType === "math") {
      exports.obj = "\$\$" + obj + "\$\$"
    }
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "graff-view"]);
  }

  return {
    update: update,
  };
})();
