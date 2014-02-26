/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2012, Jeff Dyer */

  if (!this.GraffitiCode) {
    this.GraffitiCode = GraffitiCode = {}
    console.log("render making GraffitiCode")
  }

var transformer = require('./transform.js')

exports.renderer = function() {

  exports.render = render

  return {
    render: render,
  }

  // CONTROL FLOW ENDS HERE
  function print(str) {
    console.log(str)
  }
  
  var nodePool

  function prefix() {        
    return [ '<?xml version="1.0" standalone="no"?>'
             , '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '
             , '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
             , '<svg'
             , '  viewBox="0 0 ' + transformer.canvasWidth() + ' ' + transformer.canvasHeight()+'"'
             , '  width="' + transformer.canvasWidth() + '" height="' + transformer.canvasHeight() + '"'
             , '  xmlns:xlink="http://www.w3.org/1999/xlink"'
             , '  xmlns="http://www.w3.org/2000/svg"'
             , '  font-family="Verdana"' 
             , '  font-size="12"'
             , '  fill="#fff"'
             , '  stroke="#000"'
             , '  version="1.1"'
             , '  preserveAspectRatio="xMidYMid meet"'
             , '  overflow="hidden"'
             , '  clip="rect(50,50,50,50)"'
             , '  style="background:'+transformer.canvasColor()+'"' + '>'
           ].join("\n")
  }

  function suffix() {
    return [ ''
             , '</svg>'
           ].join("\n")
  }

  function render(node) {
    //        nodePool = pool
    var str = ""
    str += prefix()
    str += visit(node, "  ")
    str += suffix()
    return str
  }


  function visit(node, padding) {

    if (typeof node === "string") {
      return node
    }

    var tagName = node.tag
    var attrs = ""
    for (var name in node) {
      if (name=="tag" || name=="elts") {
        continue
      }
      else if (tagName === "path" && name === "d") {
        attrs += " d='" + node[name] + "'"
        continue
      }
      attrs += " " + name + "='" + node[name] + "'"
    }

    if (attrs.length === 0) {
      var indent = ""
    }
    else {
      var indent = "   "
    }

    var elts = ""
    if (node.elts) {
      for (var i = 0; i < node.elts.length; i++) {
        if (node.elts[i]) {  // skip empty elts
          elts += visit(node.elts[i], padding+indent)
        }
      }
    }

    if (tagName === "g" && attrs.length === 0) {   // skip g elements without attrs
      var tag = elts
    }
    else {
      var tag = "\n"+padding+"<" + tagName + attrs + ">" + elts + "\n"+padding+"</" + tagName + ">"
    }
    return tag
  }

}()

