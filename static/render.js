/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil -*- */
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
//        console.log(str)
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

//        var node = nodePool[nid]

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

/*
    function sanitize(s) {
        var r = "";
        var i = 0;
        var l = s.length;
        outer:
        while (i < l) {
            var start = i;
            while (i < l) {
                var c = s.charCodeAt(i);
                if (c < 32 ||
                    c == Char::BackSlash || 
//                    c == Char::SingleQuote || 
//                    c == Char::DoubleQuote ||
                    c == Char::UnicodePS ||
                    c == Char::UnicodeLS) {
                    r += s.substring(start, i);
                    r += uescape(c);
                    i++;
                    continue outer;
                }
                if (c == Char::Ampersand) {
                    r += s.substring(start, i);
                    r += "&amp;"
                    i++;
                    continue outer;
                }
                if (c == Char::LeftAngle) {
                    r += s.substring(start, i);
                    r += "&lt;"
                    i++;
                    continue outer;
                }
                i++;
            }
            r += s.substring(start, i);
        }
        return r
    }
*/
/*
    function path(list) {
        var p = [ ]
        for (var i = 0; i < list.length; i++) {
            if (list[i] === "M" || list[i] === "L") {
                p.push(list[i])
                //print("path() list[i+1]="+list[i+1])
                col = list[++i]
                ln = list[++i]
                var [x0, y0] = getOffsetPos(col, ln)
                p.push(x0)
                p.push(y0-yFactor*0.5)
            }
            else
            if (list[i] is String && list[i].charAt(0) === "N") {
                var [col, ln] = getStartCoords(list[i])
                var [x1, y1] = getOffsetPos(col, ln)
                p.push("C")
                var [cx0, cy0, cx1, cy1] = cubicControlPoints(x0, y0, x1, y1)
                p.push(cx0)
                p.push(cy0)
                p.push(cx1)
                p.push(cy1)
                p.push(x1)
                p.push(y1)
            }
            else {
                throw "unhandled path command: " + list[i]
            }
        }
        return p.join(" ")
    }

    function uescape(c) {
        return "\\u" + (c+0x10000).toString(16).substring(1);
    }

*/

}()

