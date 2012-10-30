/* -*- Mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */

/* copyright (c) 2012, Jeff Dyer */

console.log("GraffitiCode")

if (!GraffitiCode) {
    GraffitiCode = {}
}

function alert(str) {
    throw str
}

function print(str) {
//    console.log(str)
}

function log(str) {
//    console.log(str)
}

// ast module

(function () {

    var ASSERT = true

    var assert = function (val, str) {
        if ( !this.ASSERT ) {
            return;
        }
        if ( str === void 0 ) {
            str = "failed!";
        }
        if ( !val ) {
            alert("assert: " + str);
        }
    }
    
//    var nodePool = [ "unused" ];        // nodePool[0] is reserved
    
    // maps for fast lookup of nodes
//    var nodeMap = { }
    var Ast = function() { }
//    var nodeStack = []

    Ast.prototype = {
        intern: intern,
        node: node,
        dump: dump,
        dumpAll: dumpAll,
        poolToJSON: poolToJSON,
        number: number,
        string: string,
        name: name,
        callExpr: callExpr,
        binaryExpr: binaryExpr,
        letDefn: letDefn,
        matchExpr: matchExpr,
        matchClause: matchClause,
        exprs: exprs,
        program: program,
        pop: pop,
        reset: reset,
        topNode: topNode,
    }



    GraffitiCode.ast = new Ast;  

    // private implementation

    function reset(ctx) {
        ctx.state.nodePool = ["unused"]
        ctx.state.nodeStack = []
        ctx.state.nodeMap = {}
    }

    function push(ctx, node) {
        ctx.state.nodeStack.push(intern(ctx, node))
    }

    function topNode(ctx) {
        var nodeStack = ctx.state.nodeStack
        return nodeStack[nodeStack.length-1]
    }

    function pop(ctx) {
        var nodeStack = ctx.state.nodeStack
        log("nodeStack="+nodeStack)
        return nodeStack.pop()
    }

    function intern(ctx, n) {
        var nodeMap = ctx.state.nodeMap
        var nodePool = ctx.state.nodePool

        var tag = n.tag;
        var count = n.elts.length;
        var elts = "";
        var elts_nids = [ ];
        for (var i=0; i < count; i++) {
            elts += n.elts[i]
        }
        var key = tag+count+elts;
        var nid = nodeMap[key];
        if (nid === void 0) {
            nodePool.push({tag: tag, elts: n.elts})
            nid = nodePool.length - 1
            nodeMap[key] = nid
        }
        print("intern() key="+key+" nid="+nid)
        print("intern() pool="+dumpAll(ctx))
            return nid
    }

    function node(ctx, nid) {
        //print("node() nid="+nid)
        //print("node() pool="+dumpAll(ctx))
        var n = ctx.state.nodePool[nid]
        if (!n) {
            return {}
        }
        // if literal, then unwrap.
        switch (n.tag) {
        case "NUM":
        case "STR":
        case "IDENT":
            n = n.elts[0];
            break;
        default:
            for (var i=0; i < n.elts.length; i++) {
                n.elts[i] = node(ctx, n.elts[i]);
            }
            break;
        }
        return n;
    }

    function dumpAll(ctx) {
        var nodePool = ctx.state.nodePool
        var s = "\n{"
        for (var i=1; i < nodePool.length; i++) {
            var n = nodePool[i];
            s = s + "\n    " + i+": "+dump(n) + ","
        }
        s += "\n    root: " + (nodePool.length-1)
        s += "\n}\n"
        
//        for (var i=0; i < nodeStack.length; i++) {
//            var n = nodeStack[i];
//            s = s + "\n" + i+": "+dump(n)
//        }
        return s
    }
    
    
    function poolToJSON(ctx) {
        var nodePool = ctx.state.nodePool
        var obj = { }
        for (var i=1; i < nodePool.length; i++) {
            var n = nodePool[i];
            obj[i] = nodeToJSON(n)
        }
        obj["root"] = (nodePool.length-1)
        
//        for (var i=0; i < nodeStack.length; i++) {
//            var n = nodeStack[i];
//            s = s + "\n" + i+": "+dump(n)
//        }
        return obj
    }
    
    function nodeToJSON(n) {

        if (typeof n === "object") {
            switch (n.tag) {
            case "num":
                var obj = n.elts[0];
                break;
            case "str":
                var obj = n.elts[0];
                break;
            default:
                var obj = {}
                obj["tag"] = n.tag
                obj["elts"] = []
                for (var i=0; i < n.elts.length; i++) {
                    obj["elts"][i] = nodeToJSON(n.elts[i]);
                }
                break;
            }
        }
        else if (typeof n === "string") {
            var obj = n;
        }
        else {
            var obj = n;
        }
        return obj
    }

    function dump(n) {
        
        if (typeof n === "object") {
            switch (n.tag) {
            case "num":
                var s = n.elts[0];
                break;
            case "str":
                var s = "\""+n.elts[0]+"\"";
                break;
            default:
                var s = "{ tag: \"" + n.tag + "\", elts: [ ";
                for (var i=0; i < n.elts.length; i++) {
                    if (i > 0) {
                        s += " , ";
                    }
                    s += dump(n.elts[i]);
                }
                s += " ] }";
                break;
            }
        }
        else if (typeof n === "string") {
            var s = "\""+n+"\"";
        }
        else {
            var s = n;
        }
        return s;
    }

    function number(ctx, str) {
        push(ctx, {tag: "NUM", elts: [str]})
    }

    function string(ctx, str) {
        push(ctx, {tag: "STR", elts: [str]})
    }

    function name(ctx, str) {
        push(ctx, {tag: "IDENT", elts: [str]})
    }

    function callExpr(ctx, argc) {
        log("ast.callExpr() argc="+argc)
        var elts = []
        while (argc > 0) {
            elts.push(pop(ctx))
            argc--
        }
        var name = node(ctx, pop(ctx))
        print("callExpr() name="+name+" elts="+elts)
        var def = GraffitiCode.findWord(ctx, name)
        push(ctx, {tag: def.name, elts: elts})
    }

    function binaryExpr(ctx, op) {
        push(ctx, {tag: op, elts: [pop(ctx), pop(ctx)]})
    }

    function matchExpr(ctx, n) {
        log("ast.matchExpr() n="+n)
        var elts = []
        for (var i = n; i > 0; i--) {
            elts.push(pop(ctx))
        }
        elts.push(pop(ctx))   // expr
        push(ctx, {tag: "MATCH", elts: elts})
    }

    function matchClause(ctx) {
        log("ast.matchClause()")
        var elts = []
        elts.push(pop(ctx))
        elts.push(pop(ctx))
        push(ctx, {tag: "RULE", elts: elts})
    }

    function exprs(ctx, n) {
        log("ast.exprs() n="+n)
        var elts = []
        for (var i = n; i > 0; i--) {
            elts.push(pop(ctx))
        }
        push(ctx, {tag: "EXPRS", elts: elts})
    }

    function letDefn(ctx) {
        push(ctx, {tag: "LET", elts: [pop(ctx), pop(ctx)]})
    }

    function program(ctx) {
        var elts = []
        elts.push(pop(ctx))
        push(ctx, {tag: "PROG", elts: elts})
    }

})();

(function () {
    
    // The character stream used by a mode's parser.
    function StringStream(string, tabSize) {
        this.pos = this.start = 0;
        this.string = string;
        this.tabSize = tabSize || 8;
    }
    
    StringStream.prototype = {
        eol: function() {return this.pos >= this.string.length;},
        sol: function() {return this.pos == 0;},
        peek: function() {return this.string.charAt(this.pos) || undefined;},
        next: function() {
            if (this.pos < this.string.length)
                return this.string.charAt(this.pos++);
        },
        eat: function(match) {
            var ch = this.string.charAt(this.pos);
            if (typeof match == "string") var ok = ch == match;
            else var ok = ch && (match.test ? match.test(ch) : match(ch));
            if (ok) {++this.pos; return ch;}
        },
        eatWhile: function(match) {
            var start = this.pos;
            while (this.eat(match)){}
            return this.pos > start;
        },
        eatSpace: function() {
            var start = this.pos;
            while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
            return this.pos > start;
        },
        skipToEnd: function() {this.pos = this.string.length;},
        skipTo: function(ch) {
            var found = this.string.indexOf(ch, this.pos);
            if (found > -1) {this.pos = found; return true;}
        },
        backUp: function(n) {this.pos -= n;},
        column: function() {return countColumn(this.string, this.start, this.tabSize);},
        indentation: function() {return countColumn(this.string, null, this.tabSize);},
        match: function(pattern, consume, caseInsensitive) {
            if (typeof pattern == "string") {
                var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
                if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
                    if (consume !== false) this.pos += pattern.length;
                    return true;
                }
            } else {
                var match = this.string.slice(this.pos).match(pattern);
                if (match && match.index > 0) return null;
                if (match && consume !== false) this.pos += match[0].length;
                return match;
            }
        },
        current: function(){return this.string.slice(this.start, this.pos);}
    }

    GraffitiCode.StringStream = StringStream
})();

(function () {
    
    var ast = GraffitiCode.ast
    
    function assert(b, str) {
        if (!b) {
            alert(str)
        }
    }

    var TK_IDENT  = 0x01
    var TK_NUM    = 0x02
    var TK_EQUAL  = 0x04
    var TK_IF     = 0x05
    var TK_THEN   = 0x06
    var TK_ELSE   = 0x07
    var TK_RETURN = 0x08
    var TK_IS     = 0x09
    var TK_POSTOP = 0x0A
    var TK_PREOP  = 0x0B
    var TK_FUN    = 0x0C
    var TK_VAL    = 0x0D
    var TK_BINOP  = 0x0E
    var TK_MATCH  = 0x0F
    var TK_WITH   = 0x10
    var TK_END    = 0x11
    var TK_LET    = 0x12
    var TK_OR     = 0x13

    var TK_LEFTPAREN    = 0xA1
    var TK_RIGHTPAREN   = 0xA2
    var TK_LEFTBRACKET  = 0xA3
    var TK_RIGHTBRACKET = 0xA4
    var TK_LEFTBRACE    = 0xA5
    var TK_RIGHTBRACE   = 0xA6
    var TK_PLUS         = 0xA7
    var TK_MINUS        = 0xA8
    var TK_DOT          = 0xA9
    var TK_COLON        = 0xAA

    var globalLexicon = GraffitiCode.globalLexicon = {
        "let" : { tk: TK_LET, cls: "keyword" },
        "if" : { tk: TK_IF, cls: "keyword" },
        "then" : { tk: TK_THEN, cls: "keyword" },
        "else" : { tk: TK_ELSE, cls: "keyword" },
        "match" : { tk: TK_MATCH, cls: "keyword" },
        "with" : { tk: TK_WITH, cls: "keyword", length: 0 },
        "end" : { tk: TK_END, cls: "keyword", length: 0 },
        "or" : { tk: TK_OR, cls: "keyword", length: 0 },
        "is" : { tk: TK_IS, cls: "operator", length: 1 },
        "equal" : { tk: TK_IDENT, cls: "operator", length: 0 },

        "zero" : { tk: TK_NUM, cls: "number", length: 0 },
        "one" : { tk: TK_NUM, cls: "number", length: 0 },
        "two" : { tk: TK_NUM, cls: "number", length: 0 },
        "three" : { tk: TK_NUM, cls: "number", length: 0 },
        "four" : { tk: TK_NUM, cls: "number", length: 0 },
        "five" : { tk: TK_NUM, cls: "number", length: 0 },
        "six" : { tk: TK_NUM, cls: "number", length: 0 },
        "seven" : { tk: TK_NUM, cls: "number", length: 0 },
        "eight" : { tk: TK_NUM, cls: "number", length: 0 },
        "nine" : { tk: TK_NUM, cls: "number", length: 0 },
        "ten" : { tk: TK_NUM, cls: "method", length: 0 },
        "eleven" : { tk: TK_NUM, cls: "method", length: 0 },
        "twelve" : { tk: TK_NUM, cls: "method", length: 0 },
        "thirteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "fourteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "fifteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "sixteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "seventeen" : { tk: TK_NUM, cls: "method", length: 0 },
        "eighteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "nineteen" : { tk: TK_NUM, cls: "method", length: 0 },
        "twenty" : { tk: TK_NUM, cls: "method", length: 0 },
        "thirty" : { tk: TK_NUM, cls: "method", length: 0 },
        "forty" : { tk: TK_NUM, cls: "method", length: 0 },
        "fifty" : { tk: TK_NUM, cls: "method", length: 0 },
        "sixty" : { tk: TK_NUM, cls: "method", length: 0 },
        "seventy" : { tk: TK_NUM, cls: "method", length: 0 },
        "eighty" : { tk: TK_NUM, cls: "method", length: 0 },
        "ninety" : { tk: TK_NUM, cls: "method", length: 0 },

        "print" : { tk: TK_IDENT, cls: "method", length: 1 },

        // triangle
        "size" : { tk: TK_IDENT, cls: "method", length: 2 },
        "background" : { tk: TK_IDENT, cls: "method", length: 1 },
        "tri" : { tk: TK_IDENT, name: "TRI", cls: "method", length: 6 },
        "triangle" : { tk: TK_IDENT, name: "TRI", cls: "method", length: 6 },
        "draw" : { tk: TK_IDENT, cls: "method", length: 5 },
        "fill" : { tk: TK_IDENT, cls: "method", length: 1 },
        "stroke" : { tk: TK_IDENT, cls: "method", length: 1 },
        "color" : { tk: TK_IDENT, cls: "method", length: 3 },        
        "noLoop" : { tk: TK_IDENT, cls: "method", length: 0 },
        "deg" : { tk: TK_POSTOP, cls: "operator", length: 0 },

        // bitzee
        "start" : { tk: TK_IDENT, cls: "handler", length: 0 },
        "remote" : { tk: TK_IDENT, cls: "handler", length: 1 },
        "forward" : { tk: TK_IDENT, cls: "method", length: 1 },
        "backward" : { tk: TK_IDENT, cls: "method", length: 1 },
        "stop" : { tk: TK_IDENT, cls: "method", length: 1 },
        "spin" : { tk: TK_IDENT, cls: "method", length: 1 },
        "play" : { tk: TK_NUM, cls: "number", length: 0 },
        "slow" : { tk: TK_NUM, cls: "number", length: 0 },
        "seconds" : { tk: TK_POSTOP, cls: "operator", length: 0 },
        "ms" : { tk: TK_POSTOP, cls: "operator", length: 0 },
        "not" : { tk: TK_PREOP, cls: "operator", length: 0 },
        "minus" : { tk: TK_BINOP, cls: "operator", length: 0 },
        "blink" : { tk: TK_IDENT, cls: "method", length: 4 },
        "left" : { tk: TK_IDENT, cls: "val", length: 0 },
        "right" : { tk: TK_IDENT, cls: "val", length: 0 },
        "speed" : { tk: TK_IDENT, cls: "method", length: 1 },
        "full" : { tk: TK_IDENT, cls: "val", length: 0 },
        "half" : { tk: TK_IDENT, cls: "val", length: 0 },
        "none" : { tk: TK_IDENT, cls: "val", length: 0 },
        "high" : { tk: TK_IDENT, cls: "val", length: 0 },
        "low" : { tk: TK_IDENT, cls: "val", length: 0 },
        "on" : { tk: TK_IDENT, cls: "val", length: 0 },
        "off" : { tk: TK_IDENT, cls: "val", length: 0 },
        "delay" : { tk: TK_IDENT, cls: "method", length: 1 },
        "random" : { tk: TK_IDENT, cls: "method", length: 2 },

        // popcorn

        "popcorn" : { tk: TK_IDENT, cls: "method", length: 1 },
        "footnote" : { tk: TK_IDENT, cls: "method", length: 1 },
        "struct" : {tk: TK_IDENT, cls: "method", length: 3 },

    }

    function findWord(ctx, lexeme) {
        var env = ctx.state.env
        print("findWord() lexeme=" + lexeme)
        for (var i = env.length-1; i >= 0; i--) {
            var word = env[i].lexicon[lexeme]
            if (word) {
                return word
            }
        }
        return null
    }

    GraffitiCode.findWord = findWord

    function addWord(ctx, lexeme, entry) {
        print("addWord() lexeme=" + lexeme)
        topEnv(ctx).lexicon[lexeme] = entry
        return null
    }

    function enterEnv(ctx, name) {
        ctx.state.env.push({name: name, lexicon: []})
    }

    function exitEnv(ctx) {
        ctx.state.env.pop()
    }


    function eat(ctx, tk) {
        log("eat() tk="+tk)
        if (next(ctx) !== tk) {
            throw "syntax error"
        }
    }
    
    function match(ctx, tk) {
        if (peek(ctx) === tk) {
            return true
        }
        else {
//            ctx.scan.stream.backUp(lexeme.length)
            return false
        }
    }

    function next(ctx) {
        var tk = ctx.scan.start()
        log("next() tk="+tk+" lexeme="+lexeme)
        return tk
    }

    function peek(ctx) {
        var tk = ctx.scan.start()
        //log("peek() tk="+tk+" lexeme="+lexeme)
        if (tk) {
            ctx.scan.stream.backUp(lexeme.length)
        }
        return tk
    }

    // Parsing functions

    function number(ctx, cc) {
        log("number()")
        eat(ctx, TK_NUM)
        cc.cls = "number"
        ast.number(ctx, lexeme)
        return cc
    }

    function ident(ctx, cc) {
        log("ident()")
        eat(ctx, TK_IDENT)
        ast.name(ctx, lexeme)
        cc.cls = "ident"
        return cc
    }

    function name(ctx, cc) {
        log("name()")
        eat(ctx, TK_IDENT)
        ast.name(ctx, lexeme)
        var word = findWord(ctx, lexeme)
        if (word) {
            cc.cls = word.cls
        }
        else {
            cc.cls = "comment"
        }
        assert(cc, "name")
        return cc
    }

    function map(ctx, cc) {
        log("map()")
        eat(ctx, TK_LEFTBRACE)
        log("found left brace")
        var ret = function(ctx) {
            return bindings(ctx, function (ctx) {
                eat(ctx, TK_RIGHTBRACE)
                cc.cls = "punc"
                return cc
            })
        }
        ret.cls = "punc"
        return ret
    }

    function binding(ctx, cc) {
        log("binding()")
        return ident(ctx, function(ctx) {
            eat(ctx, TK_EQUAL)
            var ret = function(ctx) {
                return expr(ctx, cc)
            }
            ret.cls = "punc"
            return ret
        })
    }

    function bindings(ctx, cc) {
        log("bindings()")
        if (match(ctx, TK_RIGHTBRACE)) {
            return cc
        }
        return binding(ctx, function (ctx) {
            if (match(ctx, TK_DOT)) {
                eat(ctx, TK_DOT)
                var ret = function (ctx) {
                    return bindings(ctx, cc)
                }
                ret.cls = "punc"
                return ret
            }
            return cc
        })
    }

    function tuple(ctx, cc) {
        log("tuple()")
        eat(ctx, TK_LEFTPAREN)
        log("found left paren")
        var ret = function(ctx) {
            return exprsStart(ctx, function (ctx) {
                eat(ctx, TK_RIGHTPAREN)
                cc.cls = "punc"
                return cc
            })
        }
        ret.cls = "punc"
        return ret
    }

    function list(ctx, cc) {
        log("list()")
        eat(ctx, TK_LEFTBRACKET)
        var ret = function(ctx) {
            return exprsStart(ctx, function (ctx) {
                eat(ctx, TK_RIGHTBRACKET)
                cc.cls = "punc"
                return cc
            })
        }
        ret.cls = "punc"
        return ret
    }

    function primaryExpr(ctx, cc) {
        log("primaryExpr()")
        if (match(ctx, TK_NUM)) {
            return number(ctx, cc)
        }
        else if (match(ctx, TK_LEFTBRACE)) {
            var ret = map(ctx, cc)
            log("map() ret=" + ret)
            return ret
        }
        else if (match(ctx, TK_LEFTPAREN)) {
            return tuple(ctx, cc)
        }
        else if (match(ctx, TK_LEFTBRACKET)) {
            return list(ctx, cc)
        }
        return name(ctx, cc)
    }

    function callExpr(ctx, cc) {
        log("callExpr()")
        var ret = primaryExpr(ctx, function (ctx) {
            log("found primaryExpr topNode="+ast.node(ctx, ast.topNode(ctx)))
            var name = ast.node(ctx, ast.topNode(ctx))
            var tk = findWord(ctx, name)
            if (tk && tk.cls === "method") {
                startArgs(ctx, tk.length)
                return args(ctx, cc)
            }
            return cc
        })
        log("primaryExpr() ret="+ret)
        return ret
    }

    function startArgs(ctx, len) {
        ctx.state.argcStack.push(ctx.state.argc)
        ctx.state.length = ctx.state.argc = len
    }

    function finishArgs(ctx) {
        ctx.state.argc = ctx.state.argcStack.pop()
    }
 
    function arg(ctx, cc) {
        log("arg()")
        ctx.state.argc--
        return expr(ctx, cc)
    }

    function args(ctx, cc) {
        log("args()")
        if (ctx.state.argc === 0) {
            finishArgs(ctx)
            ast.callExpr(ctx, ctx.state.length)
            return cc
        }
        return arg(ctx, function (ctx) {
            return args(ctx, cc)
        })
    }

    function postfixExpr(ctx, cc) {
        log("postfixExpr()")
        return callExpr(ctx, function (ctx) {
            log("found callExpr")
            if (match(ctx, TK_POSTOP)) {
                eat(ctx, TK_POSTOP)
                cc.cls = "operator"
                ast.postfixExpr(ctx, lexeme)
            }
            return cc
        })
    }
    
    function prefixExpr(ctx, cc) {
        log("prefixExpr()")
        return postfixExpr(ctx, cc)
    }
    
    function binaryExpr(ctx, cc) {
        log("binaryExpr()")
        var ret = prefixExpr(ctx, function (ctx) {
            if (match(ctx, TK_BINOP)) {
                var word = eat(ctx, TK_BINOP)
                var ret = function (ctx) {
                    var ret = binaryExpr(ctx, cc)
                    ast.binaryExpr(ctx, word)
                    return ret
                }
                ret.cls = "operator"
                return ret
            }
            return cc
        })
        log("prefixExpr() ret="+ret)
        return ret
    }
    
    function isExpr(ctx, cc) {
        log("isExpr()")
        var ret = binaryExpr(ctx, function (ctx) {
            if (match(ctx, TK_IS)) {
                eat(ctx, TK_IS)
                var tk = findWord(ctx, lexeme)
                if (tk && tk.cls === "operator") {
                    startArgs(ctx, tk.length)
                    if (ctx.state.argc === 0) {
                        finishArgs(ctx)
                        return cc
                    }
                    return arg(ctx, function (ctx) {
                        return args(ctx, function (ctx) {
                            return isExpr(ctx, cc)
                        })
                    })
                }
            }
            return cc
        })
        log("binaryExpr() ret="+ret)
        return ret
    }

    function virtualDot(ctx) {
        if (match(ctx, TK_DOT)) {
            eat(ctx, TK_DOT)
        }
    }
    
    function condExpr(ctx, cc) {
        log("condExpr()")
        if (match(ctx, TK_IF)) {
            return ifExpr(ctx, cc)
        }
        else if (match(ctx, TK_MATCH)) {
            return matchExpr(ctx, cc)
        }
        var ret = isExpr(ctx, cc)
        log("isExpr() ret="+ret)
        return ret
    }

    function ifExpr(ctx, cc) {
        eat(ctx, TK_IF)
        var ret = function (ctx) {
            return exprsStart(ctx, function (ctx) {
                return thenClause(ctx, cc)
            })
        }
        ret.cls = "keyword"
        return ret
    }

    function matchExpr(ctx, cc) {
        eat(ctx, TK_MATCH)
        var ret = function (ctx) {
            return expr(ctx, function (ctx) {
                eat(ctx, TK_WITH)
                var ret = function (ctx) {        
                    startCounter(ctx)
                    return matchesClause(ctx, function (ctx) {
                        ast.matchExpr(ctx, ctx.state.exprc)
                        stopCounter(ctx)
                        return cc
                    })
                }
                ret.cls = "keyword"
                return ret
            })
        }
        ret.cls = "keyword"
        return ret
    }


    function matchesClause(ctx, cc) {
        log("matchesClause()")
        return matchClause(ctx, function (ctx) {
            countCounter(ctx)
            if (match(ctx, TK_OR)) {
                eat(ctx, TK_OR)
                var ret = function (ctx) {
                    return matchesClause(ctx, cc)
                }
                ret.cls = "keyword"
                return ret
            }
            return cc
        })
    }

    function matchClause (ctx, cc) {
        return pattern(ctx, function (ctx) {
            eat(ctx, TK_EQUAL)
            return exprsStart(ctx, function(ctx) {
                ast.matchClause(ctx)
                return cc
            })
        })
    }

    function pattern(ctx, cc) {
        // FIXME only matches number literals for now
        return number(ctx, cc)
    }

    function thenClause(ctx, cc) {
        log("thenClause()")
        eat(ctx, TK_THEN)
        var ret = function (ctx) {
            return exprsStart(ctx, function (ctx) {
                if (match(ctx, TK_ELSE)) {
                    return elseClause(ctx, cc)
                }
                else {
                    return cc
                }
            })
        }
        ret.cls = "keyword"
        return ret
    }

    function elseClause(ctx, cc) {
        log("elseClause()")
        eat(ctx, TK_ELSE)
        var ret = function (ctx) {
            return exprsStart(ctx, cc)
        }
        ret.cls = "keyword"
        return ret
    }

    function expr(ctx, cc) {
        log("expr()")
        if (match(ctx, TK_LET)) {
            var ret = def(ctx, cc)
            log("def() ret="+ret)
            return ret
        }
        var ret = condExpr(ctx, cc)
        log("condExpr() ret="+ret)
        return ret
    }

    function emptyInput(ctx) {
        return peek(ctx) === 0
    }

    function emptyExpr(ctx) {
        return emptyInput(ctx) 
            || match(ctx, TK_THEN) 
            || match(ctx, TK_ELSE)
            || match(ctx, TK_OR)
            || match(ctx, TK_DOT)
    }

    function countCounter(ctx) {
        print("* * * * countCounter() exprc="+(ctx.state.exprc+1))
        ctx.state.exprc++
    }

    function startCounter(ctx) {
        log("* * * * startCounter()")
        ctx.state.exprcStack.push(ctx.state.exprc)
        ctx.state.exprc = 0
    }

    function stopCounter(ctx) {
        log("* * * * stopCounter() exprc="+ctx.state.exprc)
        ctx.state.exprc = ctx.state.exprcStack.pop()
    }

    function exprsStart(ctx, cc) {
        log("exprsStart()")
        startCounter(ctx)
        return exprs(ctx, cc)
    }

    function exprsFinish(ctx, cc) {
        log("exprsFinish()")
        ast.exprs(ctx, ctx.state.exprc)
        stopCounter(ctx)
        return cc
    }

    function exprs(ctx, cc) {
        log("exprs()")
//        if (emptyInput(ctx)) {
//            return exprsFinish(ctx, cc)
//        }
        if (match(ctx, TK_DOT)) {   // second dot
            eat(ctx, TK_DOT)
            return exprsFinish(ctx, cc)
        }

        var ret = expr(ctx, function (ctx) {
            countCounter(ctx)
            if (match(ctx, TK_DOT)) {
                eat(ctx, TK_DOT)
                var ret = function (ctx) {
                    if (emptyInput(ctx) || emptyExpr(ctx)) {
                        return exprsFinish(ctx, cc)
                    }
                    return exprs(ctx, cc)
                }
                ret.cls = "punc"
                return ret
            }
            return exprsFinish(ctx, cc)
        })
        log("expr() ret="+ret)
        return ret
    }

    function program(ctx, cc) {
        log("program()")
//        ast.reset(ctx)
        return exprsStart(ctx, function (ctx) {
//            while (match(ctx, TK_DOT)) {   // consume extra dots at end of program
//                eat(ctx, TK_DOT)
//            }
            ast.program(ctx)
            return cc
        })
    }

    GraffitiCode.program = program

    function defs(ctx, cc) {
        log("defs()")
        return def(ctx, function (ctx) {
            if (!emptyInput(ctx)) {
                return defs(ctx, cc)
            }
            return cc
        })
    }

    function def(ctx, cc) {
        log("def()")
        if (match(ctx, TK_LET)) {
            eat(ctx, TK_LET)
            var ret = function (ctx) {
                var ret = name(ctx, function (ctx) {
                    var name = ast.node(ctx, ast.topNode(ctx))
                    addWord(ctx, name, { tk: TK_IDENT, cls: "method", length: 0 })
                    ctx.state.argc = 0
                    enterEnv(ctx, name)
                    return params(ctx, function (ctx) {
                        findWord(ctx, topEnv(ctx).name).length = ctx.state.argc
                        eat(ctx, TK_EQUAL)
                        var ret = function(ctx) {
                            return exprsStart(ctx, function (ctx) {
                                exitEnv(ctx)
                                ast.letDefn(ctx)
                                return cc
                            })
                        }
                        ret.cls = "punc"
                        return ret
                    })
                })
                ret.cls = "handler"
                return ret
            }
            ret.cls = "keyword"
            return ret
        }
        return name(ctx, cc)
    }

    function params(ctx, cc) {
        log("params()")
        if (match(ctx, TK_EQUAL)) {
            return cc
        }
        return function (ctx) {
            var ret = primaryExpr(ctx, function (ctx) {
                ctx.state.argc++
                addWord(ctx, lexeme, { tk: TK_IDENT, cls: "val" })
                return params(ctx, cc)
            })
            ret.cls = "ident"
            return ret
        }
    }

    function param(ctx, cc) {
        log("param()")
        return primaryExpr(ctx, function (ctx) {
            return cc
        })
    }

    // Drive the parser

    function topEnv(ctx) {
        return ctx.state.env[ctx.state.env.length-1]
    }

    function parse(stream, state) {
        var ctx = {scan: scanner(stream), state: state}
        var cls
        try {
            // call the continuation and store the next continuation
            //log(">>parse() cc="+state.cc+"\n")
            if (state.cc === null) {
                next(ctx)
                return "comment"
            }
            var cc = state.cc = state.cc(ctx, null)
            if (cc) {
                cls = cc.cls
            }

            GraffitiCode.ui.updateAST(ast.dumpAll(ctx))
            GraffitiCode.ui.compileCode(ast.poolToJSON(ctx))
            
//            if (cc && emptyInput(ctx)) {
//                while((cc=cc(ctx, null))) ;
//            }

            print("---------")
            log("parse() pos="+stream.pos)
            log("parse() lexeme="+lexeme)
            log("parse() cls="+cls)
            print("parse() cc="+cc+"\n")
            print("parse() nodePool="+ast.dumpAll(ctx)+"\n")

        }
        catch (x) {
            log("---------")
            log("exception caught!!!=")
            if (x === "syntax error") {
                cls = "comment"
                state.cc = null
            }
            else {
                alert(x)
                throw x
                next(ctx)
                cls = "comment"
                
            }
        }

        return cls
    }

    GraffitiCode.parse = parse

    console.log("parse="+GraffitiCode.parse)

    var lexeme = ""

    function scanner(stream) {

        var lexemeToToken = [ ]

        return {
            start: start ,
            stream: stream,
            lexeme: function () {
                return lexeme
            }
         }

        // begin private functions

        function start () {
            var c;
            lexeme = "";
            while (stream.peek() !== void 0) {
                switch ((c = stream.next().charCodeAt(0))) {
                case 32:  // space
                case 9:   // tab
                case 10:  // new line
                case 13:  // carriage return
                    c = ' '
                    continue
                case 45:  // dash
                    lexeme += String.fromCharCode(c);
                    return TK_MINUS
                case 46:  // dot
                    lexeme += String.fromCharCode(c);
                    return TK_DOT
                case 58:  // colon
                    lexeme += String.fromCharCode(c);
                    return TK_COLON
                case 61:  // equal
                    lexeme += String.fromCharCode(c);
                    return TK_EQUAL
                case 92:  // backslash
                    lexeme += String.fromCharCode(c);
                    return latex();
                case 40:  // left paren
                    lexeme += String.fromCharCode(c);
                    return TK_LEFTPAREN
                case 41:  // right paren
                    lexeme += String.fromCharCode(c);
                    return TK_RIGHTPAREN
                case 43:  // plus
                    lexeme += String.fromCharCode(c);
                    return TK_PLUS
                case 91:  // left bracket
                    lexeme += String.fromCharCode(c);
                    return TK_LEFTBRACKET
                case 93:  // right bracket
                    lexeme += String.fromCharCode(c);
                    return TK_RIGHTBRACKET
                case 123: // left brace
                    lexeme += String.fromCharCode(c);
                    return TK_LEFTBRACE
                case 125: // right brace
                    lexeme += String.fromCharCode(c);
                    return TK_RIGHTBRACE
                    
                case 94:  // caret
                case 44:  // comma
                case 47:  // slash
                case 42:  // asterisk
                    lexeme += String.fromCharCode(c);
                    return c; // char code is the token id
                default:
                    if ((c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) ||
                        (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0))) {
                        return ident(c);
                    }
                    else if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
                        //lex += String.fromCharCode(c);
                        //c = src.charCodeAt(curIndex++);
                        //return TK_NUM;
                        return number(c);
                    }
                    else {
                        assert( false, "scan.start(): c="+c);
                        return 0;
                    }
                }
            }

            return 0;
        }
        
        function number(c) {
            while (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
                lexeme += String.fromCharCode(c);
                var s;
                c = (s = stream.next()) ? s.charCodeAt(0) : 0
            }

            if (c) {
                stream.backUp(1);
            }  // otherwise, we are at the end of stream
            return TK_NUM;
        }
        
        function ident(c) {
            while ((c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) ||
                   (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0))) {
                lexeme += String.fromCharCode(c);                
                c = stream.peek() ? stream.next().charCodeAt(0) : 0
            }
        
            if (c) {
                stream.backUp(1);
            }  // otherwise, we are at the end of stream

            log("ident() lexeme="+lexeme)
            var tk = TK_IDENT
            if (globalLexicon[lexeme]) {
                tk = globalLexicon[lexeme].tk
            }
            return tk;
        }
    }

    GraffitiCode.parser = {
        token: function(stream, state) {
            return parse(stream, state)
        },

        startState: function() {
            return {
                cc: program,   // top level parsing function
                argc: 0,
                argcStack: [0],
                exprc: 0,
                exprcStack: [0],
                env: [ {name: "global", lexicon: globalLexicon } ],
                nodeStack: [],
                nodePool: ["unused"],
                nodeMap: {},
            }
        },

        parse: parse
    }
})()