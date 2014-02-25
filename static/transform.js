/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2014, Art Compiler LLC */

var _ = require("underscore");

if (!this.GraffitiCode) {
  this.GraffitiCode = GraffitiCode = {};
  console.log("transform making GraffitiCode");
}

/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DEBUG = true;
var TEST = true;
var assert = (function () {
  return DEBUG ?
    function () { } :
    function (val, str) {
      if ( str === void 0 ) {
        str = "failed!";
      }
      if ( !val ) {
        try {
          throw(new Error("assert: " + str));
        } catch (e) {
          throw e + "\n" + e.stack;
        }
      }
    }
})();

/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var global = this;

var trace = (function () {
  return !DEBUG ?
    function () { } :
    function trace(str) {
      if (global.console && global.console.log) {
        console.log(str);
      } else if (global.print) {
        print(str);
      } else {
        console.log(str);
//        throw "No trace function defined!";
      }
    }
})();
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
  This module implements the node factory for abstract syntax trees (AST).

  Each node inherits an Ast instance as it prototype.

  All Ast instances share the same node pool and therefore intern trees of
  identical structure to the same node id.

  Construct new nodes using the following forms:
    ast.create("+").arg(10).arg(20);
    ast.create("+", [10, 20]);
    ast.create({op: "+", args: [10, 20]});

  Node manipulation functions are chainable.

 */

var Ast = (function () {

  // Pool of nodes. Shared between all Ast instances.
  var nodePool = [ "unused" ];  // nodePool[0] is reserved

  // Maps for fast lookup of nodes. Shared betwen all Ast instances.
  var numberMap = {};
  var stringMap = {};
  var nodeMap = {};

  function Ast() {
  }

  Ast.clearPool = function () {
    nodePool = ["unused"];
    numberMap = {};
    stringMap = {};
    nodeMap = {};
  }

  // Create a node for operation 'op'
  Ast.prototype.create = function create(op, args) {
    // Create a node that inherits from Ast
    var node = Object.create(this);
    if (typeof op === "string") {
      node.op = op;
      if (args instanceof Array) {
        node.args = args;
      } else {
        node.args = [];
      }
    } else if (op !== null && typeof op === "object") {
      var obj = op;
      Object.keys(obj).forEach(function (v, i) {
        node[v] = obj[v];
      });
    }
    return node;
  }

  // Append node to this node's args.
  Ast.prototype.arg = function arg(node) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    this.args.push(node);
    return this;
  }

  // Get or set the Nth arg of this node.
  Ast.prototype.argN = function argN(i, node) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    if (node === undefined) {
      return this.args[i];
    }
    this.args[i] = node;
    return this;
  }

  // Get or set the args of this node.
  Ast.prototype.args = function args(args) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    if (args === undefined) {
      return this.args;
    }
    this.args = args;
    return this;
  }

  // Check if obj is a value node object [private]
  Ast.prototype.isNode = isNode;

  function isNode(obj) {
    if (obj === undefined) {
      obj = this;
    }
    return obj.op && obj.args;
  }

  // Intern an AST into the node pool and return its node id.
  Ast.intern = Ast.prototype.intern = function intern(node) {
    if (this instanceof Ast &&
        node === undefined &&
        isNode(this)) {
      // We have an Ast that look like a node
      node = this;
    }
    // Intern primitive values and construct nodes for them.
    if (typeof node === "number") {
      node = {op: "num", args: [node]};
    } else if (typeof node === "string") {
      node = {op: "str", args: [node]};
    }
    assert(typeof node === "object", "node not an object");
    var op = node.op;
    var count = node.args.length;
    var args = "";
    var args_nids = [ ];
    for (var i=0; i < count; i++) {
      if (node.op === "num" || node.op === "str") {
        args += args_nids[i] = node.args[i];
      } else {
        args += args_nids[i] = intern(node.args[i]);
      }
    }
    var key = op + count + args;
    var nid = nodeMap[key];
    if (nid === void 0) {
      nodePool.push({
        op: op,
        args: args_nids,
      });
      nid = nodePool.length - 1 ;
      nodeMap[key] = nid;
    }
    return nid;
  };

  // Get a node from the node pool.
  Ast.prototype.node = function node(nid) {
    var n = JSON.parse(JSON.stringify(nodePool[nid]));
    var node = this.create(n);
    // if literal, then unwrap.
    switch (n.op) {
    case "num":
    case "str":
      n = n.args[0];
      break;
    default:
      for (var i=0; i < n.args.length; i++) {
        n.args[i] = node(n.args[i]);
      }
      break;
    }
    return n;
  };

  // Dump the contents of the node pool.
  Ast.dumpAll = Ast.prototype.dumpAll = function dumpAll() {
    var s = "";
    var ast = this;
    
    nodePool.forEach(function (n, i) {
      s += "\n" + i + ": " + Ast.dump(n);
    });
    return s;
  };

  // Dump the contents of a node.
  Ast.dump = Ast.prototype.dump = function dump(n) {
    if (typeof n === "string") {
      var s = "\""+n+"\"";
    } else if (typeof n === "number") {
      var s = n;
    } else {
      var s = "{ op: \"" + n.op + "\", args: [ ";
      for (var i=0; i < n.args.length; i++) {
        if (i > 0) {
          s += " , ";
        }
        s += dump(n.args[i]);
      }
      s += " ] }";
    }
    return s;
  };

  // Self tests
  function test() {
    (function () {
      trace("Ast self testing");
      var ast = new Ast();
      var node1 = {op: "+", args: [10, 20]};
      var node2 = {op: "+", args: [10, 30]};
      var node3 = {op: "num", args: [10]};
      var node4 = ast.create("+").arg(10).arg(30);
      var node5 = ast.create("+", [10, 20]);
      var node6 = ast.create({op: "+", args: [10, 20]});
      var nid1 = ast.intern(node1);
      var nid2 = ast.intern(node2);
      var nid3 = ast.intern(node3);
      var nid4 = node4.intern();
      var nid5 = node5.intern();
      var nid6 = node6.intern();
      var result = nid2 === nid4 ? "PASS" : "FAIL";
      trace(result + ": " + "nid2 === nid4");
      var result = nid1 === nid5 ? "PASS" : "FAIL";
      trace(result + ": " + "nid1 === nid5");
      var result = nid5 === nid6 ? "PASS" : "FAIL";
      trace(result + ": " + "nid5 === nid6");
      trace(ast.dumpAll());
    })();
  }
  if (TEST) {
    test();
  }

  return Ast;
})();
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
  This module defines an object model for evaluating and comparing LaTex
  strings. The primary data structure is the Model class. Instances of the
  Model class contain an AST (Ast instance) and zero or more plugins that
  provide functions for evaluating, transforming and comparing models.

  Basic Terms

  Node - a node is a raw JavaScript object that consists of an 'op' property
  that is a string indicating the node type, an 'args' property that is an array
  that holds the operands of the operation, and any other "attribute" properties
  used by plugins to elaborate the mean meaning of the node.

  AST - an AST is an a Node that is an instance of the Ast class. The Ast class
  provides methods for constructing and managing nodes.

  Model - a model is a Node that is an instance of the Model class, which
  inherits from the Ast class. The model class adds methods for creating nodes
  from LaTex strings and rendering them to LaTex strings. Model values are
  configured by Model plugins that implement operations for evaluating,
  transforming and comparing nodes.

  Overview

  Every model object is also a factory for other model objects that share
  the same set of plugins.

    Model.fn.isEquivalent; // register plugin function
    var model = new Model;
    var expected = model.create("1 + 2");
    var actual = model.create(response);
    model.isEquivalent(expected, actual);
    expected.isEquivalent(actual);

  When all models in a particular JavaScript sandbox (global scope) use the same
  plugins, those plugins can be registered with the Model class as default
  plugins, as follows:

*/

var Model = (function () {

  function error(str) {
    trace("error: " + str);
  }

  function Model() {
  }

  Model.fn = {};

  var Mp = Model.prototype = new Ast();

  // Create a model from a node object or expression string
  Model.create = Mp.create = function create(node) {
    assert(node, "Model.create() called with invalid argument: " + node);
    if (!(this instanceof Model)) {
      return new Model().create(node);
    }
    // Create a node that inherits from Ast
    var model = Object.create(this);
    if (typeof node === "string") {
      // Got a string, so parse it into a node
      node = parse(node).expr();
    } else {
      // Make a deep copy of the node
      node = JSON.parse(JSON.stringify(node));
    }
    // Add missing plugin functions to the Model prototype
    Object.keys(Model.fn).forEach(function (v, i) {
      if (!Mp.hasOwnProperty(v)) {
        Mp[v] = function () {
          var fn = Model.fn[v];
          if (arguments.length > 1 &&
              arguments[1] instanceof Model) {
            return fn.apply(this, arguments);
          } else {
            var args = [this];
            for (var i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }
            return fn.apply(this, args);
          }
        }
      }
    });
    // Now copy the node's properties into the model object
    Object.keys(node).forEach(function (v, i) {
        model[v] = node[v];
    });
    return model;
  };

  // Create a Model node from LaTex source.
  Model.fromLaTex = Mp.fromLaTex = function fromLaTex(src) {
    assert(typeof src === "string", "Model.prototype.fromLaTex");
    if (!this) {
      return Model.create(src);
    }
    return this.create(src);
  }

  // Render LaTex from the model node.
  Mp.toLaTeX = function toLaTeX(node) {
    return render(node);
  }

  var OpStr = {
    ADD: "+",
    SUB: "-",
    MUL: "times",
    DIV: "div",
    FRAC: "frac",
    EQL: "=",
    ATAN2: "atan2",
    SQRT: "sqrt",
    PM: "pm",
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    SEC: "sec",
    COT: "cot",
    CSC: "csc",
    LN: "ln",
    VAR: "var",
    NUM: "num",
    CST: "cst",
    COMMA: ",",
    POW: "^",
    ABS: "abs",
    PAREN: "()",
    HIGHLIGHT: "hi",
  };

  Object.keys(OpStr).forEach(function (v, i) {
    Model[v] = OpStr[v];
  });
    
  var OpToLaTeX = {};
  OpToLaTeX[OpStr.ADD] = "+";
  OpToLaTeX[OpStr.SUB] = "-";
  OpToLaTeX[OpStr.MUL] = "\\times";
  OpToLaTeX[OpStr.DIV] = "\\div";
  OpToLaTeX[OpStr.FRAC] = "\\frac";
  OpToLaTeX[OpStr.EQL] = "=";
  OpToLaTeX[OpStr.ATAN2] = "\\atan2";
  OpToLaTeX[OpStr.POW] = "^";
  OpToLaTeX[OpStr.PM] = "\\pm";
  OpToLaTeX[OpStr.SIN] = "\\sin";
  OpToLaTeX[OpStr.COS] = "\\cos";
  OpToLaTeX[OpStr.TAN] = "\\tan";
  OpToLaTeX[OpStr.SEC] = "\\sec";
  OpToLaTeX[OpStr.COT] = "\\cot";
  OpToLaTeX[OpStr.CSC] = "\\csc";
  OpToLaTeX[OpStr.LN] = "\\ln";
  OpToLaTeX[OpStr.COMMA] = ",";

  // Render an AST to LaTex
  var render = function render(n) {
    var text = "";
    if (typeof n === "string") {
      text = n;
    } else if (typeof n === "number") {
      text = n;
    } else if (typeof n === "object") {
      // render sub-expressions
      var args = [];
      for (var i = 0; i < n.args.length; i++) {
        args[i] = render(n.args[i]);
      }
      // render operator
      switch (n.op) {
      case OpStr.VAR:
      case OpStr.CST:
      case OpStr.NUM:
        text = n.args[0];
        break;
      case OpStr.SUB:
        if (n.args.length===1) {
          text = OpToLaTeX[n.op] + " " + args[0];
        }
        else {
          text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1];
        }
        break;
      case OpStr.DIV:
      case OpStr.PM:
      case OpStr.EQL:
        text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1];
        break;
      case OpStr.POW:
        // if subexpr is lower precedence, wrap in parens
        var lhs = n.args[0];
        var rhs = n.args[1];
        if ((lhs.args && lhs.args.length===2) || (rhs.args && rhs.args.length===2)) {
          if (lhs.op===OpStr.ADD || lhs.op===OpStr.SUB ||
            lhs.op===OpStr.MUL || lhs.op===OpStr.DIV ||
            lhs.op===OpStr.SQRT) {
            args[0] = " (" + args[0] + ") ";
          }
        }
        text = "{" + args[0] + "^{" + args[1] + "}}";
        break;
      case OpStr.SIN:
      case OpStr.COS:
      case OpStr.TAN:
      case OpStr.SEC:
      case OpStr.COT:
      case OpStr.CSC:
      case OpStr.LN:
        text = "{"+ OpToLaTeX[n.op] + "{" + args[0] + "}}";
        break;
      case OpStr.FRAC:
        text = "\\dfrac{" + args[0] + "}{" + args[1] + "}";
        break;
      case OpStr.SQRT:
        switch (args.length) {
        case 1:
          text = "\\sqrt{" + args[0] + "}";
          break;
        case 2:
          text = "\\sqrt[" + args[0] + "]{" + args[1] + "}";
          break;
        }
        break;
      case OpStr.MUL:
        // if subexpr is lower precedence, wrap in parens
        var prevTerm;
        text = "";
        n.args.forEach(function (term, index) {
          if (term.args && (term.args.length >= 2)) {
            if (term.op===OpStr.ADD || term.op===OpStr.SUB) {
              args[index] = "(" + args[index] + ")";
            }
            if (index !== 0 && typeof term === "number") {
              text += OpToLaTeX[n.op] + " ";
            }
            text += args[index];
          }
          // elide the times symbol if rhs is parenthesized or a var, or lhs is a number
          // and rhs is not a number
          else if (term.op===OpStr.PAREN ||
               term.op===OpStr.VAR ||
               term.op===OpStr.CST ||
               typeof prevTerm === "number" && typeof term !== "number") {
            text += args[index];
          }
          else {
            if (index !== 0) {
              text += " " + OpToLaTeX[n.op] + " ";
            }
            text += args[index];
          }
          prevTerm = term;
        });
        break;
      case OpStr.ADD:
      case OpStr.COMMA:
        args.forEach(function (value, index) {
          if (index===0) {
            text = value;
          }
          else {
            text = text + " "+ OpToLaTeX[n.op] + " " + value;
          }
        });
        break;
      default:
        assert(false, "unimplemented eval operator");
        break;
      }
    } else {
      assert(false, "invalid expression type");
    }
    
    return text;
  }

  var parse = function parse(src) {

    // Define lexical tokans
    var TK_NONE = 0;
    var TK_ADD = '+'.charCodeAt(0);
    var TK_CARET = '^'.charCodeAt(0);
    var TK_COS = 0x105;
    var TK_COT = 0x108;
    var TK_CSC = 0x109;
    var TK_DIV = '/'.charCodeAt(0);
    var TK_EQL = '='.charCodeAt(0);
    var TK_FRAC = 0x100;
    var TK_LN = 0x107;
    var TK_LEFTBRACE = '{'.charCodeAt(0);
    var TK_LEFTBRACKET = '['.charCodeAt(0);
    var TK_LEFTPAREN = '('.charCodeAt(0);
    var TK_MUL = '*'.charCodeAt(0);
    var TK_NUM = '0'.charCodeAt(0);
    var TK_PM = 0x102;
    var TK_RIGHTBRACE = '}'.charCodeAt(0);
    var TK_RIGHTBRACKET = ']'.charCodeAt(0);
    var TK_RIGHTPAREN = ')'.charCodeAt(0);
    var TK_SEC = 0x106;
    var TK_SIN = 0x103;
    var TK_SQRT = 0x101;
    var TK_SUB = '-'.charCodeAt(0);
    var TK_TAN = 0x104;
    var TK_VAR = 'a'.charCodeAt(0);
    var TK_COEFF = 'A'.charCodeAt(0);
    var TK_VAR = 'a'.charCodeAt(0);
    var TK_NEXT = 0x10A;

    // Define operator strings
    var OpStr = {
      ADD: "+",
      SUB: "-",
      MUL: "times",
      DIV: "div",
      FRAC: "frac",
      EQL: "=",
      ATAN2: "atan2",
      SQRT: "sqrt",
      PM: "pm",
      SIN: "sin",
      COS: "cos",
      TAN: "tan",
      SEC: "sec",
      COT: "cot",
      CSC: "csc",
      LN: "ln",
      VAR: "var",
      CST: "cst",
      COMMA: ",",
      POW: "^",
      ABS: "abs",
      PAREN: "()",
      HIGHLIGHT: "hi",
    };

    // Define mapping from token to operator
    var tokenToOperator = [];
    var T0 = TK_NONE, T1 = TK_NONE;
    tokenToOperator[TK_FRAC] = OpStr.FRAC;
    tokenToOperator[TK_SQRT] = OpStr.SQRT;
    tokenToOperator[TK_ADD] = OpStr.ADD;
    tokenToOperator[TK_SUB] = OpStr.SUB;
    tokenToOperator[TK_PM] = OpStr.PM;
    tokenToOperator[TK_CARET] = OpStr.POW;
    tokenToOperator[TK_MUL] = OpStr.MUL;
    tokenToOperator[TK_DIV] = OpStr.FRAC;
    tokenToOperator[TK_SIN] = OpStr.SIN;
    tokenToOperator[TK_COS] = OpStr.COS;
    tokenToOperator[TK_TAN] = OpStr.TAN;
    tokenToOperator[TK_SEC] = OpStr.SEC;
    tokenToOperator[TK_COT] = OpStr.COT;
    tokenToOperator[TK_CSC] = OpStr.CSC;
    tokenToOperator[TK_LN] = OpStr.LN;
    tokenToOperator[TK_EQL] = OpStr.EQL;

    var scan = scanner(src);

    function start() {
      T0 = scan.start();
    }

    function hd () {
      //assert(T0!==0, "hd() T0===0");
      return T0;
    }

    function lexeme () {
      return scan.lexeme();
    }

    function matchToken (t) {
      if (T0 == t) {
        next();
        return true;
      }
      return false;
    }

    function next () {
      T0 = T1;
      T1 = TK_NONE;
      if (T0 === TK_NONE) {
        T0 = scan.start();
      }
    }
    
    function replace (t) {
      T0 = t;
    }

    function eat (tc) {
      var tk = hd();
      if (tk !== tc) {
        assert(false, "Expecting " + tc + " found " + tk);
        error("syntax error");
      }
      next();
    }
    
    function match (tc) {
      var tk = hd();
      if (tk !== tc)
        return false;
      next();
      return true;
    }

    function primaryExpr () {
      var e;
      var t;
      var op;
      switch ((t=hd())) {
      case 'A'.charCodeAt(0):
      case TK_VAR:
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case 'a'.charCodeAt(0):
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case TK_NUM:
        e = {op: "num", args: [lexeme()]};
        next();
        break;
      case TK_LEFTPAREN:
        e = parenExpr();
        break;
      case TK_LEFTBRACE:
        e = braceExpr();
        break;
      case TK_FRAC:
        next();
        e = {op: tokenToOperator[TK_FRAC], args: [braceExpr(), braceExpr()]};
        break;
      case TK_SQRT:
        next();
        switch(hd()) {
        case TK_LEFTBRACKET:
          e = {op: tokenToOperator[TK_SQRT], args: [bracketExpr(), braceExpr()]};
          break;
        case TK_LEFTBRACE:
          e = {op: tokenToOperator[TK_SQRT], args: [braceExpr()]};
          break;
        default:
          assert(false);
          break;
        }
        break;
      case TK_SIN:
      case TK_COS:
      case TK_TAN:
      case TK_SEC:
      case TK_COT:
      case TK_CSC:
      case TK_LN:
        next();
        e = {op: tokenToOperator[t], args: [braceExpr()]};
        break;
      default:
        e = void 0;
        break;
      }
      return e;
    }

    function braceExpr() {
      eat(TK_LEFTBRACE);
      var e = commaExpr();
      eat(TK_RIGHTBRACE);
      return e;
    }

    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      var e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e;
    }

    function parenExpr() {
      eat(TK_LEFTPAREN);
      var e = commaExpr();
      eat(TK_RIGHTPAREN);
      return e;
    }

    function unaryExpr() {
      var t;
      var expr;
      switch (t = hd()) {
      case TK_ADD:
        next();
        expr = unaryExpr();
        break;
      case TK_SUB:
        next();
        expr = unaryExpr();
        expr = {op: Model.SUB, args: [expr]};
        break;
      default:
        expr = primaryExpr();
        break;
      }
      return expr;
    }

    function exponentialExpr() {
      var expr = unaryExpr();
      var t;
      while ((t=hd())===TK_CARET) {
        next();
        var expr2 = unaryExpr();
        if (expr2===1) {
          expr = expr;
        }
        else if (expr2===0) {
          expr = 1;
        }
        else {
          expr = {op: tokenToOperator[t], args: [expr, expr2]};
        }
      }

      return expr;
    }

    function multiplicativeExpr() {
      var expr = exponentialExpr();
      var t;

      while((t=hd())===TK_VAR || t===TK_LEFTPAREN) {
        var expr2 = exponentialExpr();
        if (expr2 === 1) {
          expr = expr;
        }
        else if (expr === 1) {
          expr = expr2;
        }
        else {
          expr = {op: OpStr.MUL, args: [expr, expr2]};
        }
      }

      while (isMultiplicative(t = hd())) {
        next();
        var expr2 = exponentialExpr();
        if (expr2===1) {
          expr = expr;
        }
        else if (t===TK_MUL && expr===1) {
          expr = expr2;
        }
        else {
          expr = {op: tokenToOperator[t], args: [expr, expr2]};
        }
      }
      return expr;

      function isMultiplicative(t) {
        return t===TK_MUL || t===TK_DIV;
      }
    }

    function isNeg(n) {
      if (typeof n === "number") {
        return n < 0;
      } else if (n.args.length===1) {
        return n.op===OpStr.SUB && n.args[0] > 0;  // is unary minus
      } else if (n.args.length===2) {
        return n.op===OpStr.MUL && isNeg(n.args[0]);  // leading term is neg
      }
    }

    function negate(n) {
      if (typeof n === "number") {
        return -n;
      } else if (n.args.length === 1) {
        if (n.op === Model.SUB) {
          return n.args[0];  // strip the unary minus
        } else if (n.op === Model.ADD) {
          n.args[0] = negate(n.args[0]);
          return n;
        } else if (n.op === Model.NUM || n.op === Model.VAR) {
          return {
            op: Model.MUL,
            args: [{
              op: Model.NUM, args: ["-1"]
            }, n]
          };
        }
      } else if (n.args.length === 2) {
        return {
          op: Model.SUB,
          args: [n]
        };
      }
      assert(false, "negate() op=" + n.op + " n.args.length=" + n.args.length);
      return {
        op: Model.SUB,
        args: [n]
      };
    }

    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while (isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        switch(t) {
        case TK_SUB:
          expr2 = negate(expr2);
          // fall through
        default:
          expr = {op: Model.ADD, args: [expr, expr2]};
          break;
        }
      }
      return expr;

      function isAdditive(t) {
        return t === TK_ADD || t === TK_SUB || t === TK_PM;
      }
    }

    function equalExpr() {
      var expr = additiveExpr();
      var t;
      while ((t = hd())===TK_EQL) {
        next();
        var expr2 = additiveExpr();
        expr = {op: tokenToOperator[t], args: [expr, expr2]};
      }
      return expr;
    }

    function commaExpr( ) {
      var n = equalExpr();
      return n;
    }

    function expr ( ) {
      start();
      var n = commaExpr();
      return n;
    }

    function scanner(src) {

      var curIndex = 0;
      var lexeme = "";

      var lexemeToToken = [ ];

      lexemeToToken["\\times"] = TK_MUL;
      lexemeToToken["\\div"]   = TK_DIV;
      lexemeToToken["\\dfrac"]  = TK_FRAC;
      lexemeToToken["\\frac"]  = TK_FRAC;
      lexemeToToken["\\sqrt"]  = TK_SQRT;
      lexemeToToken["\\pm"]   = TK_PM;
      lexemeToToken["\\sin"]   = TK_SIN;
      lexemeToToken["\\cos"]   = TK_COS;
      lexemeToToken["\\tan"]   = TK_TAN;
      lexemeToToken["\\sec"]   = TK_SEC;
      lexemeToToken["\\cot"]   = TK_COT;
      lexemeToToken["\\csc"]   = TK_CSC;
      lexemeToToken["\\ln"]   = TK_LN;

      return {
        start : start ,
        lexeme : function () { return lexeme } ,
      }

      function start () {
        var c;
        lexeme = "";
        while (curIndex < src.length) {
          switch ((c = src.charCodeAt(curIndex++))) {
          case 32:  // space
          case 9:   // tab
          case 10:  // new line
          case 13:  // carriage return
            continue;
          case 92:  // backslash
            lexeme += String.fromCharCode(c);
            return latex();
          case 40:  // left paren
          case 41:  // right paren
          case 42:  // asterisk
          case 43:  // plus
          case 44:  // comma
          case 45:  // dash
          case 47:  // slash
          case 61:  // equal
          case 91:  // left bracket
          case 93:  // right bracket
          case 94:  // caret
          case 123: // left brace
          case 125: // right brace
            lexeme += String.fromCharCode(c);
            return c; // char code is the token id
          default:
            if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              return TK_COEFF;
            }
            else if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              return TK_VAR;
            }
            else if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
              //lexeme += String.fromCharCode(c);
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
        while (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0) ||
               c === '.'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;
        
        return TK_NUM;
      }

      function latex() {
        var c = src.charCodeAt(curIndex++);
        while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;

        var tk = lexemeToToken[lexeme];
        if (tk===void 0) {
          tk = TK_VAR;   // e.g. \\theta
        }
        return tk;
      }
    }

    return {
      expr : expr
    };
  }

  // Self tests

  function test() {
    trace("\nModel self testing");
    (function () {
      var model = new Model();

      var node = model.fromLaTex("10 + 20");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "10 + 20" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);
      var nid1 = Model.create("10 + 20").intern();
      node.intern();
      var nid2 = Model.create({
        "op":"+",
        "args":[{
          "op": "num",
          "args": [10]
        }, {
          "op": "num",
          "args": [20]
        }]
      }).intern();
      var result = nid1 === nid2 ? "PASS" : "FAIL";
      trace(result + ": " + "Model.create() nid1=" + nid1 + " nid2=" + nid2);

      var node = Model.create("e^2");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{e^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("(x+2)(x-3)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "(x + 2)(x - 3)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("x^2+2x-1");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{x^{2}} + 2x - 1" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("e^(2pi)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("sin(2x)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("2sin(x)cos(x)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("(x+y)^2");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{ (x + y) ^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("x^2+2xy+y^2");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "{x^{2}} + 2xy + {y^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("x=2(y+1)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "x = 2(y + 1)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("x=2*y+2");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "x = 2y + 2" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("x-2=2*y");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "x - 2 = 2y" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("0.00012");
      var str = model.toLaTeX(node);
      var result = str === "0.00012" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("1.2e-4");
      var str = model.toLaTeX(node);
      var result = str === "1.2e - 4" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("3m2cm");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("302cm");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "302cm" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("45N*m");
      var str = model.toLaTeX(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str + " expected: 45Nm");

      var node = Model.create("45J");
      var str = model.toLaTeX(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str + " expected: 45J");

//      var node = Model.create("[[2,0],[0,2]]*[1,1]");
//      var str = model.toLaTeX(node);
//      var result = str === "" ? "PASS" : "FAIL";
//      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

//      var node = Model.create("{1,2,3}");
//      var str = model.toLaTeX(node);
//      var result = str === "" ? "PASS" : "FAIL";
//      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("((x)*(y))");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "xy" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("1/2");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "\\dfrac{1}{2}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("a+b+c+d+e+f");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "a + b + c + d + e + f" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

      var node = Model.create("f(n+1)");
      node.intern();
      var str = model.toLaTeX(node);
      var result = str === "f(n + 1)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTeX: " + str);

    })();
  }

  if (TEST) {
    test();
  }

  return Model;
})();

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

/*
  function BaseVisitor() {
    function visit(nid, visitor) {
      var node = nodePool[nid];
      print("visit() visitor=" + visitor["visitor-name"] + " node=" + JSON.stringify(node));
      var visit = visitor[node.tag];
      if (visit) {
        return visit(node);
      }
      var visit = baseVisitor[node.tag];
      if (visit) {
        return visit(node);
      }
      print("Visitor.visit() node=" + JSON.stringify(node));
      return node;    
    }
    function math_text(root) {
      var str = visit(root.elts[0], mathTextVisitor);
      return {
        "tag": "foreignObject",
        "width": canvasWidth,
        "height": canvasHeight,
        "elts": ["\$" + str + "\$"],
      };
    }
    function num (node) {
      return node.elts[0];
    };
    function str (node) {
      return node.elts[0];
    };
    // Visitor exports
    return {
      "visitor-name": "BaseVisitor",
      "MATH-TEXT": math_text,
      "MATH-VALUE": math_value,
      "NUM": num,
      "STR": str,
      "IDENT": str,
      "CONCAT": concat,
    }
  }
*/

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
      if (args[0].tag !== "NUM") {
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
      return args[1] + "+" + args[0];
    };
    function num (node) {
      return node.elts[0];
    };
    return {
      "visitor-name": "MathTextVisitor",
      "EXPO": expo,
      "NUM": num,
      "TIMES": times,
      "PLUS": plus,
    };
  }

  function MathValueVisitor () {
    function expo(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return Math.pow(args[1], args[0]);
    };
    function times(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return +args[1] * +args[0];
    };
    function plus(node) {
      var args = [];
      node.elts.forEach(function (arg) {
        args.push(visit(arg, mathValueVisitor));
      });
      return +args[1] + +args[0];
    };
    function num (node) {
      return +node.elts[0];
    };
    return {
      "visitor-name": "MathValueVisitor",
      "EXPO": expo,
      "NUM": num,
      "TIMES": times,
      "PLUS": plus,
    };
  }

  var mathTextVisitor = MathTextVisitor();
  var mathValueVisitor = MathValueVisitor();
  
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
    "DOT" : dot,

    "PATH" : path,
    "CLOSEPATH" : closepath,
    "MOVETO" : moveto,
    "LINETO" : lineto,
    "CURVETO" : curveto,
    "ARCTO" : arcto,
    "ARC" : arc,

    "RAND" : random,
    "PLUS" : plus,
    "CONCAT" : concat,
    "MINUS" : minus,
    "TIMES" : times,
    "FRAC" : frac,
    "EXPO" : expo,

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
  }

  return {
    transform: transform,
  };
  
  // CONTROL FLOW ENDS HERE

  var nodePool

  function transform(pool) {
    nodePool = pool;
    return visit(pool.root);
  }


  function visit(nid, visitor) {
    // Get the node from the pool of nodes.
    var node = nodePool[nid];
    print("visit() visitor=" + (visitor ? visitor["visitor-name"] : "builtins") + " node=" + JSON.stringify(node));
    if (node == null) {
      return null;
    } else if (node.tag === void 0) {
      return [ ];  // clean up stubs
    } else if (visitor) {
      var visit = visitor[node.tag];
      if (visit) {
        return visit(node);
      }
    }
    if (isFunction(table[node.tag])) {
      // There is a visitor method for this node, so call it.
      return table[node.tag](node);
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

  function concat(node) {
    print("concat() node=" + JSON.stringify(node));
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
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
    return "\\frac{" + v1 + "}{" + v2 + "}";
  }

  function expo(node) {
    var v2 = visit(node.elts[0]);
    var v1 = visit(node.elts[1]);
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
    print("dot");
    var x = visit(node.elts[1], mathValueVisitor);
    var y = visit(node.elts[0], mathValueVisitor);
    return {
      "tag": "ellipse",
      "cx": x,
      "cy": y,
      "rx": 2,
      "ry": 2,
    };
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
    var str = visit(node.elts[0], mathTextVisitor);
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
