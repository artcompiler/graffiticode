/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil -*- */
/* Copyright (c) 2012, Jeff Dyer */

var _ = require("underscore")

if (!this.GraffitiCode) {
    this.GraffitiCode = GraffitiCode = {}
    console.log("transform making GraffitiCode")
}

exports.transformer = GraffitiCode.transformer = function() {


    function print(str) {
        //console.log(str)
    }

    var table = {
        "Head" : head,
        "Fixture" : fixture,
        "ClassFixture" : stub,
        "MethodFixture" : methodFixture,
        "ValFixture" : valFixture,
        "VirtualValFixture" : stub,
        "ModuleFixture" : stub,
        "InitBinding" : initBinding,
        "ObjectPattern" : stub,
        "FieldPattern" : stub,
        "ArrayPattern" : stub,
        "SimplePattern" : stub,
        "IdentifierPattern" : stub,
        "Name" : name,
        "TernaryExpr" : stub,
        "BinaryExpr" : binaryExpr,
        "UnaryExpr" : unaryExpr,
        "ThisExpr" : thisExpr,
        "YieldExpr" : stub,
        "SuperExpr" : stub,
        "NewExpr" : newExpr,
        "ObjectRef" : objectRef,
        "ComputedName" : computedName,
        "SetExpr" : setExpr,
        "EvalScopeInitExpr" : stub,
        "ComprehendIf" : comprehendIf,
        "ComprehendFor" : comprehendFor,
        "InitExpr" : initExpr,
        "Identifier" : ident,
        "LiteralNull" : literalNull,
        "LiteralUndefined" : literalUndefined,
        "LiteralDouble" : stub,
        "LiteralInt" : literalInt,
        "LiteralUInt" : stub,
        "LiteralBoolean" : literalBoolean,
        "LiteralArray" : literalArray,
        "LiteralComprehension" : arrayComprehension,
        "LiteralObject" : literalObject,
        "LiteralField" : literalField,
        "VirtualField" : virtualField,
        "LiteralFunction" : literalFunction,
        "LiteralRegExp" : stub,
        "Cls" : stub,
        "Func" : func,
        "FuncName" : funcName,
        "FuncAttr" : stub,
        "Ctor" : stub,
        "ParamInit" : stub,
        "EmptyStmt" : stub,
        "ExprStmt" : exprStmt,
        "ReturnStmt" : returnStmt,
        "ThrowStmt" : throwStmt,
        "BreakStmt" : breakStmt,
        "ContinueStmt" : continueStmt,
        "ForStmt" : forStmt,
        "ForBindingStmt" : forBindingStmt,
        "ForInStmt" : stub,
        "ForInBindingStmt" : forInBindingStmt,
        "IfStmt" : ifStmt,
        "SwitchStmt" : stub,
        "DoWhileStmt" : doWhileStmt,
        "WhileStmt" : whileStmt,
        "BlockStmt" : blockStmt,
        "Block" : block,
        "Case" : stub,
        "WithStmt" : stub,
        "TryStmt" : stub,
        "Catch" : stub,
        "Module" : stub,
        "Import" : stub,
        "Export" : stub,
        "LetExpr" : letExpr,
        "TempName" : tempName,
        "GetTemp" : getTemp,
        "GetCogenTemp" : getCogenTemp,
        "GetParam" : getParam,
        "PROG" : program,
        "EXPRS" : exprs,
        "CALL" : callExpr,
        "IDENT" : ident,
        "NUM" : num,
        "STR" : str,
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

        "TEXT" : text,
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
    }
    
    var nodePool

    function transform(pool) {
        nodePool = pool
        return visit(pool.root)
    }

    function visit(nid) {

        var node = nodePool[nid]
        
        //print("visit() nid="+nid+" node="+JSON.stringify(node))

        if (node == null) {
            return null
        }

        if (node.tag === void 0) {
            return [ ]  // clean up stubs
        }
        else if (isFunction(table[node.tag])) {
            var ret = table[node.tag](node)
            //print("ret="+ret)
            return ret
        }
        else {
            throw "missing visitor method for " + node.tag                
        }

        throw "missing visitor method for " + node
    }

    function isArray(v) {
        return _.isArray(v)
    }

    function isObject(v) {
        return _isObjet(v)
    }

    function isString(v) {
        return _.isString(v)
    }

    function isPrimitive(v) {
        return _.isNull(v) || _.isString(v) || _.isNumber(v) || _.isBoolean(v)
    }

    function isFunction(v) {
        return _.isFunction(v)
    }



    // BEGIN VISITOR METHODS

    var edgesNode

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
        var elts = []
        var w = +visit(node.elts[3])
        var h = +visit(node.elts[2])
        var sw = +visit(node.elts[1])
        var sh = +visit(node.elts[0])

        for (var x = w; w > 0 && x < sw; x+=w) {
            elts.push({tag: "line", x1: x, y1: 0, x2: x, y2: sh})
        }

        for (var y = h; h > 0 && y < sh; y+=h) {
            elts.push({tag: "line", x1: 0, y1: y, x2: sw, y2: y})
        }
        
        var n = {
            "tag": "g",
            "elts": elts,
        }
        return n
    }

    function rectangle(node) {
        //print("rectangle")
        var elts = []
        var w = visit(node.elts[1])
        var h = visit(node.elts[0])

        return {
            "tag": "rect",
            "x": "0",
            "y": "0",
            "width": w,
            "height": h,
        }
    }

    function ellipse(node) {
        //print("ellipse")
        var elts = []
        var w = visit(node.elts[1])
        var h = visit(node.elts[0])

        return {
            "tag": "ellipse",
            "rx": w/2,
            "ry": h/2,
        }
    }

    function polarToCartesian(centerX, centerY, radiusX, radiusY, angleInDegrees) {
        var angleInRadians = angleInDegrees * Math.PI / 180.0;
        var x = centerX + radiusX * Math.cos(angleInRadians);
        var y = centerY + radiusY * Math.sin(angleInRadians);
        return [x,y];
    }

    function arc(node) {
        //print("arc")
        var elts = []
        var rx = visit(node.elts[3]) / 2
        var ry = visit(node.elts[2]) / 2
        var start = visit(node.elts[1])
        var stop = visit(node.elts[0])
        var p0 = polarToCartesian(0, 0, rx, ry, start)
        var p1 = polarToCartesian(0, 0, rx, ry, stop)
        var x0 = p0[0]
        var y0 = p0[1]
        var x1 = p1[0]
        var y1 = p1[1]
        var large = stop - start > 180 ? 1 : 0

        return {
            "tag": "path",
            "d": "M "+x0+" "+y0+" A "+rx+" "+ry+" 0 "+large+" 1 "+x1+" "+y1,
        }

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

    function num(node) {
        //print("num()")
        return node.elts[0]
    }

    function str(node) {
        //print("str()")
        return node.elts[0]
    }



    function exprStmt(node) {
        //print("exprStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.expr))
        ln += 1
        col = indent()
        return {
            "tag": "tspan",
            "class": "ExprStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function returnStmt(node) {
        //print("returnStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": (col += ("return ").length),
            "stopLn": ln,
            "elts": ["return"]
        })
        elts.push(visit(node.expr))
        return {
            "tag": "tspan",
            "class": "ReturnStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function throwStmt(node) {
        //print("throwStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": (col += "throw ".length),
            "stopLn": ln,
            "elts": ["throw"]
        })
        elts.push(visit(node.expr))
        ln += 1
        col = indent()
        return {
            "tag": "tspan",
            "class": "ThrowStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function continueStmt(node) {
        //print("continueStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["continue"]
        })
        if (node.ident) {
            col += "continue ".length
            elts.push(visit(node.ident))
        }
        ln++
        col = indent()
        return {
            "tag": "tspan",
            "class": "ContinueStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function breakStmt(node) {
        //print("breakStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["break"]
        })
        if (node.ident) {
            col += "break".length
            elts.push(visit(node.ident))
        }
        ln++
        col = indent()
        return {
            "tag": "tspan",
            "class": "BreakStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function letExpr(node) {
        //print("letExpr")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.head))
        ln += 1
        col = indent()
        elts.push(visit(node.expr))
        ln += 1
        col = indent()
        return {
            "tag": "tspan",
            "class": "LetExpr",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function blockStmt(node) {
        //print("blockStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["{"]
        })
        ln += 1
        col = indent(+1)
        elts.push(visit(node.block))
        col = indent(-1)
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["}"]
        })
        return {
            "tag": "tspan",
            "class": "BlockStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function block(node) {
        //print("block")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.head))
        elts.push(visit(node.stmts))
        return { 
            "tag": "tspan",
            "class": "Block",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function ifStmt(node) {
        //print("ifStmt")
        var startCol = col
        var startLn = ln
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["if"]
        })
        col += ("if ").length
        elts.push(visit(node.test))
        col++
        if (node.consequent.tag !== "BlockStmt") {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["{"]
            })
            ln++
            col = indent(+1)
        }
        elts.push(visit(node.consequent))
        if (node.consequent.tag !== "BlockStmt") {
            ln++
            col = indent(-1)
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["}"]
            })
        }
        ln++
        if (node.alternate && node.alternate.tag) {
            elts.push({
                "tag": "tspan",
                "class": "keyword",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["else"]
            })
            col += ("else ").length
            if (node.alternate.tag !== "BlockStmt") {
                col++
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": ["{"]
                })
                ln++
                col = indent(+1)
            }
            elts.push(visit(node.alternate))
            if (node.alternate.tag !== "BlockStmt") {
                ln++
                col = indent(-1)
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": ["}"]
                })
            }
            ln++
        }
        return {
            "tag": "tspan",
            "class": "IfStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function whileStmt(node) {
        //print("whileStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["while"]
        })
        col += ("while ").length
        elts.push(visit(node.expr))
        col++
        if (node.stmt.tag !== "BlockStmt") {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["{"]
            })
            ln++
            col = indent(+1)
        }
        elts.push(visit(node.stmt))
        if (node.stmt.tag !== "BlockStmt") {
            ln++
            col = indent(-1)
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["}"]
            })
        }
        ln += 1
        return {
            "tag": "tspan",
            "class": "WhileStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function doWhileStmt(node) {
        //print("doWhileStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["do"]
        })
        col += ("do ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["{"]
        })
        ln += 1
        col = indent(+1)
        elts.push(visit(node.stmt))
        ln += 1
        col = indent(-1)
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["}"]
        })
        ln += 1
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["while"]
        })
        col += ("while ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("(").length
        elts.push(visit(node.expr))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        ln += 1
        col = indent()
        return {
            "tag": "tspan",
            "class": "DoWhileStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function forStmt(node) {
        //print("forStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["for"]
        })
        col += ("for ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("(").length
        var tempCol = col
        elts.push(visit(node.init))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [";"]
        })
        col += ("; ").length
        ln++
        col = tempCol
        elts.push(visit(node.cond))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [";"]
        })
        col += ("; ").length
        ln++
        col = tempCol
        elts.push(visit(node.incr))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        col += ") ".length
        if (node.stmt.tag !== "BlockStmt") {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["{"]
            })
            ln++
            col = indent(+1)
        }
        elts.push(visit(node.stmt))
        if (node.stmt.tag !== "BlockStmt") {
            ln++
            col = indent(-1)
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["}"]
            })
        }
        ln += 1
        return {
            "tag": "tspan",
            "class": "ForStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function forBindingStmt(node) {
        //print("forBindingStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["for"]
        })
        col += ("for ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("(").length
        elts.push(visit(node.init))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [";"]
        })
        col += ("; ").length
        elts.push(visit(node.cond))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [";"]
        })
        col += ("; ").length
        elts.push(visit(node.incr))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        elts.push(visit(node.stmt))
        return {
            "tag": "tspan",
            "class": "ForBindingStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function setExpr(node) {
        //print("setExpr")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.le))
        col += 1
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["="]
        })
        col += ("= ").length
        elts.push(visit(node.re))
        if (node.write) {
            var dest = node.write[0]
            edgesNode.elts.push({
                "tag": "path",
                "class": "SetExpr",
                "id": node.id + dest,
                "d": [ "M", startCol, startLn, dest ]
            })
        }
        return { 
            "tag": "tspan",
            "class": "SetExpr",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function forInBindingStmt(node) {
        //print("forInBindingStmt")
        var startCol = col
        var startLn = ln
        var elts = [ ]

        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["for"]
        })
        col += ("for ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("(").length
        elts.push(visit(node.head))
        elts.push(visit(node.assignment.inits[0].name))   // FIXME hide details behind function abstraction
        col += 1
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["in"]
        })
        col += ("in ").length
        elts.push(visit(node.obj))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        ln += 1
        col = indent()
        elts.push(visit(node.stmt))
        ln += 1
        col = indent()
        ln += 1
        return { 
            "tag": "tspan",
            "class": "ForInBindingStmt",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function initExpr(node) {
        //print("initExpr")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        if (node.head.fixtures.length > 0) {
            elts.push(visit(node.head))
        }
        elts.push(visit(node.inits))
        return { 
            "tag": "tspan",
            "class": "InitExpr",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function initBinding(node) {
        //print("initBinding")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.name))
        col += 1
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["="]
        })
        col += ("= ").length
        elts.push(visit(node.expr))
        if (node.write) {
            var dest = node.write[0]
            edgesNode.elts.push({
                "tag": "path",
                "class": "InitBinding",
                "id": node.id + dest,
                "d": [ "M", startCol, startLn, dest ]
            })
        }
        return {
            "tag": "tspan",
            "class": "InitBinding",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function newExpr(node) {
        return callExpr(node, true)
    }

    function head(node) {
        //print("head")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.fixtures))
        elts.push(visit(node.exprs))
        return {
            "tag": "tspan",
            "class": "Head",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function fixture(node) {
        //print("fixture")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col += "var".length+1,
            "stopLn": ln,
            "elts": ["var"]
        })
        elts.push(visit(node.name))
        elts.push(visit(node.data))
        ln += 1
        col = indent()
        //elts.push(visit(node.data))
        return { 
            "tag": "tspan",
            "class": "Fixture",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function name(node) {
        //print("name")
        return identifier(node)  // identifier and name are synonyms
/*
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "ident",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [String(node.ident)]
        })
        col += (String(node.ident)).length
        return {
            "tag": "tspan",
            "class": "Name",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
*/
    }

    function tempName(node) {
        //print("tempName")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "ident",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["$t"+node.index]
        })
        col += ("$t"+node.index).length
        return {
            "tag": "tspan",
            "class": "TempName",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function getCogenTemp(node) {
        //print("getCogenTemp")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        return {
            "tag": "tspan",
            "class": "GetCogenTemp",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function getTemp(node) {
        //print("getTemp")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "ident",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["$t"+node.n]
        })
        col += ("$t"+node.n).length
        return {
            "tag": "tspan",
            "class": "GetTemp",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function getParam(node) {
        //print("getParam")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "ident",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [""+node.n]
        })
        col += (""+node.n).length
        return {
            "tag": "tspan",
            "class": "GetParam",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function literalFunction(node) {
        //print("literalFunction")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["function"]
        })
        col += ("function ").length
        elts.push(visit(node.func))
        return {
            "tag": "tspan",
            "class": "LiteralFunction",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function methodFixture(node) {
        //print("methodFixture")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.func))
        return {
            "tag": "tspan",
            "class": "MethodFixture",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function valFixture(node) {
        //print("valFixture")
        var elts = [ ]
        return {
            "tag": "tspan",
            "class": "ValFixture",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    var ln = 1
    var col = 1

    var level = 1
    const oneIndent = 4

    function indent(delta) {
        if (!delta) {
            delta = 0
        }
        level += oneIndent * delta
        return level
    }

    function func(node) {
        //print("func")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += "(".length
        if (node.params.fixtures.length==0) {
            // do nothing
            indent(+1)   // to make the -1 below work out
        }
        else
        if (node.params.fixtures.length==1) {
            elts.push(visit(node.params.fixtures[i].name))
            indent(+1)   // to make the -1 below work out
        }
        else {
            ln += 1
            col = indent(+1)
            for (var i = 0; i < node.params.fixtures.length; i++) {
                elts.push(visit(node.params.fixtures[i].name))
                if (i < node.params.fixtures.length-1) {
                    elts.push({
                        "tag": "tspan",
                        "class": "punc",
                        "startCol": col,
                        "startLn": ln,
                        "stopCol": col,
                        "stopLn": ln,
                        "elts": [","]
                    })
                    col = indent()
                    ln += 1
                }
            }
        }
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [") {"]
        })
        if (node.vars.fixtures.length || node.body.length) {
            ln += 1
            col = indent()
            if (node.vars.fixtures.length) {
                elts.push(visit(node.vars))
            }
            //elts.push(visit(node.attr))
            elts.push(visit(node.body))
        }
        ln += 1
        col = indent(-1)
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["}"]
        })
        col += 1
        return {
            "tag": "tspan",
            "class": "Func",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function funcName(node) {
        //print("funcName")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        switch (node.kind) {
        case 0:
            // nothing to do
            break
        default:
            throw "funcName kind not implemented"
            break
        }
        elts.push(visit(node.ident))
        var n = {
            "tag": "tspan",
            "class": "FuncName",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
        col += (node.ident + " ").length
        return n
    }

    function literalUndefined(node) {
        //print("literalUndefined")
        var n = {
            "tag": "tspan",
            "class": "LiteralUndefined",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["void 0"]
        }
        col += ("void 0").length
        return n        
    }

    function literalArray(node) {
        //print("literalArray")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        var tempCol = col
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["["]
        })
        for (var i = 0; i < node.exprs.length; i++) {
            col = tempCol + 1
            if (node.exprs[i].constructor !== Object || 
                node.exprs[i].tag !== "LiteralUndefined") {
                elts.push(visit(node.exprs[i]))
            }
            if (i < node.exprs.length-1) {
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": [","]
                })
                ln += 1
            }
        }
        if (node.spread) {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["..."]
            })
            col += ("...").length
            elts.push(visit(node.spread))
            if (node.exprs.length > 0) {
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": [","]
                })
                ln += 1
                col = tempCol
            }
            col = tempCol + 2
        }
        if (node.exprs.length != 0) {
            ln += 1
            col = tempCol
        }
        else {
            col = tempCol + 2
        }
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["]"]
        })
        col += ("]").length
        return {
            "tag": "tspan",
            "class": "LiteralArray",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function literalObject(node) {
        //print("literalObject")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        var tempCol = col
        if (node.fields.length > 0) {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["{"]
            })
            indent(+1)
            for (var i = 0; i < node.fields.length; i++) {
                ln += 1
                col = indent()
                elts.push(visit(node.fields[i]))
                if (i < node.fields.length - 1) {
                    elts.push({
                        "tag": "tspan",
                        "class": "punc",
                        "startCol": col,
                        "startLn": ln,
                        "stopCol": col,
                        "stopLn": ln,
                        "elts": [","]
                    })
                }
            }
            ln += 1
            col = indent(-1)
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["}"]
            })
            col += ("}").length
        }
        else {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["{ }"]
            })
            col += "{}".length
        }
        return {
            "tag": "tspan",
            "class": "LiteralObject",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function literalField(node) {
        //print("literalField")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col += "'".length,
            "stopLn": ln,
            "elts": ["'"]
        })
        elts.push(visit(node.ident))
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col += "'".length,
            "stopLn": ln,
            "elts": ["'"]
        })
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col += ": ".length,
            "stopLn": ln,
            "elts": [":"]
        })
        elts.push(visit(node.expr))
        return {
            "tag": "tspan",
            "class": "literalField",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function virtualField(node) {
        //print("virtualField")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [ node.kind===1 ? "get" : "set" ]
        })
        col += ("get ").length
        elts.push(visit(node.name))
        elts.push(visit(node.func.func))  // FIXME remove intermediate literalfunction
        return {
            "tag": "tspan",
            "class": "virtualField",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function computedName(node) {
        //print("computedName")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push(visit(node.expr))
        return {
            "tag": "tspan",
            "class": "ComputedName",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function arrayComprehension(node) {
        //print("arrayComprehension")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        var tempCol = col
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["["]
        })
        col = tempCol + 2
        elts.push(visit(node.expr))
        ln += 1
        col = tempCol + 2
        elts.push(visit(node.forList))
        if (node.ifCond) {
            col = tempCol + 2
            elts.push(visit(node.ifCond))
        }
        ln += 1
        col = tempCol
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["]"]
        })
        col += ("]").length
        return {
            "tag": "tspan",
            "class": "ArrayComprehension",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        }
    }

    function comprehendFor(node) {
        //print("comprehendFor")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["for"]
        })
        col += ("for ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("( ").length
        var tempCol = col
        elts.push(visit(node.head))
        col = tempCol
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["of"]
        })
        col += ("of ").length
        elts.push(visit(node.iterator))
        col += 1 // space after iterator
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        ln += 1
        col = tempCol - ("for ( ").length
        if (node.subclause) {
            elts.push(visit(node.subclause))
        }
        return {
            "tag": "tspan",
            "class": "comprehendFor",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function comprehendIf(node) {
        //print("comprehendIf")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        elts.push({
            "tag": "tspan",
            "class": "keyword",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["if"]
        })
        col += ("if ").length
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": ["("]
        })
        col += ("(").length + 1
        elts.push(visit(node.condition))
        col += 1
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [")"]
        })
        return {
            "tag": "tspan",
            "class": "comprehendIf",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
        ln += 1
    }

    function literalInt(node) {
        //print("literalInt")
        var n = {
            "tag": "tspan",
            "class": "LiteralInt",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [node.intValue]
        }
        col += (String(node.intValue)).length
        return n
    }

    function literalBoolean(node) {
        //print("literalBoolean")
        var n = {
            "tag": "tspan",
            "class": "LiteralBoolean",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [ node.booleanValue ]
        }
        col += (String(node.booleanValue)).length
        return n
    }

    function literalNull(node) {
        //print("literalNull")
        var n = {
            "tag": "tspan",
            "class": "LiteralNull",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [ "null" ]
        }
        col += ("this").length
        return n
    }

    function thisExpr(node) {
        //print("thisExpr")
        var n = {
            "tag": "tspan",
            "class": "ThisExpr",
            "id": node.id,
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [ "this" ]
        }
        col += ("this").length
        return n
    }

    function binaryOpText(op) {
        //print("binaryOpText() op="+op)
        switch (op) {
        case Ast.plusOp:
            return "+"
        case Ast.minusOp:
            return "-"
        case Ast.timesOp:
            return "*"
        case Ast.divideOp:
            return "/"
        case Ast.remainderOp:
            return "%"
        case Ast.leftShiftOp:
            return "<<"
        case Ast.rightShiftOp:
            return ">>"
        case Ast.rightShiftUnsignedOp:
            return ">>>"
        case Ast.bitwiseAndOp:
            return "&"
        case Ast.bitwiseOrOp:
            return "|"
        case Ast.bitwiseXorOp:
            return "^"
        case Ast.logicalAndOp:
            return "&&"
        case Ast.logicalOrOp:
            return "||"
        case Ast.instanceOfOp:
            return "instanceof"
        case Ast.inOp:
            return "in"
        case Ast.equalOp:
            return "=="
        case Ast.notEqualOp:
            return "!="
        case Ast.strictEqualOp:
            return "==="
        case Ast.strictNotEqualOp:
            return "!=="
        case Ast.lessOp:
            return "<"
        case Ast.lessOrEqualOp:
            return "<="
        case Ast.greaterOp:
            return ">"
        case Ast.greaterOrEqualOp:
            return ">="
        case Ast.commaOp:
            return ","
        }
        throw "unhandled binary op: " + op;
    }

    function binaryExpr(node) {
        //print("binaryExpr")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        var tempCol = col
        elts.push(visit(node.e1))
        if (node.op != Ast.commaOp) {
            col += 1
        }
        elts.push({
            "tag": "tspan",
            "class": "punc",
            "startCol": col,
            "startLn": ln,
            "stopCol": col,
            "stopLn": ln,
            "elts": [binaryOpText(node.op)]
        })
        if (node.op == Ast.logicalAndOp ||
            node.op == Ast.logicalOrOp ||
            node.op == Ast.commaOp) {
            ln += 1
            col = tempCol
        }
        else {
            col += binaryOpText(node.op).length + 1   // space after operator
        }
        elts.push(visit(node.e2))
        return {
            "tag": "tspan",
            "class": "binaryExpr",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function unaryOpText(op) {
        switch (op) {
        case Ast.devareOp:
            return "devare"
        case Ast.preIncrOp:
        case Ast.postIncrOp:
            return "++"
        case Ast.preDecrOp:
        case Ast.postDecrOp:
            return "--"
        case Ast.voidOp:
            return "void"
        case Ast.typeOfOp:
            return "typeof"
        case Ast.unaryPlusOp:
            return "+"
        case Ast.unaryMinusOp:
            return "-"
        case Ast.bitwiseNotOp:
            return "~"
        case Ast.logicalNotOp:
            return "!"
        case Ast.spreadOp:
            return "..."
        }
        throw "unhandled unary op: " + op;
    }

    function unaryExpr(node) {
        //print("unaryExpr")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        if (node.op == Ast.parenOp) {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["("]
            })
            col += "(".length
            elts.push(visit(node.e1))
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": [")"]
            })
            col += ")".length
        }
        else {
            if (node.op != Ast.postIncrOp &&
                node.op != Ast.postDecrOp) {
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": [unaryOpText(node.op)]
                })
                col += unaryOpText(node.op).length
                if (node.op == Ast.devareOp ||
                    node.op == Ast.voidOp ||
                    node.op == Ast.typeOfOp) {
                    col += 1   // space after operator
                }
            }
            elts.push(visit(node.e1))
            if (node.op == Ast.postIncrOp ||
                node.op == Ast.postDecrOp) {
                elts.push({
                    "tag": "tspan",
                    "class": "punc",
                    "startCol": col,
                    "startLn": ln,
                    "stopCol": col,
                    "stopLn": ln,
                    "elts": [unaryOpText(node.op)]
                })
                col += unaryOpText(node.op).length
            }
        }
        return {
            "tag": "tspan",
            "class": "unaryExpr",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
    }

    function objectRef(node) {
        //print("objectRef")
        var startCol = col
        var startLn = ln
        var elts = [ ]
        //var tempCol = col 
        elts.push(visit(node.base))
        //col = tempCol
        if (node.ident.tag==="ComputedName") {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["["]
            })
            col += "[".length
            elts.push(visit(node.ident))
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["]"]
            })
            col += "]".length
        }
        else {
            elts.push({
                "tag": "tspan",
                "class": "punc",
                "startCol": col,
                "startLn": ln,
                "stopCol": col,
                "stopLn": ln,
                "elts": ["."]
            })
            col += ".".length
            elts.push(visit(node.ident))
        }
        return {
            "tag": "tspan",
            "class": "objectRef",
            "id": node.id,
            "startCol": startCol,
            "startLn": startLn,
            "stopCol": col,
            "stopLn": ln,
            "elts": elts
        } 
     }

     function stub(node) {
        //print("stub: " + node.tag)
        return ""
     }
}()