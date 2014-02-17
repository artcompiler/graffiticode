/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2014, Art Compiler LLC */

var _ = require("underscore");

if (!this.GraffitiCode) {
  this.GraffitiCode = GraffitiCode = {};
  console.log("transform making GraffitiCode");
}

exports.transformer = GraffitiCode.transformer = function() {

  function print(str) {
    console.log(str);
  }

  var table = {
    "PROG" : program,
    "EXPRS" : exprs,
    "CALL" : callExpr,
    "IDENT" : ident,
    "BOOL" : bool,
    "NUM" : num,
    "STR" : str,
    "PARENS" : parens,
    "GRID" : grid,
    "TRI" : triangle,
    "TRISIDE" : triside,
    "RECT" : rectangle,
    "ELLIPSE" : ellipse,
    "BEZIER" : bezier,
    "LINE" : line,
    "POINT" : point,

    "PATH" : path,
    "CLOSEPATH" : closepath,
    "MOVETO" : moveto,
    "LINETO" : lineto,
    "CURVETO" : curveto,
    "ARCTO" : arcto,
    "ARC" : arc,

    "RAND" : random,
    "PLUS" : plus,
    "MINUS" : minus,
    "TIMES" : times,
    "FRAC" : frac,
    "POW" : pow,

    "TEXT" : text,
    "MATH-TEXT" : math_text,

    "FSIZE" : fsize,
    "ROTATE" : rotate,
    "SCALE" : scale,
    "TRANSLATE" : translate,
    "SKEWX" : skewX,
    "SKEWY" : skewY,
    "RGB" : rgb,
    "RGBA" : rgba,
    "FILL" : fill,
    "CLIP" : clip,
    "STROKE" : stroke,
    "STROKEWIDTH" : strokeWidth,
    "COLOR" : color,
    "SIZE" : size,
    "BACKGROUND" : background,

    "PI": pi,
  }

  // CONTROL FLOW ENDS HERE

  var canvasWidth = 0
  var canvasHeight = 0
  var canvasColor = ""

  var ticket = 1000

  exports.transform = transform
  exports.canvasWidth = function() {return canvasWidth}
  exports.canvasHeight =  function() {return canvasHeight}
  exports.canvasColor =  function() { 
    return canvasColor
  }

  return {
    transform: transform,
  };
  
  var nodePool

  function transform(pool) {
    nodePool = pool;
    return visit(pool.root);
  }

  function visit(nid) {
    // Get the node from the pool of nodes.
    var node = nodePool[nid];
    print("visit() nid="+nid+" node="+JSON.stringify(node))
    if (node == null) {
      return null;
    } else if (node.tag === void 0) {
      return [ ];  // clean up stubs
    } else if (isFunction(table[node.tag])) {
      // There is a visitor for this node, so call it.
      var ret = table[node.tag](node);
      return ret;
    } else {
      throw "missing visitor method for " + node.tag;
    }
  }

  function isArray(v) {
    return _.isArray(v);
  }

  function isObject(v) {
    return _isObjet(v);
  }

  function isString(v) {
    return _.isString(v);
  }

  function isPrimitive(v) {
    return _.isNull(v) || _.isString(v) || _.isNumber(v) || _.isBoolean(v);
  }

  function isFunction(v) {
    return _.isFunction(v);
  }

  // BEGIN VISITOR METHODS

  var edgesNode;

  function program(node) {
    //print("program() nodePool="+JSON.stringify(nodePool))
    canvasSize(640, 360) // default size
    canvasColor = "255" // default color
    var elts = [ ]
    elts.push(visit(node.elts[0]))
    return {
      "tag": "g",
      //            "class": "program",
      "elts": elts
    }
  }

  function exprs(node) {
    //print("exprs() node="+JSON.stringify(node))
    var elts = []
    if (node.elts) {
      for (var i = 0; i < node.elts.length; i++) {
        elts.push(visit(node.elts[i]))
      }
    }
    if (elts.length===1) {
      return elts[0]
    }
    return {
      tag: "g",
      //            class: "exprs",
      elts: elts
    }
  }

  function callExpr(node) {
    //print("callExpr")
    var name = visit(node.elts.pop())
    var elts = []
    for (var i = node.elts.length-1; i >= 0; i--) {
      elts.push(visit(node.elts[i]))
    }
    return {
      "tag": name,
      "elts": elts
    }
  }
  
  function canvasSize(width, height) {
    canvasWidth = width
    canvasHeight = height
  }

  function triangle(node) {
    //print("triangle")
    var elts = []
    var x0 = visit(node.elts[5])
    var y0 = visit(node.elts[4])
    var x1 = visit(node.elts[3])
    var y1 = visit(node.elts[2])
    var x2 = visit(node.elts[1])
    var y2 = visit(node.elts[0])
    var d = x0 + " " + y0 + " " +
      x1 + " " + y1 + " " +
      x2 + " " + y2
    return {
      "tag": "polygon",
      "points": d
    }
  }

  function grid(node) {
    //print("grid")
    var elts = [];
    var w = +visit(node.elts[3]);
    var h = +visit(node.elts[2]);
    var sw = +visit(node.elts[1]);
    var sh = +visit(node.elts[0]);
    for (var x = w; w > 0 && x < sw; x+=w) {
      elts.push({tag: "line", x1: x, y1: 0, x2: x, y2: sh})
    }
    for (var y = h; h > 0 && y < sh; y+=h) {
      elts.push({tag: "line", x1: 0, y1: y, x2: sw, y2: y})
    }
    var n = {
      "tag": "g",
      "elts": elts,
    };
    return n;
  }

  function random(node) {
    //print("random");
    var elts = [];
    var min = +visit(node.elts[0]);
    var max = +visit(node.elts[1]);
    if (max < min) {
      var t = max;
      max = min;
      min = t;
    }
    var rand = Math.random();
    console.log("min=" + min + " max=" + max + " rand=" + rand);
    console.log("x=" + ((max-min)*rand));
    var num = min + Math.floor((max-min)*rand);
    console.log("num=" + num);
    return num;
  }

  function plus(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return v1 + "+" + v2;
  }

  function minus(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return v1 + "-" + v2;
  }

  function times(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return v1 + " \\times " + v2;
  }

  function frac(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return "\\frac{" + v1 + "}{" + v2 + "}";
  }

  function pow(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return v1 + "^{" + v2 + "}";
  }

  function rectangle(node) {
    //print("rectangle");
    var elts = [];
    var w = visit(node.elts[1]);
    var h = visit(node.elts[0]);
    return {
      "tag": "rect",
      "x": "0",
      "y": "0",
      "width": w,
      "height": h,
    };
  }

  function ellipse(node) {
    //print("ellipse");
    var elts = [];
    var w = visit(node.elts[1]);
    var h = visit(node.elts[0]);
    return {
      "tag": "ellipse",
      "rx": w/2,
      "ry": h/2,
    };
  }

  function polarToCartesian(centerX, centerY, radiusX, radiusY, angleInDegrees) {
    var angleInRadians = angleInDegrees * Math.PI / 180.0;
    var x = centerX + radiusX * Math.cos(angleInRadians);
    var y = centerY + radiusY * Math.sin(angleInRadians);
    return [x,y];
  }

  function arc(node) {
    //print("arc");
    var elts = [];
    var rx = visit(node.elts[3]) / 2;
    var ry = visit(node.elts[2]) / 2;
    var start = visit(node.elts[1]);
    var stop = visit(node.elts[0]);
    var p0 = polarToCartesian(0, 0, rx, ry, start);
    var p1 = polarToCartesian(0, 0, rx, ry, stop);
    var x0 = p0[0];
    var y0 = p0[1];
    var x1 = p1[0];
    var y1 = p1[1];
    var large = stop - start > 180 ? 1 : 0;
    return {
      "tag": "path",
      "d": "M "+x0+" "+y0+" A "+rx+" "+ry+" 0 "+large+" 1 "+x1+" "+y1,
    };
  }

  function bezier(node) {
    //print("bezier")
    var elts = []
    var x0 = visit(node.elts[7])
    var y0 = visit(node.elts[6])
    var x1 = visit(node.elts[5])
    var y1 = visit(node.elts[4])
    var x2 = visit(node.elts[3])
    var y2 = visit(node.elts[2])
    var x3 = visit(node.elts[1])
    var y3 = visit(node.elts[0])
    var d = "M " + x0 + " " + y0 + 
      " C " + x1 + " " + y1 + " " +
      x2 + " " + y2 + " " +
      x3 + " " + y3
    return {
      "tag": "path",
      "d": d
    }
  }

  function line(node) {
    //print("line")
    var x = visit(node.elts[1])
    var y = visit(node.elts[0])
    return {
      "tag": "line",
      "x1": 0,
      "y1": 0,
      "x2": x,
      "y2": y,
    }
  }

  function point(node) {
    //print("point")
    var x = visit(node.elts[1])
    var y = visit(node.elts[0])
    return {
      "tag": "ellipse",
      "cx": x,
      "cy": y,
      "rx": 1/2,
      "ry": 1/2,
    }
  }

  function path(node) {
    //print("path")
    var elts = []
    var d = visit(node.elts[0])
    return {
      "tag": "path",
      "d": d
    }
  }

  function moveto(node) {
    //print("moveto")
    var x = visit(node.elts[2])
    var y = visit(node.elts[1])
    var d = visit(node.elts[0])
    return "M "+x+" "+y+" "+d
  }

  function lineto(node) {
    //print("lineto")
    var x = visit(node.elts[2])
    var y = visit(node.elts[1])
    var d = visit(node.elts[0])
    return "L "+x+" "+y+" "+d
  }

  function curveto(node) {
    //print("curveto")
    var x1 = visit(node.elts[6])
    var y1 = visit(node.elts[5])
    var x2 = visit(node.elts[4])
    var y2 = visit(node.elts[3])
    var x = visit(node.elts[2])
    var y = visit(node.elts[1])
    var d = visit(node.elts[0])
    return "C "+x1+" "+y1+" "+x2+" "+y2+" "+x+" "+y+" "+d
  }

  function arcto(node) {
    //print("arcto")
    var elts = []
    var rx = visit(node.elts[4]) / 2
    var ry = visit(node.elts[3]) / 2
    var start = visit(node.elts[2])
    var stop = visit(node.elts[1])
    var d = visit(node.elts[0])
    var p0 = polarToCartesian(0, 0, rx, ry, start)
    var p1 = polarToCartesian(0, 0, rx, ry, stop)
    var x0 = p0[0]
    var y0 = p0[1]
    var x1 = start //p1[0] - p0[0]
    var y1 = stop  //p1[1] - p0[1]
    var large = stop - start > 180 ? 1 : 0

    return "A "+rx+" "+ry+" 0 "+large+" 1 "+x1+" "+y1+" "+d
  }

  function closepath(node) {
    //print("closepath")
    return "Z"
  }

  function text(node) {
    //print("text")
    var elts = []
    var str = ""+visit(node.elts[0])
    elts.push(str)
    return {
      "tag": "text",
      "elts": elts,
    }
  }

  function math_text(node) {
    //print("math_text");
    var elts = [];
//    var str = toLaTeX(node.elts[0]);
    var str = ""+visit(node.elts[0]);
    return {
      "tag": "foreignObject",
      "width": canvasWidth,
      "height": canvasHeight,
      "elts": ["\$" + str + "\$"],
    };
  }

  function fsize(node) {
    //print("fsize")
    var elts = []
    var size = visit(node.elts[1])
    elts.push(visit(node.elts[0]))
    return {
      "tag": "g",
      "font-size": size,
      "elts": elts,
    }
  }

  function triside(node) {
    //print("triangle")
    var elts = []
    var l2 = visit(node.elts[2])
    var l1 = visit(node.elts[1])
    var l0 = visit(node.elts[0])

    var cos0 = (l1*l1 + l2*l2 - l0*l0) / (2*l1*l2)
    var sin0 = Math.sqrt(1 - cos0*cos0)

    var cos1 = (l2*l2 + l0*l0 - l1*l1) / (2*l2*l0)
    var sin1 = Math.sqrt(1 - cos1*cos1)

    var cos2 = (l0*l0 + l1*l1 - l2*l2) / (2*l0*l1)
    var sin2 = Math.sqrt(1 - cos2*cos2)

    var x0 = 0
    var y0 = 0
    var x1 = x0 + l1*cos1
    var y1 = y0 + l1*sin1
    var x2 = x1 + l2*cos2
    var y2 = y1 - l2*sin2

    var d = x0 + " " + y0 + " " +
      x1 + " " + y1 + " " +
      x2 + " " + y2
    return {
      "tag": "polygon",
      "points": d
    }
  }

  function rotate(node) {
    //print("rotate")
    var elts = []
    var angle = visit(node.elts[1])
    var shape = visit(node.elts[0])
    return {
      "tag": "g",
      "transform": "rotate("+angle+")",
      "elts": [shape],
    }
  }

  function translate(node) {
    //print("translate")
    var elts = []
    var x = +visit(node.elts[2])
    var y = +visit(node.elts[1])
    var shape = visit(node.elts[0])
    return {
      "tag": "g",
      "transform": "translate("+x+", "+y+")",
      "elts": [shape],
    }
  }

  function scale(node) {
    //print("scale")
    var elts = []
    var factor = visit(node.elts[1])
    var shape = visit(node.elts[0])
    return {
      "tag": "g",
      "transform": "scale("+factor+")",
      "elts": [shape],
    }
  }

  function skewX(node) {
    //print("skewX")
    var elts = []
    var angle = visit(node.elts[1])
    var shape = visit(node.elts[0])
    return {
      "tag": "g",
      "transform": "skewX("+angle+")",
      "elts": [shape],
    }
  }

  function skewY(node) {
    //print("skewY")
    var elts = []
    var angle = visit(node.elts[1])
    var shape = visit(node.elts[0])
    return {
      "tag": "g",
      "transform": "skewY("+angle+")",
      "elts": [shape],
    }
  }

  function rgb(node) {
    //print("rgb")
    var elts = []
    var r = visit(node.elts[2])
    var g = visit(node.elts[1])
    var b = visit(node.elts[0])
    return {
      r: r,
      g: g,
      b: b,
    }
  }

  function rgba(node) {
    //print("rgb")
    var elts = []
    var r = visit(node.elts[3])
    var g = visit(node.elts[2])
    var b = visit(node.elts[1])
    var a = visit(node.elts[0])/100
    return {
      r: r,
      g: g,
      b: b,
      a: a,
    }
  }

  function color(node) {
    //print("color")
    var elts = []
    var rgb = visit(node.elts[1])
    var shape = visit(node.elts[0])

    if (rgb.r === void 0) {
      var val = rgb
      rgb = {}
      rgb.r = rgb.g = rgb.b = val;
    }

    var r = rgb.r
    var g = rgb.g
    var b = rgb.b
    var a = rgb.a
    if (a !== void 0) {
      return {
        "tag": "g",
        "stroke": "rgba("+r+", "+g+", "+b+", "+a+")",
        "fill": "rgba("+r+", "+g+", "+b+", "+a+")",
        "elts": [shape],
      }
    }
    
    return {
      "tag": "g",
      "stroke": "rgb("+r+", "+g+", "+b+")",
      "fill": "rgb("+r+", "+g+", "+b+")",
      "elts": [shape],
    }
  }

  function size(node) {
    //print("size")
    var elts = []
    var width = visit(node.elts[1])
    var height = visit(node.elts[0])
    canvasSize(width, height)
    return void 0
  }

  function background(node) {
    var elts = []
    var rgb = visit(node.elts[0])

    // if it is a scalar, compute grey value
    if (rgb.r === void 0) {
      var val = rgb
      rgb = {}
      rgb.r = rgb.g = rgb.b = val;
    }

    var r = rgb.r
    var g = rgb.g
    var b = rgb.b
    var a = rgb.a
    if (a !== void 0) {
      canvasColor = "rgba("+r+", "+g+", "+b+", "+a+")"
    }
    else {
      canvasColor = "rgb("+r+", "+g+", "+b+")"
    }
    return void 0
  }

  function stroke(node) {
    //print("stroke")
    var elts = []
    var rgb = visit(node.elts[1])
    var shape = visit(node.elts[0])

    if (rgb.r === void 0) {
      var val = rgb
      rgb = {}
      rgb.r = rgb.g = rgb.b = val;
    }

    var r = rgb.r
    var g = rgb.g
    var b = rgb.b
    var a = rgb.a
    if (a !== void 0) {
      return {
        "tag": "g",
        "stroke": "rgba("+r+", "+g+", "+b+", "+a+")",
        "elts": [shape],
      }
    }

    return {
      "tag": "g",
      "stroke": "rgb("+r+", "+g+", "+b+")",
      "elts": [shape],
    }
  }

  function strokeWidth(node) {
    //print("strokeWidth")
    var elts = []
    var width = visit(node.elts[1])
    var shape = visit(node.elts[0])

    return {
      "tag": "g",
      "stroke-width": width,
      "elts": [shape],
    }
  }

  function fill(node) {
    //print("fill")
    var elts = []
    var rgb = visit(node.elts[1])
    var shape = visit(node.elts[0])

    if (rgb.r === void 0) {
      var val = rgb
      rgb = {}
      rgb.r = rgb.g = rgb.b = val;
    }

    var r = rgb.r
    var g = rgb.g
    var b = rgb.b
    var a = rgb.a
    if (a !== void 0) {
      return {
        "tag": "g",
        "fill": "rgba("+r+", "+g+", "+b+", "+a+")",
        "elts": [shape],
      }
    }

    return {
      "tag": "g",
      "fill": "rgb("+r+", "+g+", "+b+")",
      "elts": [shape],
    }
  }

  function genSym(str) {
    ticket += 1
    return str+"-"+ticket
  }

  function clip(node) {
    //print("clip")
    var elts = []
    var path = visit(node.elts[1])
    var shape = visit(node.elts[0])
    var id = genSym("clip-path")
    elts.push({
      "tag": "clipPath",
      "id": id,
      "elts": [path],
    })

    shape["clip-path"] = "url(#"+id+")"

    elts.push(shape)

    return {
      "tag": "g",
      "clip-rule": "nonzero",
      "elts": elts,
    }
  }

  function ident(node) {
    //print("identifier()")
    return node.elts[0]
  }

  function bool(node) {
    //print("bool()")
    return node.elts[0]
  }

  function num(node) {
    //print("num()")
    return node.elts[0]
  }

  function str(node) {
    //print("str()")
    return node.elts[0]
  }

  function parens(node) {
    //print("parens()")
    var v1 = visit(node.elts[0]);
    return "(" + v1 + ")";
  }

  function pi(node) {
    print("pi")
    return "\\pi"
  }

  function stub(node) {
    //print("stub: " + node.tag)
    return ""
  }
}()
