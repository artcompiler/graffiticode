/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2014, Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function assert(b, str) {
  if (!b) throw str;
}

function print(str) {
  console.log(str)
}

function log(str) {
  console.log(str)
}

// ast module

var Ast = (function () {
  var _ = exports._;
  var ASSERT = true;
  var assert = function (val, str) {
    if ( !this.ASSERT ) {
      return;
    }
    if ( str === void 0 ) {
      str = "failed!";
    }
    if (!val) {
      throw new Error(str);
    }
  }

  var AstClass = function() { }

  AstClass.prototype = {
    intern: intern,
    node: node,
    dump: dump,
    dumpAll: dumpAll,
    poolToJSON: poolToJSON,
    number: number,
    string: string,
    name: name,
    funcApp: funcApp,
    funcApp2: funcApp2,
    call: call,
    binaryExpr: binaryExpr,
    unaryExpr: unaryExpr,
    prefixExpr: prefixExpr,
    letDefn: letDefn,
    caseExpr: caseExpr,
    ofClause: ofClause,
    record: record,
    binding: binding,
    exprs: exprs,
    program: program,
    pop: pop,
    reset: reset,
    topNode: topNode,
    peek: peek,
    push: push,
    mod: mod,
    add: add,
    sub: sub,
    mul: mul,
    div: div,
    pow: pow,
    concat: concat,
    orelse: orelse,
    andalso: andalso,
    eq: eq,
    ne: ne,
    lt: lt,
    gt: gt,
    le: le,
    ge: ge,
    neg: neg,
    list: list,
    bool: bool,
  };

  return new AstClass;

  // private implementation

  function reset(ctx) {
    ctx.state.nodePool = ["unused"];
    ctx.state.nodeStack = [];
    ctx.state.nodeMap = {};
  }

  function push(ctx, node) {
    var nid;
    if (exports._.isNumber(node)) {   // if already interned
      nid = node;
    } else {
      nid = intern(ctx, node);
    }
    ctx.state.nodeStack.push(nid);
  }

  function topNode(ctx) {
    var nodeStack = ctx.state.nodeStack;
    return nodeStack[nodeStack.length-1];
  }

  function pop(ctx) {
    var nodeStack = ctx.state.nodeStack;
    return nodeStack.pop();
  }

  function peek(ctx) {
    var nodeStack = ctx.state.nodeStack;
    //log("nodeStack="+nodeStack);
    return nodeStack[nodeStack.length-1];
  }

  // deep
  function intern(ctx, n) {
    if (!n) {
      return 0;
    }
    var nodeMap = ctx.state.nodeMap;
    var nodePool = ctx.state.nodePool;
    var tag = n.tag;
    var elts = "";
    var elts_nids = [ ];
    var count = n.elts.length;
    for (var i = 0; i < count; i++) {
      if (typeof n.elts[i] === "object") {
        n.elts[i] = intern(ctx, n.elts[i]);
      }
      elts += n.elts[i];
    }
    var key = tag+count+elts;
    var nid = nodeMap[key];
    if (nid === void 0) {
      nodePool.push({tag: tag, elts: n.elts});
      nid = nodePool.length - 1;
      nodeMap[key] = nid;
      if (n.coord) {
        ctx.state.coords[nid] = n.coord;
      }
    }
    return nid;
  }

  function node(ctx, nid) {
    var n = ctx.state.nodePool[nid];
    if (!n) {
      return {};
    }
    var elts = [];
    switch (n.tag) {
    case "NUM":
    case "STR":
    case "IDENT":
      elts[0] = n.elts[0];
      break;
    default:
      for (var i=0; i < n.elts.length; i++) {
        elts[i] = node(ctx, n.elts[i]);
      }
      break;
    }
    return {
      tag: n.tag,
      elts: elts,
    };
  }

  function dumpAll(ctx) {
    var nodePool = ctx.state.nodePool;
    var s = "\n{"
    for (var i=1; i < nodePool.length; i++) {
      var n = nodePool[i];
      s = s + "\n  " + i+": "+dump(n) + ",";
    }
    s += "\n  root: " + (nodePool.length-1);
    s += "\n}\n";
    return s;
  }

  function poolToJSON(ctx) {
    var nodePool = ctx.state.nodePool;
    var obj = { };
    for (var i=1; i < nodePool.length; i++) {
      var n = nodePool[i];
      obj[i] = nodeToJSON(n);
    }
    obj.root = (nodePool.length-1);
    return obj;
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
        var obj = {};
        obj["tag"] = n.tag;
        obj["elts"] = [];
        for (var i=0; i < n.elts.length; i++) {
          obj["elts"][i] = nodeToJSON(n.elts[i]);
        }
        break;
      }
    } else if (typeof n === "string") {
      var obj = n;
    } else {
      var obj = n;
    }
    return obj;
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
        if (!n.elts) {
          s += "<invalid>";
        } else {
          var s = "{ tag: \"" + n.tag + "\", elts: [ ";
          for (var i=0; i < n.elts.length; i++) {
            if (i > 0) {
              s += " , ";
            }
            s += dump(n.elts[i]);
          }
          s += " ] }";
        }
        break;
      }
    } else if (typeof n === "string") {
      var s = "\""+n+"\"";
    } else {
      var s = n;
    }
    return s;
  }

  function bool(ctx, val) {
    if (val) {
      var b = true;
    } else {
      var b = false;
    }
    push(ctx, {tag: "BOOL", elts: [b]});
  }

  function nul(ctx) {
    push(ctx, {tag: "NULL", elts: []});
  }

  function number(ctx, str, coord) {
    assert(typeof str === "string" || typeof str === "number");
    push(ctx, {
      tag: "NUM",
      elts: [String(str)],
      coord: coord,
    });
  }

  function string(ctx, str, coord) {
    push(ctx, {
      tag: "STR",
      elts: [str],
      coord: coord,
    });
  }

  function name(ctx, str) {
    push(ctx, {tag: "IDENT", elts: [str]});
  }

  // interpret a nid in the current environment

  function fold(ctx, def, args) {
    env.enterEnv(ctx, def.name);
    var lexicon = def.env.lexicon;
    // setup inner environment record (lexicon)
    for (var id in lexicon) {
      if (!id) continue;
      var word = lexicon[id];
      word.val = args[args.length-1-word.offset]  // offsets are from end of args
      env.addWord(ctx, id, word);
    }
    // in line function body at call site
    folder.fold(ctx, def.nid);
    env.exitEnv(ctx);
  }

  function funcApp(ctx, argc) {
    var elts = [];
    while (argc--) {
      var elt = pop(ctx);
      elts.push(elt);
    }
    var nameId = pop(ctx);
    var e = node(ctx, nameId).elts;
    if (!e) {
      return;
    }
    var name = e[0];
    var def = env.findWord(ctx, name);
    // FIXME need to allow forward references
    if (!def) {
      throw "def not found for " + JSON.stringify(name);
    }

    // If recursive call, then this callee does not have a nid yet.
    if (def.nid) {
      // recursion guard
      if (ctx.state.nodeStack.length > 380) {
        //return;  // just stop recursing
        throw new Error("runaway recursion");
      }
      // we have a user def, so fold it.
      //fold(ctx, def, elts);

      // We have a user def so create a call node that gets folded bottom up.
      elts.push(nameId);
      push(ctx, {tag: "CALL", elts: elts});
    } else if (def.nid === 0) {  // defer folding
      elts.push(nameId);
      push(ctx, {tag: "RECURSE", elts: elts});
    } else {
      if (def.val) {
        push(ctx, def.val);
      } else {
        push(ctx, {tag: def.name, elts: elts});
      }
    }
  }

  function call(ctx, argc) {
    var underscore = Ast.intern(ctx, {tag: "IDENT", elts: ["_"]}); 
    var elts = [];
    while (argc--) {
      var elt = pop(ctx);
      if (elt === underscore) {
        elts.push(0);
      } else {
        elts.push(elt);
      }
    }
    var nameId = pop(ctx);
    var e = node(ctx, nameId).elts;
    if (!e) {
      return;
    }
    var name = e[0];
    var def = env.findWord(ctx, name);
    // FIXME need to allow forward references
    if (!def) {
      throw "def not found for " + JSON.stringify(name);
    }

    // If recursive call, then this callee does not have a nid yet.
    if (def.nid) {
      // recursion guard
      if (ctx.state.nodeStack.length > 380) {
        //return;  // just stop recursing
        throw new Error("runaway recursion");
      }
      // we have a user def, so fold it.
      fold(ctx, def, elts);
    } else if (def.nid === 0) {  // defer folding
      elts.push(nameId);
      push(ctx, {tag: "RECURSE", elts: elts});
    } else {
      if (def.val) {
        push(ctx, def.val);
      } else {
        push(ctx, {tag: def.name, elts: elts});
      }
    }
  }

  // calling primitives
  function funcApp2(ctx, argc) {
    var elts = [];
    while (argc--) {
      var elt = pop(ctx);
      elts.push(elt);
    }
    var nameId = pop(ctx);
    var e = node(ctx, nameId).elts;
    if (!e) {
      return;
    }
    var name = e[0];
    push(ctx, {tag: name, elts: elts});
  }
  function list(ctx, count, coord) {
    // Ast list
    var elts = [];
    for (var i = count; i > 0; i--) {
      var elt = pop(ctx);
      if (elt !== void 0) {
        elts.push(elt);
      }
    }
    push(ctx, {
      tag: "LIST",
      elts: elts.reverse(),
      coord: coord,
    });
  }
  function binaryExpr(ctx, name) {
    //log("Ast.binaryExpr() name="+name);
    var elts = [];
    // args are in the order produced by the parser
    elts.push(pop(ctx)); 
    elts.push(pop(ctx));
    push(ctx, {tag: name, elts: elts.reverse()});
  }

  function unaryExpr(ctx, name) {
    //log("Ast.unaryExpr() name="+name);
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {tag: name, elts: elts});
  }

  function prefixExpr(ctx, name) {
    //log("Ast.prefixExpr() name="+name);
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {tag: name, elts: elts});
  }

  function neg(ctx) {
    //log("Ast.neg()");
    var v1 = +node(ctx, pop(ctx)).elts[0];
    number(ctx, -1*v1);
  }

  function add(ctx, coord) {
    log("Ast.add()");
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {
        tag: "ADD",
        elts: [n1, n2],
        coord: coord
      });
    } else {
      number(ctx, +v1 + +v2);
    }
  }

  function sub(ctx) {
    //log("Ast.sub()");
    var n1 = node(ctx, pop(ctx));
    var n2 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "SUB", elts: [n1, n2]});
    } else {
      number(ctx, +v1 - +v2);
    }
  }

  function mul(ctx) {
    //log("Ast.mul()");
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag === undefined) {
      n1 = n1.elts[0];
    }
    if (n2.tag === undefined) {
      n2 = n2.elts[0];
    }
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "MUL", elts: [n2, n1]});
    } else {
      number(ctx, +v1 * +v2);
    }
  }

  function div(ctx) {
    //log("Ast.div()");
    var n1 = node(ctx, pop(ctx));
    var n2 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "DIV", elts: [n1, n2]});
    } else {
      number(ctx, +v1 / +v2);
    }
  }

  function mod(ctx) {
    var n1 = node(ctx, pop(ctx));
    var n2 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "MOD", elts: [n1, n2]});
    } else {
      number(ctx, +v1 % +v2);
    }
  }

  function pow(ctx) {
    var n1 = node(ctx, pop(ctx));
    var n2 = node(ctx, pop(ctx));
    var v1 = n1.elts[0];
    var v2 = n2.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "POW", elts: [n1, n2]});
    } else {
      number(ctx, Math.pow(+v1, +v2));
    }
  }

  function concat(ctx) {
    var n1 = node(ctx, pop(ctx));
    var n2 = node(ctx, pop(ctx));
    var v1 = n1.elts[0];
    var v2 = n2.elts[0];
    if ((n1.tag !== "STR" && n1.tag !== "NUM") || (n2.tag !== "STR" && n2.tag !== "NUM")) {
      push(ctx, {tag: "CONCAT", elts: [n1, n2]});
    } else {
      string(ctx, ""+v1+v2);
    }
  }

  function orelse(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    throw "not implemented";
  }

  function andalso(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    throw "not implemented";
  }

  function eq(ctx) {
    var v2 = node(ctx, pop(ctx)).elts[0];
    var v1 = node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1==v2);
  }

  function ne(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1!=v2);
  }

  function lt(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1<v2);
  }

  function gt(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1>v2);
  }

  function le(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1<=v2);
  }

  function ge(ctx) {
    var v2 = +node(ctx, pop(ctx)).elts[0];
    var v1 = +node(ctx, pop(ctx)).elts[0];
    bool(ctx, v1>=v2);
  }
  function caseExpr(ctx, n) {
    var elts = [];
    for (var i = n; i > 0; i--) {
      elts.push(pop(ctx))  // of
    }
    elts.push(pop(ctx))  // exprs
    push(ctx, {tag: "CASE", elts: elts});
  }
  function ofClause(ctx) {
    var elts = [];
    elts.push(pop(ctx));
    elts.push(pop(ctx));
    push(ctx, {tag: "OF", elts: elts});
  }
  function record(ctx) {
    // Ast record
    var count = ctx.state.exprc;
    var elts = [];
    for (var i = count; i > 0; i--) {
      var elt = pop(ctx);
      if (elt !== void 0) {
        elts.push(elt);
      }
    }
    push(ctx, {tag: "RECORD", elts: elts.reverse()});
  }
  function binding(ctx) {
    // Ast binding
    var elts = [];
    elts.push(pop(ctx));
    elts.push(pop(ctx));
    push(ctx, {tag: "BINDING", elts: elts.reverse()});
  }
  function exprs(ctx, count) {
    // Ast.exprs
    var elts = [];
    for (var i = count; i > 0; i--) {
      var elt = pop(ctx);
      if (elt !== void 0) {
        elts.push(elt);
      }
    }
    push(ctx, {tag: "EXPRS", elts: elts.reverse()});
  }
  function letDefn(ctx) {
    pop(ctx)  // name
    pop(ctx)  // body
    for (var i = 0; i < ctx.state.paramc; i++) {
      pop(ctx) // params
    }
  }
  function program(ctx) {
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {tag: "PROG", elts: elts});
  }
})();

// The following code for StreamString was copied from CodeMirror.

exports.StringStream = (function () {

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
      if (typeof match == "string") {
        var ok = ch == match;
      } else {
        var ok = ch && (match.test ? match.test(ch) : match(ch));
      }
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

  return StringStream;

})();

// env

var env = (function () {
  return {
    findWord: findWord,
    addWord: addWord,
    enterEnv: enterEnv,
    exitEnv: exitEnv,
  };

  // private functions

  function findWord(ctx, lexeme) {
    var env = ctx.state.env;
    for (var i = env.length-1; i >= 0; i--) {
      var word = env[i].lexicon[lexeme];
      if (word) {
        return word;
      }
    }
    return null;
  }

  function addWord(ctx, lexeme, entry) {
    exports.topEnv(ctx).lexicon[lexeme] = entry;
    return null;
  }

  function enterEnv(ctx, name) {
    ctx.state.env.push({name: name, lexicon: {}});
  }

  function exitEnv(ctx) {
    ctx.state.env.pop();
  }

})();

var scanTime = 0;
var scanCount = 0;
exports.scanTime = function () {
  return scanTime;
};
exports.scanCount = function () {
  return scanCount;
};


var parseTime = 0;

exports.parseTime = function () {
  return parseTime;
};

var parseCount = 0;
exports.parseCount = function () {
  return parseCount;
};



// parser
exports.parser = (function () {
  var globalLexicon = exports.globalLexicon;
  var _ = exports._;
  function assert(b, str) {
    if (!b) {
      throw new Error(str);
    }
  }
  function addError(ctx, str) {
    ctx.state.errors.push({
      from: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.start),
      to: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.pos),
      message: str,
      severity : "error",
    });
  }
  var TK_IDENT  = 0x01;
  var TK_NUM  = 0x02;
  var TK_STR  = 0x03;
  var TK_EQUAL  = 0x04;
  var TK_IF   = 0x05;
  var TK_THEN   = 0x06;
  var TK_ELSE   = 0x07;
  var TK_RETURN = 0x08;
  var TK_IS   = 0x09;
  var TK_POSTOP = 0x0A;
  var TK_PREOP  = 0x0B;
  var TK_FUN  = 0x0C;
  var TK_VAL  = 0x0D;
  var TK_BINOP  = 0x0E;
  var TK_CASE   = 0x0F;
  var TK_OF   = 0x10;
  var TK_END  = 0x11;
  var TK_LET  = 0x12;
  var TK_OR   = 0x13;
  var TK_BOOL   = 0x14;
  var TK_NULL   = 0x15;

  var TK_LEFTPAREN  = 0xA1;
  var TK_RIGHTPAREN   = 0xA2;
  var TK_LEFTBRACKET  = 0xA3;
  var TK_RIGHTBRACKET = 0xA4;
  var TK_LEFTBRACE  = 0xA5;
  var TK_RIGHTBRACE   = 0xA6;
  var TK_PLUS     = 0xA7;
  var TK_MINUS    = 0xA8;
  var TK_DOT      = 0xA9;
  var TK_COLON    = 0xAA;
  var TK_COMMA    = 0xAB;
  var TK_BACKQUOTE  = 0xAC;
  var TK_COMMENT    = 0xAD;

  function tokenToLexeme(tk) {
    switch (tk) {
    case TK_EQUAL: return "a '=' symbol";
    case TK_IF: return "the 'if' keyword";
    case TK_THEN: return "the 'then' keyword";
    case TK_ELSE: return "the 'else' keyword";
    case TK_RETURN: return "the 'return' keyword";
    case TK_IS: return "the 'is' keyword";
    case TK_FUN: return "the 'fun' keyword";
    case TK_VAL: return "the 'val' keyword";
    case TK_CASE: return "the 'case' keyword";
    case TK_OF: return "the 'of' keyword";
    case TK_END: return "the 'end' keyword";
    case TK_LET: return "the 'let' keyword";
    case TK_OR: return "the 'or' keyword";
    case TK_POSTOP:
    case TK_PREOP:
    case TK_BINOP:
      return "an operator";
    case TK_LEFTPAREN: return "a '('";
    case TK_RIGHTPAREN: return "a ')'";
    case TK_LEFTBRACKET: return "a '['";
    case TK_RIGHTBRACKET: return "a ']'";
    case TK_LEFTBRACE: return "a '{'";
    case TK_RIGHTBRACE: return "a '}'";
    case TK_PLUS: return "a '+'";
    case TK_MINUS: return "a '-'";
    case TK_DOT: return "a '.'";
    case TK_COLON: return "a ':'";
    case TK_COMMA: return "a ','";
    case TK_BACKQUOTE: return "a '`'";
    case TK_COMMENT: return "a comment";
    case 0: return "the end of the program";
    }
    return "an expression";
  }

  function eat(ctx, tk) {
    //log("eat() tk="+tk);
    var nextToken = next(ctx);
    if (nextToken !== tk) {
      throw new Error("Expecting " + tokenToLexeme(tk) +
                      ", found " + tokenToLexeme(nextToken) + ".");
    }
  }

  function match(ctx, tk) {
    if (peek(ctx) === tk) {
      return true;
    } else {
      return false;
    }
  }

  function next(ctx) {
    var tk = peek(ctx);
    ctx.state.nextToken = -1;
    scanCount++;
    return tk;
  }

  function peek(ctx) {
    var tk;
    var nextToken = ctx.state.nextToken;
    if (nextToken < 0) {
      var t0 = new Date();
      tk = ctx.scan.start();
      var t1 = new Date();
      scanTime += (t1-t0);
      ctx.state.nextToken = tk;
    } else {
      tk = nextToken;
    }
    return tk;
  }

  // Parsing functions -- each parsing function consumes a single token and
  // returns a continuation function for parsing the rest of the string.

  function bool(ctx, cc) {
    eat(ctx, TK_BOOL);
    cc.cls = "number";
    Ast.bool(ctx, lexeme==="true");
    return cc;
  }

  function number(ctx, cc) {
    eat(ctx, TK_NUM);
    cc.cls = "number";
    Ast.number(ctx, lexeme, getCoord(ctx));
    return cc;
  }

  function getCoord(ctx) {
    return {
      from: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.start),
      to: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.pos),
    };
  }

  function string(ctx, cc) {
    eat(ctx, TK_STR);
    var coord = getCoord(ctx);
    cc.cls = "string";
    Ast.string(ctx, lexeme.substring(1,lexeme.length-1), coord) // strip quotes;
    return cc;
  }

  function ident(ctx, cc) {
    eat(ctx, TK_IDENT);
    Ast.name(ctx, lexeme);
    cc.cls = "variable";
    return cc;
  }

  function identOrString(ctx, cc) {
    if (match(ctx, TK_IDENT)) {
      return ident(ctx, cc);
    }
    return string(ctx, cc);
  }

  function defName(ctx, cc) {
    eat(ctx, TK_IDENT);
    Ast.name(ctx, lexeme);
    cc.cls = "val";
    return cc;
  }

  function name(ctx, cc) {
    eat(ctx, TK_IDENT);
    var word = env.findWord(ctx, lexeme);
    if (word) {
      cc.cls = word.cls;
      if (word.cls==="number" && word.val) {
        Ast.number(ctx, word.val);
      } else if (word.cls==="string" && word.val) {
        Ast.string(ctx, word.val);
      } else {
        Ast.name(ctx, lexeme);
      }
    } else {
      cc.cls = "comment";
      ctx.state.errors.push({
        from: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.start),
        to: CodeMirror.Pos(ctx.state.lineNo, ctx.scan.stream.pos),
        message: "Name '" + lexeme + "' not found.",
        severity : "error",
      });
    }
    assert(cc, "name");
    return cc;
  }

  function record(ctx, cc) {
    // Parse record
    eat(ctx, TK_LEFTBRACE);
    startCounter(ctx);
    var ret = function(ctx) {
      return bindings(ctx, function (ctx) {
        eat(ctx, TK_RIGHTBRACE);
        Ast.record(ctx);
        stopCounter(ctx);
        cc.cls = "punc";
        return cc;
      })
    }
    ret.cls = "punc";
    return ret;
  }

  function bindings(ctx, cc) {
    if (match(ctx, TK_RIGHTBRACE)) {
      return cc;
    }
    return binding(ctx, function (ctx) {
      if (match(ctx, TK_COMMA)) {
        eat(ctx, TK_COMMA);
        Ast.binding(ctx);
        var ret = function (ctx) {
          return bindings(ctx, cc);
        };
        ret.cls = "punc";
        return ret;
      }
      return function (ctx) {
        Ast.binding(ctx);
        return bindings(ctx, cc);
      };
    })
  }

  function binding(ctx, cc) {
    return identOrString(ctx, function(ctx) {
      eat(ctx, TK_COLON);
      var ret = function(ctx) {
        countCounter(ctx);
        return expr(ctx, cc);
      }
      ret.cls = "punc";
      return ret;
    })
  }

  function parenExpr(ctx, cc) {
    eat(ctx, TK_LEFTPAREN);
    var ret = function(ctx) {
      return condExpr(ctx, function (ctx) {
        eat(ctx, TK_RIGHTPAREN);
        cc.cls = "punc";
        return cc;
      })
    }
    ret.cls = "punc";
    return ret;
  }

  function list(ctx, cc) {
    eat(ctx, TK_LEFTBRACKET);
    startCounter(ctx);
    var ret = function(ctx) {
      return elements(ctx, function (ctx) {
        eat(ctx, TK_RIGHTBRACKET);
        Ast.list(ctx, ctx.state.exprc, getCoord(ctx));
        stopCounter(ctx);
        cc.cls = "punc";
        return cc;
      });
    }
    ret.cls = "punc";
    return ret;
  }

  function elements(ctx, resume) {
    if (match(ctx, TK_RIGHTBRACKET)) {
      return resume;
    }
    return element(ctx, function (ctx) {
      if (match(ctx, TK_COMMA)) {
        eat(ctx, TK_COMMA);
        var ret = function (ctx) {
          return elements(ctx, resume);
        };
        ret.cls = "punc";
        return ret;
      }
      return function (ctx) {
        return elements(ctx, resume);
      };
    })
  }

  function element(ctx, resume) {
    return expr(ctx, function(ctx) {
      countCounter(ctx);
      return resume;
    });
  }

  function primaryExpr(ctx, cc) {
    if (match(ctx, TK_NUM)) {
      return number(ctx, cc);
    } else if (match(ctx, TK_STR)) {
      return string(ctx, cc);
    } else if (match(ctx, TK_BOOL)) {
      return bool(ctx, cc);
    } else if (match(ctx, TK_NULL)) {
      return nul(ctx, cc);
    } else if (match(ctx, TK_LEFTBRACE)) {
      return record(ctx, cc);
    } else if (match(ctx, TK_LEFTPAREN)) {
      return parenExpr(ctx, cc);
    } else if (match(ctx, TK_LEFTBRACKET)) {
      return list(ctx, cc);
    }
    return name(ctx, cc);
  }

  function funcApp(ctx, cc) {
    return primaryExpr(ctx, function primaryExprCC(ctx) {
      var node = Ast.node(ctx, Ast.topNode(ctx));
      if (node.tag==="IDENT") {
        var name = node.elts[0];
        var word = env.findWord(ctx, name);
        if (word && word.cls === "function") {
          startArgs(word.length);
          return args(ctx, cc);
        }
      }
      return cc(ctx);
      function startArgs(len) {
        ctx.state.argcStack.push(ctx.state.argc);
        ctx.state.paramcStack.push(ctx.state.paramc);
        ctx.state.paramc = ctx.state.argc = len;
      }
    });
  }

  function args(ctx, cc) {
    if (match(ctx, TK_COMMA)) {
      eat(ctx, TK_COMMA);
      Ast.funcApp(ctx, ctx.state.paramc - ctx.state.argc);
      finishArgs(ctx);
      cc.cls = "punc";
      return cc;
    }
    else
    if (ctx.state.argc === 0) {
      Ast.funcApp(ctx, ctx.state.paramc);
      finishArgs();
      return cc(ctx);
    }
    if (match(ctx, TK_DOT)) {
      addError(ctx, "Expecting " + ctx.state.argc +
               " more " + (ctx.state.argc === 1 ? "argument" : "arguments") +
               ".");
    }
    return arg(ctx, function (ctx) {
      return args(ctx, cc);
    })
    function finishArgs() {
      ctx.state.argc = ctx.state.argcStack.pop();
      ctx.state.paramc = ctx.state.paramcStack.pop();
    }
  }

  function arg(ctx, cc) {
    ctx.state.argc--;
    return expr(ctx, cc);
  }

  function postfixExpr(ctx, cc) {
    //log("postfixExpr()");
    return funcApp(ctx, function (ctx) {
      //log("found funcApp");
      if (match(ctx, TK_POSTOP)) {
        eat(ctx, TK_POSTOP);
        cc.cls = "operator";
        Ast.postfixExpr(ctx, lexeme);
        return cc;
      }
      return cc(ctx);
    })
  }

  function prefixExpr(ctx, cc) {
    //log("prefixExpr()");
    if (match(ctx, TK_MINUS)) {
      eat(ctx, TK_MINUS);
      var ret = function(ctx) {
        return postfixExpr(ctx, function (ctx) {
          Ast.prefixExpr(ctx, "NEG");
          return cc;
        })
      }
      ret.cls = "number"   // use number because of convention
      return ret;
    }
    return postfixExpr(ctx, cc);
  }

  function getPrecedence(op) {
    return {
      "": 0
      , "OR": 1
      , "AND": 2
      , "EQ": 3
      , "NE": 3
      , "LT": 4
      , "GT": 4
      , "LE": 4
      , "GE": 4
      , "CONCAT": 5
      , "ADD": 5
      , "SUB": 5
      , "MUL": 6
      , "DIV": 6
      , "MOD": 6
      , "POW": 7
    }[op];
  }

  function binaryExpr(ctx, prevOp, cc) {
    return prefixExpr(ctx, function (ctx) {
      if (match(ctx, TK_BINOP)) {
        eat(ctx, TK_BINOP)
        var ret = function (ctx) {
          var op = env.findWord(ctx, lexeme).name
          if (getPrecedence(prevOp) < getPrecedence(op)) {
            return binaryExpr(ctx, op, function(ctx, prevOp) {
              // This continuation's purpose is to construct a right recursive
              // binary expression node. If the previous node is a binary node
              // with equal or higher precedence, then we get here from the left
              // recursive branch below and there is no way to know the current
              // operator unless it gets passed as an argument, which is what
              // prevOp is for.
              if (prevOp !== void 0) {
                op = prevOp
              }
              Ast.binaryExpr(ctx, op)
              return cc(ctx)
            })
          } else {
            Ast.binaryExpr(ctx, prevOp)
            return binaryExpr(ctx, op, function(ctx, prevOp) {
              if (prevOp !== void 0) {
                op = prevOp
              }
              return cc(ctx, op)
            })
          }
        }
        ret.cls = "operator"
        return ret
      }
      return cc(ctx)
    })
  }

  function relationalExpr(ctx, cc) {
    return binaryExpr(ctx, "", function (ctx) {
      return cc(ctx)
    })
  }

  function condExpr(ctx, cc) {
    //log("condExpr()")
    if (match(ctx, TK_CASE)) {
      return caseExpr(ctx, cc)
    }
    return relationalExpr(ctx, cc)
  }

  function caseExpr(ctx, cc) {
    //log("caseExpr()")
    eat(ctx, TK_CASE)
    var ret = function (ctx) {
      return expr(ctx, function (ctx) {
        startCounter(ctx)
        return ofClauses(ctx, function (ctx) {
          Ast.caseExpr(ctx, ctx.state.exprc)
          stopCounter(ctx)
          eat(ctx, TK_END)
          cc.cls = "keyword"
          return cc
        })
      })
    }
    ret.cls = "keyword"
    return ret
  }

  function ofClauses(ctx, cc) {
    //log("ofClauses()")
    if (match(ctx, TK_OF)) {
      return ofClause(ctx, function (ctx) {
        countCounter(ctx)
        if (match(ctx, TK_OF)) {
          return ofClauses(ctx, cc)
        }
        return cc(ctx)
      })
    }
    return cc(ctx)
  }

  function ofClause (ctx, cc) {
    //log("ofClause()")
    eat(ctx, TK_OF)
    var ret = function (ctx) {
      return pattern(ctx, function (ctx) {
        eat(ctx, TK_EQUAL)
        var ret = function(ctx) {
          return exprsStart(ctx, function(ctx) {
            Ast.ofClause(ctx)
            return cc(ctx)
          })
        }
        ret.cls = "punc"
        return ret
      })
    }
    ret.cls = "keyword"
    return ret
  }

  function pattern(ctx, cc) {
    // FIXME only matches number literals for now
    return primaryExpr(ctx, cc)
  }

  function thenClause(ctx, cc) {
    //log("thenClause()")
    eat(ctx, TK_THEN)
    var ret = function (ctx) {
      return exprsStart(ctx, function (ctx) {
        if (match(ctx, TK_ELSE)) {
          return elseClause(ctx, cc)
        } else {
          return cc(ctx)
        }
      })
    }
    ret.cls = "keyword"
    return ret
  }

  function elseClause(ctx, cc) {
    //log("elseClause()")
    eat(ctx, TK_ELSE)
    var ret = function (ctx) {
      return exprsStart(ctx, cc)
    }
    ret.cls = "keyword"
    return ret
  }

  function expr(ctx, cc) {
    if (match(ctx, TK_LET)) {
      var ret = def(ctx, cc);
      return ret;
    }
    var ret = condExpr(ctx, cc);
    return ret;
  }

  function emptyInput(ctx) {
    return peek(ctx) === 0
  }

  function emptyExpr(ctx) {
    return emptyInput(ctx)
      || match(ctx, TK_THEN)
      || match(ctx, TK_ELSE)
      || match(ctx, TK_OR)
      || match(ctx, TK_END)
      || match(ctx, TK_DOT)
  }

  function countCounter(ctx) {
    ctx.state.exprc++
  }

  function startCounter(ctx) {
    ctx.state.exprcStack.push(ctx.state.exprc)
    ctx.state.exprc = 0
  }

  function stopCounter(ctx) {
    ctx.state.exprc = ctx.state.exprcStack.pop()
  }

  function exprsStart(ctx, cc) {
    startCounter(ctx)
    return exprs(ctx, cc)
  }

  function exprsFinish(ctx, cc) {
    Ast.exprs(ctx, ctx.state.exprc)
    stopCounter(ctx)
    return cc(ctx)
  }

  function exprs(ctx, cc) {
    if (match(ctx, TK_DOT)) {   // second dot
      eat(ctx, TK_DOT);
      var ret = function(ctx) {
        return exprsFinish(ctx, cc);
      }
      ret.cls = "punc";
      return ret;
    }
    return expr(ctx, function (ctx) {
      countCounter(ctx);
      if (match(ctx, TK_DOT)) {
        eat(ctx, TK_DOT);
        var ret = function (ctx) {
          if (emptyInput(ctx) || emptyExpr(ctx)) {
            return exprsFinish(ctx, cc);
          }
          return exprs(ctx, cc);
        }
        ret.cls = "punc";
        return ret;
      }
      return exprsFinish(ctx, cc);
    })
  }

  function program(ctx, cc) {
    return exprsStart(ctx, function (ctx) {
      folder.fold(ctx, Ast.pop(ctx))  // fold the exprs on top
      Ast.program(ctx)
      assert(cc===null, "internal error, expecting null continuation")
      //print(Ast.dumpAll(ctx));
      return cc
    })
  }

  function def(ctx, cc) {
    if (match(ctx, TK_LET)) {
      eat(ctx, TK_LET)
      var ret = function (ctx) {
        var ret = defName(ctx, function (ctx) {
          var name = Ast.node(ctx, Ast.topNode(ctx)).elts[0]
          // nid=0 means def not finished yet
          env.addWord(ctx, name, { tk: TK_IDENT, cls: "function", length: 0, nid: 0, name: name })
          ctx.state.paramc = 0
          env.enterEnv(ctx, name)  // FIXME need to link to outer env
          return params(ctx, function (ctx) {
            var func = env.findWord(ctx, topEnv(ctx).name)
            func.length = ctx.state.paramc
            func.env = topEnv(ctx)
            eat(ctx, TK_EQUAL)
            var ret = function(ctx) {
              return exprsStart(ctx, function (ctx) {
                var def = env.findWord(ctx, topEnv(ctx).name)
                def.nid = Ast.peek(ctx)   // save node id for aliased code
                env.exitEnv(ctx)
                Ast.letDefn(ctx)
                return cc
              })
            }
            ret.cls = "punc"
            return ret
          })
        })
        ret.cls = "def"
        return ret
      }
      ret.cls = "keyword"
      return ret
    }
    return name(ctx, cc)
  }

  function params(ctx, cc) {
    //log("params()")
    if (match(ctx, TK_EQUAL)) {
      return cc
    }
    var ret = function (ctx) {
      var ret = defName(ctx, function (ctx) {
        env.addWord(ctx, lexeme, { tk: TK_IDENT, cls: "val", offset: ctx.state.paramc })
        ctx.state.paramc++
        return params(ctx, cc)
      })
      ret.cls = "param"
      return ret
    }
    ret.cls = "param";
    return ret;
  }

  function param(ctx, cc) {
    //log("param()")
    return primaryExpr(ctx, function (ctx) {
      return cc
    })
  }

  // Drive the parser

  function topEnv(ctx) {
    return ctx.state.env[ctx.state.env.length-1]
  }

  function compileCode(ast, postCode) {
    lastAST = ast;
    var dispatcher = window.dispatcher;
    ast = JSON.stringify(ast);
    var src = window.exports.editor.getValue();
    $.ajax({
      type: "PUT",
      url: "/compile",
      data: {
        "id": !postCode ? window.exports.id : undefined,
        "ast": ast,
        "type": exports.lexiconType,
        "language": exports.language,
        "src": src,
      },
      dataType: "json",
      success: function(data) {
        var obj = JSON.parse(data.obj);
        var errors;
        if (obj.error && obj.error.length) {
          errors = [];
          obj.error.forEach(function (err) {
            var coord = window.coords[err.nid];
            if (!coord || !coord.from || !coord.to) {
              coord = {};
              coord.from = CodeMirror.Pos(0, 0);
              coord.to = CodeMirror.Pos(0, 0);
            }
            errors.push({
              from: coord.from,
              to: coord.to,
              message: err.str,
              severity : "error",
            });
          });
          window.exports.lastErrors = window.exports.errors = errors;
          window.exports.editor.performLint();
        } else if (data.id) {
          // We have a good id, so use it.
          window.exports.id = data.id;
          window.exports.lastErrors = [];
          window.history.pushState("string", "title", "/" + exports.view + "?id=" + data.id);
        }
        dispatcher.dispatch({
          id: data.id,
          src: src,
          obj: data.obj,
          ast: ast,
          postCode: postCode,
          errors: errors,
        });
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err);
      }
    });
  }

  function saveSrc() {
    var id = window.exports.id;
    var src = window.exports.editor.getValue();
    $.ajax({
      type: "PUT",
      url: "/code",
      data: {
        "id": id,
        "src": src,
      },
      dataType: "json",
      success: function(data) {
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err);
      }
    });
  }

  exports.topEnv = topEnv
  var lastAST;
  var lastTimer;
  var firstTime = true;
  function parse(stream, state) {
    var ctx = {
      scan: scanner(stream),
      state: state,
    };
    var cls
    try {
      var c;
      while ((c = stream.peek()) && (c===' ' || c==='\t')) {
        stream.next()
      }
      // if this is a blank line, treat it as a comment
      if (stream.peek()===void 0) {
        throw "comment"
      }
      // call the continuation and store the next continuation
      //log(">>parse() cc="+state.cc+"\n")
      if (state.cc === null) {
        next(ctx)
        return "comment"
      }
      var t0 = new Date;
      var lastCC = state.cc
      var cc = state.cc = state.cc(ctx, null)
      if (cc) {
        cls = cc.cls
      }
      if (cc === null) {
        if (state.errors.length === 0) {
          window.exports.errors = [];
          var thisAST = Ast.poolToJSON(ctx);
          if (lastTimer) {
            // Reset timer to wait another second pause.
            window.clearTimeout(lastTimer);
          }
          if (JSON.stringify(lastAST) !== JSON.stringify(thisAST)) {
            // Compile code if no edit activity after 1 sec.
            if (firstTime) {
              // First time through, don't delay.
              compileCode(thisAST, false);
            }
            if (!firstTime) {
              lastTimer = window.setTimeout(function () {
                compileCode(thisAST, true);
              }, 1000);
            }
            firstTime = false;
          } else {
            // The AST hasn't changed, but the text has so save the code.
            lastTimer = window.setTimeout(function () {
              window.exports.errors = window.exports.lastErrors;
              window.exports.editor.performLint();
              saveSrc();
            }, 1000);
          }
        } else {
          window.exports.errors = state.errors;
        }
      }
      var c;
      while ((c = stream.peek()) &&
           (c===' ' || c==='\t')) {
        stream.next()
      }
    } catch (x) {
      //console.log(x.stack);
      //console.log(Ast.dumpAll(ctx));
      if (x instanceof Error) {
        next(ctx)
        addError(ctx, x.message);
        cls = "error"
      } else if (x === "comment") {
        //print("comment found")
        cls = x
      } else {
        //throw x
        next(ctx)
        cls = "error"
      }
      console.log(x)
    }
    var t1 = new Date;
    parseCount++
    parseTime += t1 - t0
    window.coords = state.coords;
    return cls
  }

  var lexeme = ""

  function scanner(stream) {

    var lexemeToToken = [ ]

    var keywords = {
      "let" : { "tk": 0x12, "cls": "keyword" },
      "if" : { "tk": 0x05, "cls": "keyword" },
      "then" : { "tk": 0x06, "cls": "keyword" },
      "else" : { "tk": 0x07, "cls": "keyword" },
      "case" : { "tk": 0x0F, "cls": "keyword" },
      "of" : { "tk": 0x10, "cls": "keyword" },
      "end" : { "tk": 0x11, "cls": "keyword", "length": 0 },
      "true" : { "tk": 0x14, "cls": "val", "length": 0 },
      "false" : { "tk": 0x14, "cls": "val", "length": 0 },
      "null" : { "tk": 0x15, "cls": "val", "length": 0 },
    };

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
          c = ' ';
          continue
        case 46:  // dot
          lexeme += String.fromCharCode(c);
          return TK_DOT
        case 44:  // comma
          lexeme += String.fromCharCode(c);
          return TK_COMMA
        case 58:  // colon
          lexeme += String.fromCharCode(c);
          return TK_COLON
        case 61:  // equal
          lexeme += String.fromCharCode(c);
          return TK_EQUAL
        case 40:  // left paren
          lexeme += String.fromCharCode(c);
          return TK_LEFTPAREN
        case 41:  // right paren
          lexeme += String.fromCharCode(c);
          return TK_RIGHTPAREN
        case 45:  // dash
          lexeme += String.fromCharCode(c);
          return TK_MINUS
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
        case 34:  // double quote
        case 39:  // single quote
          return string(c)

        case 96:  // backquote
        case 47:  // slash
        case 92:  // backslash
        case 33:  // !
        case 124: // |
          comment(c)
          throw "comment"

        case 94:  // caret
        case 44:  // comma
        case 42:  // asterisk
          lexeme += String.fromCharCode(c);
          return c; // char code is the token id
        default:
          if ((c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) ||
            (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) ||
            (c === '_'.charCodeAt(0))) {
            return ident(c);
          } else if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
            //lex += String.fromCharCode(c);
            //c = src.charCodeAt(curIndex++);
            //return TK_NUM;
            return number(c);
          } else {
            assert(false, "'" + String.fromCharCode(c) + "' has no meaning in this language.");
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

    function string(c) {
      var quoteChar = c
      lexeme += String.fromCharCode(c)
      c = (s = stream.next()) ? s.charCodeAt(0) : 0

      while (c !== quoteChar && c !== 0) {
        lexeme += String.fromCharCode(c);
        var s;
        c = (s = stream.next()) ? s.charCodeAt(0) : 0
      }

      if (c) {
        lexeme += String.fromCharCode(c)
        return TK_STR;
      } else {
        return 0
      }
    }

    function comment(c) {
      var quoteChar = c
      c = (s = stream.next()) ? s.charCodeAt(0) : 0

      while (c !== quoteChar && c != 10 && c!= 13 && c !== 0) {
        var s;
        c = (s = stream.next()) ? s.charCodeAt(0) : 0
      }

      return TK_COMMENT
    }

    function ident(c) {
      while ((c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) ||
           (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) ||
           (c === '-'.charCodeAt(0)) ||
           (c === '@'.charCodeAt(0)) ||
           (c === '+'.charCodeAt(0)) ||
           (c === '#'.charCodeAt(0)) ||
           (c === '_'.charCodeAt(0)) ||
           (c === '~'.charCodeAt(0)) ||
           (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)))
      {
        lexeme += String.fromCharCode(c);
        c = stream.peek() ? stream.next().charCodeAt(0) : 0
      }

      if (c) {
        stream.backUp(1);
      }  // otherwise, we are at the end of stream

      //log("ident() lexeme="+lexeme)
      var tk = TK_IDENT
      if (keywords[lexeme]) {
      } else if (globalLexicon[lexeme]) {
        tk = globalLexicon[lexeme].tk
      }
      return tk;
    }
  }

  var parser = {
    token: function(stream, state) {
      return parse(stream, state)
    },

    parse: parse,
    program: program,
  }

  exports.parse = parser.parse

  return parser
})(); // end parser

var foldTime = 0

exports.foldTime = function () {
  return foldTime
}

var folder = function() {
  var _ = exports._;

  var table = {
    "PROG" : program,
    "EXPRS" : exprs,
    "RECURSE" : recurse,
    "IDENT" : ident,
    "BOOL" : bool,
    "NUM" : num,
    "STR" : str,
    "PARENS" : unaryExpr,
    "MAP": map,
    "CALL" : call,
    "MUL": mul,
    "DIV": div,
    "SUB": sub,
    "ADD": add,
    "POW": pow,
    "MOD": mod,
    "CONCAT": concat,
    "OR": orelse,
    "AND": andalso,
    "NE": ne,
    "EQ": eq,
    "LT": lt,
    "GT": gt,
    "LE": le,
    "GE": ge,
    "NEG": neg,
    "LIST": list,
    "CASE": caseExpr,
    "OF": ofClause,
  };

  var canvasWidth = 0;
  var canvasHeight = 0;

  return {
    fold: fold,
  };

  // CONTROL FLOW ENDS HERE

  var nodePool;
  var ctx;

  function fold(cx, nid) {
    ctx = cx;
    nodePool = ctx.state.nodePool;
    var t0 = new Date;
    visit(nid);
    var t1 = new Date;
    foldTime += (t1-t0);
  }

  function visit(nid) {
    var node = nodePool[nid];
    if (node == null) {
      return null;
    }
    if (node.tag === void 0) {
      return [ ]  // clean up stubs;
    } else if (isFunction(table[node.tag])) {
      var ret = table[node.tag](node);
      return ret;
    }
    funcApp2(node);
  }

  function isArray(v) {
    return exports._.isArray(v);
  }

  function isObject(v) {
    return _isObjet(v);
  }

  function isString(v) {
    return exports._.isString(v);
  }

  function isPrimitive(v) {
    return exports._.isNull(v) || exports._.isString(v) || exports._.isNumber(v) || exports._.isBoolean(v);
  }

  function isFunction(v) {
    return exports._.isFunction(v);
  }

  // BEGIN VISITOR METHODS

  var edgesNode;

  function program(node) {
    visit(node.elts[0]);
    Ast.program(ctx);
  }

  function caseExpr(node) {
    visit(node.elts[node.elts.length-1]);
    var expr = Ast.pop(ctx);
    for (var i = node.elts.length-2; i >= 0; i--) {
      var ofNode = ctx.state.nodePool[node.elts[i]];
      var patternNode = ofNode.elts[1];
      visit(patternNode);
      var pattern = Ast.pop(ctx);
      if (expr === pattern) {
        visit(ofNode.elts[0]);
        return;
      }
    }
  }

  function ofClause(node) {
    for (var i = 0; i < node.elts.length; i++) {
      visit(node.elts[i]);
    }
    Ast.ofClause(ctx);
  }

  function list(node) {
    // Fold list
    for (var i = 0; i < node.elts.length; i++) {
      visit(node.elts[i]);
    }
    Ast.list(ctx, node.elts.length)
  }

  function exprs(node) {
    // Fold exprs
    for (var i = 0; i < node.elts.length; i++) {
      visit(node.elts[i]);
    }
    Ast.exprs(ctx, node.elts.length);
  }

  function recurse(node) {
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.call(ctx, node.elts.length-1) // func name is the +1
  }

  function map(node) {
    Ast.name(ctx, "map");
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.funcApp(ctx, node.elts.length);
  }

  function call(node) {
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.call(ctx, node.elts.length-1);
  }

  function funcApp2(node) {
    Ast.name(ctx, node.tag);
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.funcApp2(ctx, node.elts.length);
  }

  function neg(node) {
    visit(node.elts[0]);
    Ast.neg(ctx);
  }

  function unaryExpr(node) {
    visit(node.elts[0]);
    Ast.unaryExpr(ctx, node.tag);
  }

  function visitArgs(args) {
    for (var i = args.length - 1; i >= 0; i--) {
      visit(args[i]);
    }
  }

  function add(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.add(ctx);
  }

  function sub(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.sub(ctx);
  }

  function mul(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.mul(ctx);
  }

  function div(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.div(ctx);
  }

  function pow(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.pow(ctx);
  }

  function concat(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.concat(ctx);
  }

  function mod(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.mod(ctx);
  }

  function orelse(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.orelse(ctx);
  }

  function andalso(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.andalso(ctx);
  }

  function eq(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.eq(ctx);
  }

  function ne(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.ne(ctx);
  }

  function lt(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.lt(ctx);
  }

  function gt(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.gt(ctx);
  }

  function le(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.le(ctx);
  }

  function ge(node) {
    visit(node.elts[1]);
    visit(node.elts[0]);
    Ast.ge(ctx);
  }

  // when folding identifiers we encounter three cases:
  // -- the identifier is a function name, so we create a funcApp node
  // -- the identifier has a value, so we replace it with the value
  // -- the identifier is a reference to a local without a value, so we keep the identifier

  function ident(node) {
    var name = node.elts[0];
    var word = env.findWord(ctx, name);
    if (word) {
      if (word.cls==="val") {
        if (word.val) {
          Ast.push(ctx, word.val);
          visit(Ast.pop(ctx));      // reduce the val expr
        } else if (word.name) {
          Ast.push(ctx, {tag: word.name, elts: []});  // create a node from the word entry
        } else {
          // push the original node to be resolved later.
          Ast.push(ctx, node);
        }
      } else {
        // push the original node to be resolved later.
        Ast.push(ctx, node);
      }
// FIXME need to implement this
//      else
//      if (word.cls==="function") {
//        assert(false, "implement forward references to functions")
//      }
    } else {
      //assert(false, "unresolved ident "+name);
      Ast.push(ctx, node);
    }
  }

  function num(node) {
    Ast.number(ctx, node.elts[0]);
  }

  function str(node) {
    Ast.string(ctx, node.elts[0]);
  }

  function bool(node) {
    Ast.bool(ctx, node.elts[0]);
  }

  function nul(node) {
    Ast.nul(ctx);
  }

  function stub(node) {
    return "";
  }
}();

