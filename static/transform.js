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

  function D3Visitor () {
    function nil(node) {
      return "d3.selectAll('.graffiti')";
//      return "d3";
    }
    function d3_this(node) {
      return "this";
    }
    function d3(node) {
      return "d3";
    }
    function dx(node) {
      return "d3.event.x";
    }
    function dy(node) {
      return "d3.event.y";
    }
    function drag(node) {
      return "d3.behavior.drag()";
    }
    function log(node) {
      var args = [];
      print("print() node=");
      print(JSON.stringify(node));
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return "console.log(" + args[0] + ")";
    }
    function str(node) {
      return "'" + node.elts[0] + "'";
    }
    function style(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".style(" + args[2] + ", " + args[1] + ")";
    };
    function text(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".text(" + args[1] + ")";
    };
    function attr(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".attr(" + args[2] + ", " + args[1] + ")";
    };
    function append(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".append(" + args[1] + ")";
    };
    function select(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".select(" + args[1] + ")";
    };
    function select_all(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".selectAll(" + args[1] + ")";
    };
    function data(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".data(" + args[1] + ")";
    };
    function enter(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".enter()";
    };
    function func(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return "(function " + args[2] + "(" + args[1].substring(1, args[1].length-1) + ") { return " + args[0] + "})";
    };
    function js_var(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return "var " + args[1] + " = " + args[0];
    };
    function times(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return args[1] + " * " + args[0];
    }
    function minus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return args[1] + " - " + args[0];
    }
    function plus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      return args[1] + " + " + args[0];
    }
    function call(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".call(" + args[1] + ")";
    };
    function on(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, d3Visitor));
      });
      var target = args[0];
      return target + ".on(" + args[2] + ", " + args[1] + ")";
    };
    return {
      "visitor-name": "D3Visitor",
      "VOID": nil,
      "STR": str,
      "LOG": log,
      "D3-THIS": d3_this,
      "D3-D3": d3,
      "D3-DX": dx,
      "D3-DY": dy,
      "D3-DRAG": drag,
      "D3-STYLE": style,
      "D3-TEXT": text,
      "D3-ATTR": attr,
      "D3-APPEND": append,
      "D3-SELECT": select,
      "D3-SELECTALL": select_all,
      "D3-DATA": data,
      "D3-ENTER": enter,
      "D3-FUNCTION": func,
      "D3-VAR": js_var,
      "D3-CALL": call,
      "D3-ON": on,
      "TIMES": times,
      "MINUS": minus,
      "PLUS": plus,
    };
  }

  function MathTextVisitor () {
    function expo(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathTextVisitor));
      });
      return "{" + args[1] + "}^{" + args[0] + "}";
    };
    function times(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathTextVisitor));
      });
      if (args[0] === 1) {
        return args[1];
      } else if (args[1] === 1) {
        return args[0];
      } else if (args[0] === 0 || args[1] === 0) {
        return "0";
      } else if (node.elts[1].tag !== "NUM") {
        return args[1] + "" + args[0];
      } else {
        return args[1] + " \\times " + args[0];
      }
    };
    function plus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathTextVisitor));
      });
      if (args[0] === "0") {
        return args[1];
      } else if (args[1] === "0") {
        return args[0];
      }
      if (String(args[0]).charAt(0) === "-") {
        return args[1] + "" + args[0];
      }
      return args[1] + "+" + args[0];
    };
    function num (node) {
      return node.elts[0];
    };
    function simplify(node) {
      var v1 = visit(node.elts[0], mathTextVisitor);
      var model = MathCore.Model.create(v1);
      var node = model.simplify(model);
      return node.toLaTeX(node);
    }
    return {
      "visitor-name": "MathTextVisitor",
      "EXPO": expo,
      "NUM": num,
      "TIMES": times,
      "PLUS": plus,
      "SIMPLIFY": simplify,
      "MATH-SIMPLIFY": simplify,
    };
  }

  function MathValueVisitor () {
    function expo(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return Math.pow(+args[1], +args[0]);
    }
    function times(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return +args[1] * +args[0];
    }
    function frac(node) {
      var v1 = visit(node.elts[0], mathValueVisitor);
      var v2 = visit(node.elts[1], mathValueVisitor);
      return +v1 / +v2;
    }
    function plus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return +args[1] + +args[0];
    }
    function minus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return +args[1] - +args[0];
    }
    function num (node) {
      return +node.elts[0];
    }
    function pi(node) {
      return Math.PI;
    }
    function cos(node) {
      var v1 = visit(node.elts[0], mathValueVisitor);
      return Math.cos(+v1);
    }
    function sin(node) {
      var v1 = visit(node.elts[0], mathValueVisitor);
      return Math.sin(+v1);
    }
    function atan(node) {
      var v1 = visit(node.elts[0], mathValueVisitor);
      return Math.atan(+v1);
    }
    function parens(node) {
      var v1 = visit(node.elts[0], mathValueVisitor);
      return +v1;
    }
    return {
      "visitor-name": "MathValueVisitor",
      "EXPO": expo,
      "NUM": num,
      "MUL": times,
      "TIMES": times,
      "FRAC": frac,
      "DIV": frac,
      "PLUS": plus,
      "MINUS": minus,
      "PI": pi,
      "COS": cos,
      "SIN": sin,
      "ATAN": atan,
      "PARENS": parens,
    };
  }

  var d3Visitor = D3Visitor();
  var mathTextVisitor = MathTextVisitor();
  var mathValueVisitor = MathValueVisitor();
  
  var table = {
    "PROG" : program,
    "EXPRS" : exprs,
    "LIST" : list,
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
    "DOT" : dot,
    "STEP" : step,
    "PENUP" : penUp,
    "PENDOWN" : penDown,
    "SHOWTRACK" : showTrack,

    "PATH" : path,
    "CLOSEPATH" : closepath,
    "MOVETO" : moveto,
    "LINETO" : lineto,
    "CURVETO" : curveto,
    "ARCTO" : arcto,
    "ARC" : arc,

    "MATH-RAND" : random,
    "RAND" : random,
    "PLUS" : plus,
    "CONCAT" : concat,
    "MINUS" : minus,
    "TIMES" : times,
    "FRAC" : frac,
    "EXPO" : expo,

    "ADD" : plus,
    "SUB" : minus,
    "MUL" : mul,
    "DIV" : div,

    "TEXT" : text,
    "MATH-TEXT" : math_text,
    "MATH-VALUE" : math_value,

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
    "COS": cos,
    "SIN": sin,
    "ATAN": atan,

    "D3-THIS": d3_this,
    "D3-DX": d3_dx,
    "D3-DY": d3_dy,
    "D3-TEXT": d3_text,
    "D3-ATTR": d3_attr,
    "D3-STYLE": d3_style,
    "D3-FUNCTION": d3_function,
    "D3-VAR": d3_var,
    "D3-ON": d3_on,
    "D3-CALL": d3_call,

    "LOG": log,
  }

  var RADIUS = 100;
  var STEP_LENGTH = 1;
  var leftX = 0, leftY = 0, rightX = 0, rightY = 0;
  var angle = 0;
  var penX, penY;
  var penState;
  var trackState;

  return {
    transform: transform,
  };
  
  // CONTROL FLOW ENDS HERE

  var nodePool

  function reset() {
    angle = 0;
    leftX = RADIUS/2;
    leftY = 0;
    rightX = -RADIUS/2;
    rightY = 0;
    penX = 0;
    penY = 0;
    penState = false;
    trackState = false;
  }

  function transform(pool) {
    reset();
    nodePool = pool;
    return visit(pool.root);
  }

  function visit(nid, visitor) {
    // Get the node from the pool of nodes.
    var node = nodePool[nid];
    if (node == null) {
      return null;
    } else if (node.tag === void 0) {
      return [ ];  // clean up stubs
    } else if (visitor) {
      var visit = visitor[node.tag];
      if (visit) {
        return visit(node);
      } else {
        print("visit() visitor=" + visitor["visitor-name"] + " tag=" + node.tag + " not found!");
      }
    }

    if (isFunction(table[node.tag])) {
      // There is a visitor method for this node, so call it.
      return table[node.tag](node);
    } else {
      console.log("Missing method for " + node.tag);
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

  function list(node) {
    var elts = []
    if (node.elts) {
      for (var i = 0; i < node.elts.length; i++) {
        elts.push(visit(node.elts[i]))
      }
    }
    return "[" + elts[0].elts + "]";
  }

  function callExpr(node) {
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
    var elts = [];
    var min = +visit(node.elts[0]);
    var max = +visit(node.elts[1]);
    if (max < min) {
      var t = max;
      max = min;
      min = t;
    }
    var rand = Math.random();
    var num = min + Math.floor((max-min)*rand);
    return num;
  }

  function concat(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return "" + v2 + v1;
  }

  function plus(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return v1 + "+" + v2;
  }

  function minus(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return v1 + "-" + v2;
  }

  function times(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return v1 + " \\times " + v2;
  }

  function frac(node) {
    var v1 = visit(node.elts[1]);
    var v2 = visit(node.elts[0]);
    return "\\frac{" + v1 + "}{" + v2 + "}";
  }

  function mul(node) {
    return visit(node, mathValueVisitor);
  }

  function div(node) {
    var v1 = visit(node.elts[0]);
    var v2 = visit(node.elts[1]);
    return v1 + " \\div " + v2;
  }

  function expo(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return v1 + "^{" + v2 + "}";
  }

  function rectangle(node) {
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
    var elts = [];
    var w = visit(node.elts[1]);
    var h = visit(node.elts[0]);
    return {
      "tag": "ellipse",
      "rx": w/2,
      "ry": h/2,
    };
  }

  // Each step taken needs to be relative to the position and direction of the
  // current state.
  function step(node) {
    var lsteps = +visit(node.elts[1]);
    var rsteps = +visit(node.elts[0]);
    var dirL = lsteps < 0 ? 1 : -1;
    var dirR = rsteps < 0 ? 1 : -1;
    lsteps = Math.abs(lsteps);
    rsteps = Math.abs(rsteps);
    var points = [];
    var offset = 0;
    var delta = 0;
    var args = [];
    if (lsteps >= rsteps) {
      delta = (lsteps - rsteps) / rsteps;  // 3
      for ( ; rsteps > 0; ) {
        offset += delta;  // Each lstep is equal to rstep plus delta.
        stepOneLeft(dirL);
        stepOneRight(dirR);
        lsteps--;
        rsteps--;
        ink(args);
        for(; offset >= 1; offset--) {  // 3 * 0 | 3 * 1
          stepOneLeft(dirL);
          lsteps--;
          ink(args);
        }
      }
      // rsteps === 0. only lsteps left
      for(; lsteps > 0; lsteps--) {  // 3 * 0 | 3 * 1
        stepOneLeft(dirL);
        ink(args);
      }
    } else {
      delta = (rsteps - lsteps) / lsteps;
      for ( ; lsteps > 0; ) {
        offset += delta;
        stepOneLeft(dirL);
        stepOneRight(dirR);
        lsteps--;
        rsteps--;
        ink(args);
        for(; offset >= 1; offset--) {  // 3 * 0 | 3 * 1
          stepOneRight(dirR);
          rsteps--;
          ink(args);
        }
      }
      // lsteps === 0. only rsteps left
      for(; rsteps > 0; rsteps--) {  // 3 * 0 | 3 * 1
        stepOneRight(dirR);
        ink(args);
      }
    }
    return {
      "tag": "g",
      "elts": args,
    };

    function ink(args) {
      if (penState) {
        args.push({
          "tag": "ellipse",
          "cx": penX,
          "cy": penY,
          "rx": 2,
          "ry": 2,
          "fill": "rgba(0,100,200,1)",
          "stroke": "rgba(0,0,0,0)",
        });
      }
      if (trackState) {
        args.push({
          "tag": "ellipse",
          "cx": leftX,
          "cy": leftY,
          "rx": .5,
          "ry": .5,
          "fill": "rgba(255,0,0,.5)",
          "stroke": "rgba(0,0,0,0)",
        }, {
          "tag": "ellipse",
          "cx": rightX,
          "cy": rightY,
          "rx": .5,
          "ry": .5,
          "fill": "rgba(0,255,0,.5)",
          "stroke": "rgba(0,0,0,0)",
        });
      }
    }
  }

  var ONESTEPANGLE = 1/RADIUS/100;

  function stepOneLeft(dir) {
    var dx = RADIUS * Math.cos(angle - dir * ONESTEPANGLE);
    var dy = RADIUS * Math.sin(angle - dir * ONESTEPANGLE);
    angle -= dir * ONESTEPANGLE;
    leftX = rightX + dx;
    leftY = rightY + dy;
    penX = rightX + dx/2;
    penY = rightY + dy/2;
  }

  function stepOneRight(dir) {
    var dx = RADIUS * Math.cos(Math.PI + angle + dir * ONESTEPANGLE);
    var dy = RADIUS * Math.sin(Math.PI + angle + dir * ONESTEPANGLE);
    angle += dir * ONESTEPANGLE;
    rightX = leftX + dx;
    rightY = leftY + dy;
    penX = leftX + dx/2;
    penY = leftY + dy/2;
  }

  function penUp() {
    penState = false;
  }

  function penDown() {
    penState = true;
  }

  function showTrack() {
    trackState = true;
  }

  function polarToCartesian(centerX, centerY, radiusX, radiusY, angleInDegrees) {
    var angleInRadians = angleInDegrees * Math.PI / 180.0;
    var x = centerX + radiusX * Math.cos(angleInRadians);
    var y = centerY + radiusY * Math.sin(angleInRadians);
    return [x,y];
  }

  function arc(node) {
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
    var x = visit(node.elts[1], mathValueVisitor)
    var y = visit(node.elts[0], mathValueVisitor)
    return {
      "tag": "ellipse",
      "cx": x,
      "cy": y,
      "rx": 1/2,
      "ry": 1/2,
    }
  }

  function dot(node) {
    var x = visit(node.elts[1], mathValueVisitor);
    var y = visit(node.elts[0], mathValueVisitor);
    return {
      "tag": "ellipse",
      "cx": x,
      "cy": y,
      "rx": 3,
      "ry": 3,
    };
  }

  function path(node) {
    var elts = []
    var d = visit(node.elts[0])
    return {
      "tag": "path",
      "d": d
    }
  }

  function moveto(node) {
    var x = visit(node.elts[2])
    var y = visit(node.elts[1])
    var d = visit(node.elts[0])
    return "M "+x+" "+y+" "+d
  }

  function lineto(node) {
    var x = visit(node.elts[2])
    var y = visit(node.elts[1])
    var d = visit(node.elts[0])
    return "L "+x+" "+y+" "+d
  }

  function curveto(node) {
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
    return "Z"
  }

  function text(node) {
    var elts = []
    var str = ""+visit(node.elts[0])
    elts.push(str)
    return {
      "tag": "text",
      "elts": elts,
    }
  }

  function d3_this(node) {
    var str = d3Visitor["D3-THIS"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_dx(node) {
    var str = d3Visitor["D3-DX"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_dy(node) {
    var str = d3Visitor["D3-DY"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_text(node) {
    var str = d3Visitor["D3-TEXT"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_attr(node) {
    var str = d3Visitor["D3-ATTR"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_style(node) {
    var str = d3Visitor["D3-STYLE"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_function(node) {
    var str = d3Visitor["D3-FUNCTION"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_var(node) {
    var str = d3Visitor["D3-VAR"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_on(node) {
    var str = d3Visitor["D3-ON"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function d3_call(node) {
    var str = d3Visitor["D3-CALL"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function log(node) {
    var str = d3Visitor["PRINT"](node, d3Visitor);
    return {
      "tag": "script",
      "elts": [str],
    };
  }

  function math_text(node) {
    var str = visit(node.elts[0], mathTextVisitor);
    //var ast = Model.create(str);
    //var str = ast.toLaTeX(ast);
    return {
      "tag": "foreignObject",
      "width": canvasWidth,
      "height": canvasHeight,
      "elts": ["\$" + str + "\$"],
    };
  }

  function math_value(node) {
    return visit(node.elts[0], mathValueVisitor);
  }

  function fsize(node) {
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
    return node.elts[0]
  }

  function bool(node) {
    return node.elts[0]
  }

  function num(node) {
    return node.elts[0]
  }

  function str(node) {
    return node.elts[0]
  }

  function parens(node) {
    var v1 = visit(node.elts[0]);
    return "(" + v1 + ")";
  }

  function pi(node) {
    return "\\pi"
  }

  function cos(node) {
    var v1 = visit(node.elts[0]);
    return "\\cos" + v1;
  }

  function sin(node) {
    var v1 = visit(node.elts[0]);
    return "\\sin" + v1;
  }

  function atan(node) {
    var v1 = visit(node.elts[0]);
    return "\\atan" + v1;
  }

  function stub(node) {
    return ""
  }
}()
