// Copyright 2021, ARTCOMPILER INC

var CodeMirror;
if (typeof CodeMirror === "undefined") {
  var CodeMirror = {
    Pos: function () {
      return {};
    }
  };
}

var window;
if (typeof window === "undefined") {
  var window = {};
  window = {
    gcexports: {
      coords: {},
    },
    errors: [],
    isSynthetic: true,
  };
}

function assert(b, str) {
  if (!b) throw str;
}

// ast module

var Ast = (function () {
  var ASSERT = true;
  var assert = function (val, str) {
    if ( !ASSERT ) {
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
    apply: apply,
    fold: fold,
    expr: expr,
    binaryExpr: binaryExpr,
    unaryExpr: unaryExpr,
    parenExpr: parenExpr,
    prefixExpr: prefixExpr,
    lambda: lambda,
    applyLate: applyLate,
    letDef: letDef,
    caseExpr: caseExpr,
    ofClause: ofClause,
    record: record,
    binding: binding,
    exprs: exprs,
    program: program,
    pop: pop,
    topNode: topNode,
    peek: peek,
    push: push,
    mod: mod,
    add: add,
    sub: sub,
//    mul: mul,
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
    nul: nul,
  };

  return new AstClass;

  // private implementation

  function push(ctx, node) {
    var nid;
    if (typeof node === "number") {   // if already interned
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

  function peek(ctx, n) {
    if (n === undefined) {
      n = 0;
    }
    var nodeStack = ctx.state.nodeStack;
    return nodeStack[nodeStack.length - 1 - n];
  }

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
    if (!nid) {
      return null;
    } else if (!n) {
      return {};
    }
    var elts = [];
    switch (n.tag) {
    case "NULL":
      break;
    case "NUM":
    case "STR":
    case "IDENT":
    case "BOOL":
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
      coord: getCoord(ctx),
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
    obj.version = window.gcexports.version;
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

  function fold(ctx, fn, args) {
    // Local defs:
    // -- put bindings in env
    // Three cases:
    // -- full application, all args are available at parse time
    // -- partial application, only some args are available at parse time
    // -- late application, args are available at compile time (not parse time)
    //        apply <[x y]: add x y> data..
    //    x: val 0 data
    //    y: val 1 data
    env.enterEnv(ctx, fn.name);
    if (fn.env) {
      var lexicon = fn.env.lexicon;
      var pattern = Ast.node(ctx, fn.env.pattern);
      var outerEnv = null;
      // setup inner environment record (lexicon)
      if (pattern && pattern.elts &&
          pattern.elts.length === 1 &&
          pattern.elts[0].tag === "LIST") {
        // For now we only support one pattern per param list.
        var isListPattern = true;
      }
      for (var id in lexicon) {
        // For each parameter, get its definition assign the value of the argument
        // used on the current function application.
        if (!id) continue;
        var word = JSON.parse(JSON.stringify(lexicon[id])); // poor man's copy.
        var index = args.length - word.offset - 1;
        // TODO we currently ignore list patterns
        // if (isListPattern) {
        //   // <[x y]: ...> foo..
        //   word.nid = Ast.intern(ctx, {
        //     tag: "VAL",
        //     elts: [{
        //       tag: "NUM",
        //       elts: [
        //         String(word.offset),
        //       ]}, {
        //         tag: "ARG",
        //         elts: [{
        //           tag: "NUM",
        //           elts: ["0"]
        //         }]
        //       }]
        //   });
        // } else
        if (index >= 0 && index < args.length) {
          word.nid = args[index];
        }
        if (index < 0) {
          // We've got an unbound variable or a variable with a default value,
          // so add it to the new variable list.
          // <x:x> => <x:x>
          // (<x y: add x y> 10) => <y: add 10 y>
          // (<y: let x = 10.. add x y>) => <y: add 10 y>
          if (!outerEnv) {
            outerEnv = {};
          }
          outerEnv[id] = word;
        }
        env.addWord(ctx, id, word);
      }
      folder.fold(ctx, fn.nid);
      if (outerEnv) {
        lambda(ctx, {
          lexicon: outerEnv,
          pattern: pattern,  // FIXME need to trim pattern if some args where applied.
        }, pop(ctx));
      }
    }
    env.exitEnv(ctx);
  }

  function applyLate(ctx, count) {
    // Ast.applyLate
    var elts = [];
    for (var i = count; i > 0; i--) {
      elts.push(pop(ctx));
    }
    push(ctx, {
      tag: "APPLY",
      elts: elts,
    });
  }

  function apply(ctx, fnId, argc) {
    // Construct function and apply available arguments.
    var fn = node(ctx, fnId);
    // if (fn.tag !== "LAMBDA") {
    //   // Construct an APPLY node for compiling later.
    //   return {
    //     tag: "APPLY",
    //     elts: [
    //       fnId,
    //     ]
    //   };
    // }
    // Construct a lexicon
    var lexicon = {};
    var paramc = 0;
    fn.elts[0].elts.forEach(function (n, i) {
      var name = n.elts[0];
      var nid = Ast.intern(ctx, fn.elts[3].elts[i]);
      lexicon[name] = {
        cls: "val",
        name: name,
        offset: i,
        nid: nid,
      };
      if (!nid) {
        // Parameters don't have nids.
        // assert that there are parameters after a binding without a nid.
        paramc++;
      }
    });
    var def = {
      name: "lambda",
      nid: Ast.intern(ctx, fn.elts[1]),
      env: {
        lexicon: lexicon,
        pattern: Ast.intern(ctx, fn.elts[2]),
      },
    };
    var len = fn.elts[0].elts.length;
    var elts = [];
    // While there are args on the stack, pop them.
    while (argc-- > 0 && paramc-- > 0) {
      var elt = pop(ctx);
      elts.unshift(elt);  // Get the order right.
    }
    fold(ctx, def, elts);
  }

  // Node constructors

  function bool(ctx, val) {
    if (val) {
      var b = true;
    } else {
      var b = false;
    }
    push(ctx, {
      tag: "BOOL",
      elts: [b]
    });
  }

  function nul(ctx) {
    push(ctx, {
      tag: "NULL",
      elts: []
    });
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

  function name(ctx, name, coord) {
    push(ctx, {
      tag: "IDENT",
      elts: [name],
      coord: coord,
    });
  }

  function expr(ctx, argc) {
    // Ast.expr -- construct a expr node for the compiler.
    var elts = [];
    while (argc--) {
      var elt = pop(ctx);
      elts.push(elt);
    }
    var nameId = pop(ctx);
    assert(nameId, "Ill formed node.");
    var e = node(ctx, nameId).elts;
    assert(e && e.length > 0, "Ill formed node.");
    var name = e[0];
    push(ctx, {
      tag: name,
      elts: elts,
      coord: getCoord(ctx),
    });
  }

  function parenExpr(ctx, coord) {
    // Ast.parenExpr
    var elts = [];
    var elt = pop(ctx);
    elts.push(elt);
    push(ctx, {
      tag: "PAREN",
      elts: elts,
      coord: coord,
    });
  }

  function list(ctx, count, coord, reverse) {
    // Ast.list
    var elts = [];
    for (var i = count; i > 0; i--) {
      var elt = pop(ctx);
      if (elt !== void 0) {
        elts.push(elt);
      }
    }
    push(ctx, {
      tag: "LIST",
      elts: reverse ? elts : elts.reverse(),
      coord: coord,
    });
  }

  function binaryExpr(ctx, name) {
    var elts = [];
    // args are in the order produced by the parser
    elts.push(pop(ctx));
    elts.push(pop(ctx));
    push(ctx, {
      tag: name,
      elts: elts.reverse()
    });
  }
  function unaryExpr(ctx, name) {
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {
      tag: name,
      elts: elts
    });
  }

  function prefixExpr(ctx, name) {
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {
      tag: name,
      elts: elts
    });
  }

  function neg(ctx) {
    var v1 = +node(ctx, pop(ctx)).elts[0];
    number(ctx, -1*v1);
  }

  function add(ctx, coord) {
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
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "SUB", elts: [n1, n2]});
    } else {
      number(ctx, +v1 - +v2);
    }
  }

  function mul(ctx) {
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
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "DIV", elts: [n1, n2]});
    } else {
      number(ctx, +v1 / +v2);
    }
  }

  function mod(ctx) {
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v1 = n1.elts[0];
    var v2 = n2.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "MOD", elts: [n1, n2]});
    } else {
      number(ctx, +v1 % +v2);
    }
  }

  function pow(ctx) {
    var n2 = node(ctx, pop(ctx));
    var n1 = node(ctx, pop(ctx));
    var v2 = n2.elts[0];
    var v1 = n1.elts[0];
    if (n1.tag !== "NUM" || n2.tag !== "NUM") {
      push(ctx, {tag: "POW", elts: [n1, n2]});
    } else {
      number(ctx, Math.pow(+v1, +v2));
    }
  }

  function concat(ctx) {
    var n1 = node(ctx, pop(ctx));
    push(ctx, {
      tag: "CONCAT",
      elts: [n1]
    });
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
    push(ctx, {tag: "CASE", elts: elts.reverse()});
  }
  function ofClause(ctx) {
    var elts = [];
    elts.push(pop(ctx));
    elts.push(pop(ctx));
    push(ctx, {tag: "OF", elts: elts.reverse()});
  }

  function record(ctx) {
    // Ast.record
    var count = ctx.state.exprc;
    var elts = [];
    for (var i = count; i > 0; i--) {
      var elt = pop(ctx);
      if (elt !== void 0) {
        elts.push(elt);
      }
    }
    push(ctx, {
      tag: "RECORD",
      elts: elts
    });
  }

  function binding(ctx) {
    // Ast.binding
    var elts = [];
    elts.push(pop(ctx));
    elts.push(pop(ctx));
    push(ctx, {
      tag: "BINDING",
      elts: elts.reverse()
    });
  }

  function lambda(ctx, env, nid) {
    // Ast.lambda
    var names = [];
    var nids = [];
    for (var id in env.lexicon) {
      var word = env.lexicon[id];
      names.push({
        tag: "IDENT",
        elts: [word.name],
        coord: getCoord(ctx),
      });
      nids.push(word.nid || 0);
    }
    var pattern = env.pattern;
    push(ctx, {
      tag: "LAMBDA",
      elts: [{
        tag: "LIST",
        elts: names
      }, nid, {
        tag: "LIST",
        elts: pattern
      }, {
        tag: "LIST",
        elts: nids
      }]
    });
  }

  function exprs(ctx, count, inReverse) {
    // Ast.exprs
    var elts = [];
    assert(ctx.state.nodeStack.length >= count);
    if (inReverse) {
      for (var i = count; i > 0; i--) {
        var elt = pop(ctx);
        var n;
        if (false && (n = node(ctx, elt)) && n.tag === "EXPRS") {
          elts = elts.concat(n.elts);
        } else {
          elts.push(elt);  // Reverse order.
        }
      }
    } else {
      for (var i = count; i > 0; i--) {
        var elt = pop(ctx);
        var n;
        if (false && (n = node(ctx, elt)) && n.tag === "EXPRS") {
          elts = elts.concat(n.elts);
        } else {
          elts.push(elt);  // Reverse order.
        }
      }
      elts = elts.reverse();
    }
    push(ctx, {
      tag: "EXPRS",
      elts: elts
    });
  }

  function letDef(ctx) {
    // Clean up stack and produce initializer.
    pop(ctx); // body
    pop(ctx); // name
    for (var i = 0; i < ctx.state.paramc; i++) {
      pop(ctx); // params
    }
    ctx.state.exprc--; // don't count as expr.
  }

  function program(ctx) {
    var elts = [];
    elts.push(pop(ctx));
    push(ctx, {
      tag: "PROG",
      elts: elts
    });
  }
})();

// The following code for StreamString was copied from CodeMirror.

window.gcexports.StringStream = (function () {

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
    addPattern: addPattern,
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
    window.gcexports.topEnv(ctx).lexicon[lexeme] = entry;
    return null;
  }

  function addPattern(ctx, pattern) {
    window.gcexports.topEnv(ctx).pattern.push(pattern);
  }

  function enterEnv(ctx, name) {
    // recursion guard
    if (ctx.state.env.length > 380) {
      //return;  // just stop recursing
      throw new Error("runaway recursion");
    }
    window.gcexports.topEnv(ctx).paramc = ctx.state.paramc;
    ctx.state.env.push({
      name: name,
      lexicon: {},
      pattern: [],
    });
  }

  function exitEnv(ctx) {
    ctx.state.env.pop();
    ctx.state.paramc = window.gcexports.topEnv(ctx).paramc;
  }

})();

var scanTime = 0;
var scanCount = 0;
window.gcexports.scanTime = function () {
  return scanTime;
};
window.gcexports.scanCount = function () {
  return scanCount;
};


var parseTime = 0;

window.gcexports.parseTime = function () {
  return parseTime;
};

var parseCount = 0;
window.gcexports.parseCount = function () {
  return parseCount;
};

function getCoord(ctx) {
  let ln = ctx.scan.stream.lineOracle && ctx.scan.stream.lineOracle.line || 0;
  return {
    from: CodeMirror.Pos(ln, ctx.scan.stream.start),
    to: CodeMirror.Pos(ln, ctx.scan.stream.pos),
  };
}

// parser
window.gcexports.parser = (function () {
  function assert(b, str) {
    if (!b) {
      throw new Error(str);
    }
  }
  var keywords = window.gcexports.keywords = {
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
  function addError(ctx, str) {
    let ln = ctx.scan.stream.lineOracle && ctx.scan.stream.lineOracle.line || 0;
    window.gcexports.errors.push({
      from: CodeMirror.Pos(ln, ctx.scan.stream.start),
      to: CodeMirror.Pos(ln, ctx.scan.stream.pos),
      message: str,
      severity : "error",
    });
  }

  var CC_DOUBLEQUOTE = 0x22;
  var CC_DOLLAR = 0x24;
  var CC_SINGLEQUOTE = 0x27;
  var CC_BACKTICK = 0x60;
  var CC_LEFTBRACE = 0x7B;
  var CC_RIGHTBRACE = 0x7D;

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
  var TK_IN     = 0x16;

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
  var TK_LEFTANGLE  = 0xAE;
  var TK_RIGHTANGLE = 0xAF;
  var TK_DOUBLELEFTBRACE = 0xB0;
  var TK_DOUBLERIGHTBRACE = 0xB1;
  var TK_STRPREFIX = 0xB2;
  var TK_STRMIDDLE = 0xB3;
  var TK_STRSUFFIX = 0xB4;

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
    case TK_LEFTANGLE: return "a '<'";
    case TK_RIGHTANGLE: return "a '>'";
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
      tk = ctx.scan.start(ctx);
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

  function nul(ctx, cc) {
    eat(ctx, TK_NULL);
    cc.cls = "number";
    Ast.nul(ctx);
    return cc;
  }

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

  function string(ctx, cc) {
    eat(ctx, TK_STR);
    var coord = getCoord(ctx);
    cc.cls = "string";
    Ast.string(ctx, lexeme.substring(1,lexeme.length-1), coord) // strip quotes;
    return cc;
  }

  /*
  Str :
    STR
    STRPREFIX StrSuffix

  StrSuffix :
    Expr STRMIDDLE StrSuffix
    Expr STRSUFFIX
  */

  function str(ctx, cc) {
    if (match(ctx, TK_STR)) {
      eat(ctx, TK_STR);
      var coord = getCoord(ctx);
      Ast.string(ctx, lexeme, coord); // strip quotes;
      cc.cls = "string";
      return cc;
    } else if (match(ctx, TK_STRPREFIX)) {
      ctx.state.inStr++;
      eat(ctx, TK_STRPREFIX);
      startCounter(ctx);
      var coord = getCoord(ctx);
      Ast.string(ctx, lexeme, coord) // strip quotes;
      countCounter(ctx);
      var ret = function(ctx) {
        return strSuffix(ctx, function (ctx) {
          ctx.state.inStr--;
          eat(ctx, TK_STRSUFFIX);
          var coord = getCoord(ctx);
          Ast.string(ctx, lexeme, coord) // strip quotes;
          countCounter(ctx);
          Ast.list(ctx, ctx.state.exprc, getCoord(ctx));
          stopCounter(ctx);
          Ast.concat(ctx);
          cc.cls = "string";
          return cc;
        });
      }
      ret.cls = "string";
      return ret;
    }
    assert(false);
  }
  function strSuffix(ctx, resume) {
    if (match(ctx, TK_STRSUFFIX)) {
      // We have a STRSUFFIX so we are done.
      return resume;
    }
    return strPart(ctx, function (ctx) {
      if (match(ctx, TK_STRMIDDLE)) {
        // Not done yet.
        eat(ctx, TK_STRMIDDLE);
        var coord = getCoord(ctx);
        Ast.string(ctx, lexeme, coord) // strip quotes;
        countCounter(ctx);
        var ret = function (ctx) {
          return strSuffix(ctx, resume);
        };
        ret.cls = "string";
        return ret;
      }
      var ret = function (ctx) {
        return strSuffix(ctx, resume);
      };
      ret.cls = "string";
      return ret;
    });
  }
  function strPart(ctx, resume) {
    return expr(ctx, function(ctx) {
      countCounter(ctx);
      return resume(ctx);
    });
  }
  function ident(ctx, cc) {
    eat(ctx, TK_IDENT);
    Ast.name(ctx, lexeme, getCoord(ctx));
    cc.cls = "variable";
    return cc;
  }
  function identOrString(ctx, cc) {
    if (match(ctx, TK_IDENT)) {
      return ident(ctx, cc);
    }
    if (match(ctx, TK_NUM)) {
      return number(ctx, cc);
    }
    return str(ctx, cc);
  }
  function defList(ctx, resume) {
    eat(ctx, TK_LEFTBRACKET);
    var ret = (ctx) => {
      return params(ctx, TK_RIGHTBRACKET, (ctx) => {
        eat(ctx, TK_RIGHTBRACKET);
        Ast.list(ctx, ctx.state.paramc, null, true);
        ctx.state.paramc = 1;
        return resume;
      });
    };
    ret.cls = "punc";
    return ret;
  }
  function defName(ctx, cc) {
    if (match(ctx, TK_LEFTBRACKET)) {
      return defList(ctx, cc);
    } else {
      eat(ctx, TK_IDENT);
      env.addWord(ctx, lexeme, {
        tk: TK_IDENT,
        cls: "val",
        name: lexeme,
        offset: ctx.state.paramc,
        nid: 0,
      });
      Ast.name(ctx, lexeme, getCoord(ctx));
      cc.cls = "val";
      return cc;
    }
  }
  function name(ctx, cc) {
    eat(ctx, TK_IDENT);
    var coord = getCoord(ctx);
    var word = env.findWord(ctx, lexeme);
    if (word) {
      cc.cls = word.cls;
      if (word.cls==="number" && word.val) {
        Ast.number(ctx, word.val, coord);
      } else if (word.cls==="string" && word.val) {
        Ast.string(ctx, word.val, coord);
      } else {
        if (word.nid) {
          Ast.push(ctx, word.nid);
        } else {
          Ast.name(ctx, lexeme, coord);
        }
      }
    } else {
      cc.cls = "comment";
      addError(ctx, "Name '" + lexeme + "' not found.");
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
  function lambda(ctx, cc) {
    eat(ctx, TK_LEFTANGLE);
    var ret = function (ctx) {
      ctx.state.paramc = 0;
      env.enterEnv(ctx, "lambda");
      return params(ctx, TK_COLON, function (ctx) {
        eat(ctx, TK_COLON);
        var ret = function(ctx) {
          return exprsStart(ctx, TK_RIGHTANGLE, function (ctx) {
            eat(ctx, TK_RIGHTANGLE);
            var nid = Ast.pop(ctx);   // save body node id for aliased code
            Ast.lambda(ctx, topEnv(ctx), nid);
            env.exitEnv(ctx);
            return cc
          });
        };
        ret.cls = "punc"
        return ret
      });
    };
    return ret;
  }
  function parenExpr(ctx, cc) {
    let coord = getCoord(ctx);
    eat(ctx, TK_LEFTPAREN);
    var ret = function(ctx) {
      return exprsStart(ctx, TK_RIGHTPAREN, function (ctx) {
        eat(ctx, TK_RIGHTPAREN);
        coord.to = getCoord(ctx).to;
        Ast.parenExpr(ctx, coord);
        cc.cls = "punc";
        return cc;
      })
    }
    ret.cls = "punc";
    return ret;
  }
  function list(ctx, cc) {
    let coord = getCoord(ctx);
    eat(ctx, TK_LEFTBRACKET);
    startCounter(ctx);
    var ret = function(ctx) {
      return elements(ctx, function (ctx) {
        eat(ctx, TK_RIGHTBRACKET);
        coord.to = getCoord(ctx).to;
        Ast.list(ctx, ctx.state.exprc, coord);
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
    });
  }
  function element(ctx, resume) {
    return expr(ctx, function(ctx) {
      countCounter(ctx);
      return resume(ctx);
    });
  }
  function primaryExpr(ctx, cc) {
    if (match(ctx, TK_NUM)) {
      return number(ctx, cc);
    } else if (match(ctx, TK_STR) || match(ctx, TK_STRPREFIX)) {
      return str(ctx, cc);
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
    } else if (match(ctx, TK_LEFTANGLE)) {
      return lambda(ctx, cc);
    }
    return name(ctx, cc);
  }
  function postfixExpr(ctx, cc) {
    return primaryExpr(ctx, function (ctx) {
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
    if (match(ctx, TK_CASE)) {
      return caseExpr(ctx, cc)
    }
    return relationalExpr(ctx, cc)
  }

  function caseExpr(ctx, cc) {
    eat(ctx, TK_CASE);
    var ret = function (ctx) {
      return expr(ctx, function (ctx) {
        startCounter(ctx);
        return ofClauses(ctx, function (ctx) {
          Ast.caseExpr(ctx, ctx.state.exprc);
          stopCounter(ctx);
          eat(ctx, TK_END);
          cc.cls = "keyword";
          return cc;
        })
      })
    }
    ret.cls = "keyword";
    return ret;
  }

  function ofClauses(ctx, cc) {
    if (match(ctx, TK_OF)) {
      return ofClause(ctx, function (ctx) {
        countCounter(ctx);
        if (match(ctx, TK_OF)) {
          return ofClauses(ctx, cc);
        }
        return cc(ctx);
      });
    }
    return cc(ctx);
  }

  function ofClause (ctx, cc) {
    eat(ctx, TK_OF);
    var ret = function (ctx) {
      return pattern(ctx, function (ctx) {
        eat(ctx, TK_COLON);
        var ret = function(ctx) {
          return exprsStart(ctx, TK_OF, function(ctx) {
            Ast.ofClause(ctx);
            return cc(ctx);
          });
        }
        ret.cls = "punc";
        return ret;
      });
    }
    ret.cls = "keyword";
    return ret;
  }

  function pattern(ctx, cc) {
    // FIXME only matches idents and literals for now
    return identOrString(ctx, cc);
  }

  function thenClause(ctx, cc) {
    eat(ctx, TK_THEN)
    var ret = function (ctx) {
      return exprsStart(ctx, TK_ELSE, function (ctx) {
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
    eat(ctx, TK_ELSE)
    var ret = function (ctx) {
      return exprsStart(ctx, TK_END, cc)
    }
    ret.cls = "keyword"
    return ret
  }

  function expr(ctx, cc) {
    var ret;
    if (match(ctx, TK_LET)) {
      ret = letDef(ctx, cc);
    } else {
      ret = condExpr(ctx, cc);
    }
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
      || match(ctx, TK_DOT);
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

  function exprsStart(ctx, brk, cc) {
    startCounter(ctx);
    return exprs(ctx, brk, cc);
  }

  function exprsFinish(ctx, cc) {
    Ast.exprs(ctx, ctx.state.exprc)
    stopCounter(ctx)
    return cc(ctx)
  }

  function exprs(ctx, brk, cc) {
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
          return exprs(ctx, brk, cc);
        }
        ret.cls = "punc";
        return ret;
      } else if (match(ctx, brk)) {
        var ret = function (ctx) {
          return exprsFinish(ctx, cc);
        }
        ret.cls = "punc";
        return ret;
      } else {
        if (emptyInput(ctx) || emptyExpr(ctx)) {
          return exprsFinish(ctx, cc);
        }
        return exprs(ctx, brk, cc);
      }
      return exprsFinish(ctx, cc);
    });
  }

  function program(ctx, cc) {
    return exprsStart(ctx, TK_DOT, function (ctx) {
      var nid;
      while (Ast.peek(ctx) !== nid) {
        var nid = Ast.pop(ctx);
        folder.fold(ctx, nid)  // fold the exprs on top
      }
      Ast.exprs(ctx, ctx.state.nodeStack.length, true);
      Ast.program(ctx);
      assert(cc===null, "internal error, expecting null continuation");
      return cc;
    });
  }

  window.gcexports.program = program;

  /*

    fn = { head, body }

   */

  function letDef(ctx, cc) {
    if (match(ctx, TK_LET)) {
      eat(ctx, TK_LET);
      var ret = function (ctx) {
        var ret = defName(ctx, function (ctx) {
          var name = Ast.node(ctx, Ast.pop(ctx)).elts[0];
          // nid=0 means def not finished yet
          env.addWord(ctx, name, {
            tk: TK_IDENT,
            cls: "function",
            length: 0,
            nid: 0,
            name: name
          });
          ctx.state.paramc = 0;
          env.enterEnv(ctx, name);  // FIXME need to link to outer env
          return params(ctx, TK_EQUAL, function (ctx) {
            var func = env.findWord(ctx, topEnv(ctx).name);
            func.length = ctx.state.paramc;
            func.env = topEnv(ctx);
            eat(ctx, TK_EQUAL);
            var ret = function(ctx) {
              return exprsStart(ctx, TK_DOT, function (ctx) {
                var def = env.findWord(ctx, topEnv(ctx).name);
                def.nid = Ast.peek(ctx);   // save node id for aliased code
                env.exitEnv(ctx);
                Ast.letDef(ctx);  // Clean up stack
                return cc;
              });
            }
            ret.cls = "punc";
            return ret;
          })
        })
        ret.cls = "def";
        return ret;
      }
      ret.cls = "keyword";
      return ret;
    }
    return name(ctx, cc);
  }

  // TODO add argument for specifying the break token.
  // e.g. TK_EQUAL | TK_VERTICALBAR
  // params(ctx, brk, resume) {..}
  function params(ctx, brk, cc) {
    if (match(ctx, brk)) {
      return cc
    }
    var ret = function (ctx) {
      var ret = defName(ctx, (ctx) => {
        Ast.pop(ctx); // Throw away name.
        ctx.state.paramc++;
        return params(ctx, brk, cc);
      });
      ret.cls = "param";
      return ret;
    };
    ret.cls = "param";
    return ret;
  }

  function param(ctx, cc) {
    return primaryExpr(ctx, function (ctx) {
      return cc
    });
  }

  // Drive the parser

  function compileCode(ast, postCode) {
    const gcexports = window.gcexports;
    lastAST = ast;
    ast = JSON.stringify(ast);
    var src = gcexports.editor.getValue();
    // HACK need general support for unicode.
    src = src.replace(/[\u2212]/g, "-");
    ast = ast.replace(/[\u2212]/g, "-");
    $.ajax({
      type: "POST",
      url: "/code",
      data: {
        "id": postCode ? null : gcexports.id,
        "forkID": gcexports.forkID || 0,
        "parent": postCode ? gcexports.id : null,
        "ast": ast,
        "type": gcexports.lexiconType,
        "language": gcexports.language,
        "src": src,
        "jwt": localStorage.getItem("accessToken"),
        "userID": localStorage.getItem("userID"),
      },
      dataType: "json",
      success: function(data) {
        var obj = data.obj;
        gcexports.lastErrors = gcexports.errors = [];
        // We have a good id, so use it.
        let ids = gcexports.decodeID(data.id);
        let codeIDs = ids.slice(0, 2);
        let dataIDs = gcexports.decodeID(gcexports.id).slice(2);
        let id = gcexports.encodeID(codeIDs.concat(dataIDs));
        gcexports.id = id;
        let location = "/" + gcexports.view + "?id=" + id;
        window.history.pushState(id, gcexports.language, location);
        console.log("/" + gcexports.view + "?id=" + codeIDs.concat(gcexports.encodeID(dataIDs)).join("+"));
        let state = {};
        state[gcexports.id] = {
          id: id,
          src: src,
          ast: ast,
          postCode: postCode,
          obj: obj,
        };
        gcexports.dispatcher.dispatch(state);
        gcexports.forkID = data.forkID;
        gcexports.editor.performLint();
        gcexports.updateMarkAndLabel(gcexports.id);
      },
      error: function(xhr, msg, err) {
        console.log("ERROR " + msg + " " + err);
        let state = {};
        state[gcexports.id] = {
          status: xhr.status,
          message: msg,
          error: err,
        };
        gcexports.dispatcher.dispatch(state);
      }
    });
  }

  function saveSrc() {
    if (window.gcexports.errors.length) {
      console.log("saveSrc() errors=" + JSON.stringify(window.gcexport.errors));
      return;
    }
    // Update SRC for a given ID.
    var id = window.gcexports.id;
    let ids = window.gcexports.decodeID(id);
    let codeID = ids[1];
    var src = window.gcexports.editor.getValue();
    $.ajax({
      type: "PUT",
      url: "/code",
      data: {
        "id": codeID,
        "src": src,
      },
      dataType: "json",
      success: function(data) {
      },
      error: function(xhr, msg, err) {
        console.log("ERROR " + msg + " " + err);
      }
    });
  }

  function topEnv(ctx) {
    return ctx.state.env[ctx.state.env.length-1];
  }

  window.gcexports.topEnv = topEnv;
  window.gcexports.firstTime = true;
  var lastAST;
  var lastTimer;
  function parse(stream, state, resume) {
    var ctx = {
      scan: scanner(stream, state.env[0].lexicon),
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
        if (resume) {
          // FIXME make all paths go through a resume function.
          if (state.errors.length > 0) {
            resume(state.errors);
          } else {
            resume(null, Ast.poolToJSON(ctx));
          }
        } else if (state.errors.length === 0) {
          window.gcexports.errors = [];
          var thisAST = Ast.poolToJSON(ctx);
          if (lastTimer) {
            // Reset timer to wait another second pause.
            window.clearTimeout(lastTimer);
          }
          if (JSON.stringify(lastAST) !== JSON.stringify(thisAST)) {
            // Compile code if not first time (newly loaded) and no edit
            // activity after 1 sec.
            if (!window.gcexports.firstTime) {
              lastTimer = window.setTimeout(function () {
                if (gcexports.errors && gcexports.errors.length === 0) {
                  compileCode(thisAST, true);
                }
              }, 1000);
            }
            window.gcexports.firstTime = false;
          } else {
            // The AST hasn't changed, but the text has so save the code.
            lastTimer = window.setTimeout(function () {
              window.gcexports.errors = window.gcexports.lastErrors;
              window.gcexports.editor.performLint();
              saveSrc();
            }, 1000);
          }
        } else {
          window.gcexports.errors = state.errors;
        }
      }
      var c;
      while ((c = stream.peek()) &&
           (c===' ' || c==='\t')) {
        stream.next()
      }
    } catch (x) {
      if (x instanceof Error) {
        next(ctx)
        addError(ctx, x.message);
        state.cc = null;  // done for now.
        cls = "error"
        console.log(x.stack);
        if (resume) {
          resume(window.gcexports.errors);
        }
      } else if (x === "comment") {
        cls = x
      } else {
        //throw x
        next(ctx)
        cls = "error"
        console.log(x.stack);
      }
    }
    var t1 = new Date;
    parseCount++
    parseTime += t1 - t0
    window.gcexports.coords = state.coords;
    return cls;
  }

  var lexeme = ""

  function scanner(stream, globalLexicon) {

    return {
      start: start ,
      stream: stream,
      lexeme: function () {
        return lexeme
      }
    }

    // begin private functions

    function peekCC() {
      return stream.peek() && stream.peek().charCodeAt(0) || 0;
    }

    function nextCC() {
      return stream.peek() && stream.next().charCodeAt(0) || 0;
    }

    function start(ctx) {
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
          if (isNumeric(stream.peek())) {
            return number(c);
          }
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
        case 60: // left angle
          lexeme += String.fromCharCode(c);
          return TK_LEFTANGLE
        case 62: // right angle
          lexeme += String.fromCharCode(c);
          return TK_RIGHTANGLE
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
          if (ctx.state.inStr) {
            return stringSuffix(ctx);
          }
          return TK_RIGHTBRACE
        case CC_DOUBLEQUOTE:
        case CC_SINGLEQUOTE:
        case CC_BACKTICK:
          return string(ctx, c)

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
          } else if (isNumeric(c) || c === '.'.charCodeAt(0) && isNumeric(stream.peek())) {
            //lex += String.fromCharCode(c);
            //c = src.charCodeAt(curIndex++);
            //return TK_NUM;
            return number(c);
          } else {
            return 0;
          }
        }
      }

      return 0;
    }

    function isNumeric(c) {
      if (typeof c === "string") {
        c = c.charCodeAt(0);
      }
      return c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0);
    }

    function number(c) {
      // 123, 1.23, .123
      while (isNumeric(c) || c === '.'.charCodeAt(0) && isNumeric(stream.peek())) {
        lexeme += String.fromCharCode(c);
        var s;
        c = (s = stream.next()) ? s.charCodeAt(0) : 0
      }
      if (c) {
        stream.backUp(1);
      }  // otherwise, we are at the end of stream
      return TK_NUM;
    }

    // "abc" --> "abc"
    // "a${x}c" --> concat ["a", x, "b"]
    function string(ctx, c) {
      var quoteChar = c;
      ctx.state.quoteCharStack.push(c);
      lexeme += String.fromCharCode(c)
      c = nextCC();
      while (c !== quoteChar && c !== 0 &&
            (quoteChar === CC_BACKTICK || !(c === CC_DOLLAR && peekCC() === CC_LEFTBRACE))) {
        lexeme += String.fromCharCode(c);
        var s;
        c = nextCC();
      }
      if (c === CC_DOLLAR &&
          peekCC() === CC_LEFTBRACE) {
        nextCC(); // Eat CC_LEFTBRACE
        lexeme = lexeme.substring(1);  // Strip off punct.
        return TK_STRPREFIX;
      } else if (c) {
        lexeme = lexeme.substring(1);  // Strip off leading quote.
        return TK_STR;
      } else {
        return 0
      }
    }

    function stringSuffix(ctx) {
      var c, s;
      var quoteCharStack = ctx.state.quoteCharStack;
      var quoteChar = quoteCharStack[quoteCharStack.length - 1];
      c = nextCC();
      while (c !== quoteChar && c !== 0 &&
             !(c === CC_DOLLAR &&
               peekCC() === CC_LEFTBRACE)) {
        lexeme += String.fromCharCode(c);
        c = nextCC();
      }
      if (c === CC_DOLLAR &&
          peekCC() === CC_LEFTBRACE) {
        nextCC() ; // Eat brace.
        lexeme = lexeme.substring(1);  // Strip off leading brace and trailing brace.
        return TK_STRMIDDLE;
      } else if (c) {
        quoteCharStack.pop();
        lexeme = lexeme.substring(1);  // Strip off leading braces.
        return TK_STRSUFFIX;
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

      var tk = TK_IDENT
      if (keywords[lexeme]) {
        tk = keywords[lexeme].tk;
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

  window.gcexports.parse = parser.parse
  if (window.isSynthetic) {
    // Export in node.
    exports.parse = window.gcexports.parse;
    exports.StringStream = window.gcexports.StringStream;
    exports.program = program;
  }

  return parser
})(); // end parser

var foldTime = 0

window.gcexports.foldTime = function () {
  return foldTime
}

var folder = function() {
  var _ = window.gcexports._;

  var table = {
    "PROG" : program,
    "EXPRS" : exprs,
    "PAREN" : parenExpr,
    "IDENT" : ident,
    "BOOL" : bool,
    "NUM" : num,
    "STR" : str,
    "PARENS" : unaryExpr,
    "APPLY" : apply,
    "LAMBDA" : lambda,
    // "MUL": mul,
    // "DIV": div,
    // "SUB": sub,
    "ADD": add,
    "POW": pow,
    "MOD": mod,
    "CONCAT": concat,
    // "OR": orelse,
    // "AND": andalso,
    // "NE": ne,
    // "EQ": eq,
    // "LT": lt,
    // "GT": gt,
    // "LE": le,
    // "GE": ge,
    "NEG": neg,
    "LIST": list,
    // "CASE": caseExpr,
    // "OF": ofClause,
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
      // Have a primitive operation so apply it to construct a new node.
      var ret = table[node.tag](node);
      return ret;
    }
    expr(node);
  }

  function isArray(v) {
    return v instanceof Array;
  }

  function isString(v) {
    return typeof v === "string";
  }

  function isPrimitive(v) {
    return (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    );
  }

  function isFunction(v) {
    return v instanceof Function;
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
//      if (Ast.intern(expr) === Ast.intern(pattern)) {
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
  function pushNodeStack(ctx) {
    ctx.state.nodeStackStack.push(ctx.state.nodeStack);
    ctx.state.nodeStack = [];
  }
  function popNodeStack(ctx) {
    var stack = ctx.state.nodeStack;
    ctx.state.nodeStack = ctx.state.nodeStackStack.pop().concat(stack);
  }

  function list(node) {
    // Fold list
    // for (var i = 0; i < node.elts.length; i++) {
    //   visit(node.elts[i]);
    // }
    pushNodeStack(ctx);
    for (var i = node.elts.length - 1; i >= 0; i--) {
      visit(node.elts[i]);  // Keep original order.
    }
    Ast.list(ctx, ctx.state.nodeStack.length, null, true);
    popNodeStack(ctx);
  }

  function exprs(node) {
    // Fold exprs in reverse order to get precedence right.
    for (var i = node.elts.length - 1; i >= 0; i--) {
      visit(node.elts[i]);  // Keep original order.
    }
    ctx.state.exprc = node.elts.length;
  }

  function lambda(node) {
    // Fold initializers and apply args.
    var inits = Ast.node(ctx, node.elts[3]).elts;
    inits.forEach((init, i) => {
      if (init) {
        // If we have an init then fold it and replace in inits list.
        folder.fold(ctx, Ast.intern(ctx, init));
        inits[i] = Ast.pop(ctx);
      }
    });
    // FIXME don't patch old node. construct a new one.
    node.elts[3] = Ast.intern(ctx, {tag: "LIST", elts: inits});
    var fnId = Ast.intern(ctx, node);
    var argc = ctx.state.nodeStack.length;
    Ast.apply(ctx, fnId, argc);
  }

  function apply(node) {
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.applyLate(ctx, node.elts.length);
  }

  function expr(node) {
    // Construct an expression node for the compiler.
    Ast.name(ctx, node.tag, getCoord(ctx));
    for (var i = node.elts.length-1; i >= 0; i--) {
      visit(node.elts[i]);
    }
    Ast.expr(ctx, node.elts.length);
  }

  function neg(node) {
    visit(node.elts[0]);
    Ast.neg(ctx);
  }

  function parenExpr(node) {
    pushNodeStack(ctx);
    visit(node.elts[0]);
    Ast.parenExpr(ctx);
    popNodeStack(ctx);
  }

  function unaryExpr(node) {
    visit(node.elts[0]);
    Ast.unaryExpr(ctx, node.tag);
  }

  function add(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.add(ctx);
  }

  function sub(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.sub(ctx);
  }

  function mul(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.mul(ctx);
  }

  function div(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.div(ctx);
  }

  function pow(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.pow(ctx);
  }

  function concat(node) {
    visit(node.elts[0]);
    Ast.concat(ctx);
  }

  function mod(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.mod(ctx);
  }

  function orelse(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.orelse(ctx);
  }

  function andalso(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.andalso(ctx);
  }

  function eq(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.eq(ctx);
  }

  function ne(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.ne(ctx);
  }

  function lt(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.lt(ctx);
  }

  function gt(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.gt(ctx);
  }

  function le(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.le(ctx);
  }

  function ge(node) {
    visit(node.elts[0]);
    visit(node.elts[1]);
    Ast.ge(ctx);
  }

  function ident(node) {
    var name = node.elts[0];
    var word = env.findWord(ctx, name);
    if (word) {
      if (word.cls==="val") {
        if (word.val) {
          Ast.push(ctx, word.val);
          visit(Ast.pop(ctx));      // reduce the val expr
        } else if (word.nid) {
          var wrd;
          if ((wrd = Ast.node(ctx, word.nid)).tag === "LAMBDA") {
            var argc = wrd.elts[0].elts.length;
            Ast.apply(ctx, word.nid, argc);
          } else {
            Ast.push(ctx, word.nid);
          }
        } else if (word.name) {
          Ast.push(ctx, node);
        } else {
          // push the original node to be resolved later.
          Ast.push(ctx, node);
        }
      } else if (word.cls==="function") {
        let coord = getCoord(ctx);
        var elts = [];
        for (var i = 0; i < word.length; i++) {
          var elt = Ast.pop(ctx);
          elts.push(elt);
        }
        if (word.nid) {
          Ast.fold(ctx, word, elts);
        } else {
          Ast.push(ctx, {
            tag: word.name,
            elts: elts,
            coord: coord,
          });
          folder.fold(ctx, Ast.pop(ctx));
        }
      } else {
        assert(false);
      }
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


if (typeof exports !== "undefined") {
  exports.parser = window.gcexports.parser;
}
