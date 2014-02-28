/*
 * Copyright 2013 Learnosity Ltd. All Rights Reserved.
 *
 */

//define
var MathCore  = (function () {
var name = '';/*
 Copyright (c) 2012 Daniel Trebbien and other contributors
Portions Copyright (c) 2003 STZ-IDA and PTV AG, Karlsruhe, Germany
Portions Copyright (c) 1995-2001 International Business Machines Corporation and others

All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, provided that the above copyright notice(s) and this permission notice appear in all copies of the Software and that both the above copyright notice(s) and this permission notice appear in supporting documentation.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF THIRD PARTY RIGHTS. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES, OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization of the copyright holder.
*/
'use strict';var boxedString = Object("a"), splitString = boxedString[0] != "a" || !(0 in boxedString);
var forEach = function forEach(array, fun) {
  var thisp = arguments[2];
  if(Array.prototype.forEach) {
    return array.forEach(fun)
  }
  var object = toObject(array), self = splitString && _toString(object) == "[object String]" ? object.split("") : object, i = -1, length = self.length >>> 0;
  if(_toString(fun) != "[object Function]") {
    throw new TypeError;
  }
  while(++i < length) {
    if(i in self) {
      fun.call(thisp, self[i], i, object)
    }
  }
};
var filter = function filter(array, fun) {
  var thisp = arguments[2];
  if(Array.prototype.filter) {
    return array.filter(fun)
  }
  var object = toObject(array), self = splitString && _toString(array) == "[object String]" ? array.split("") : object, length = self.length >>> 0, result = [], value;
  if(_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }
  for(var i = 0;i < length;i++) {
    if(i in self) {
      value = self[i];
      if(fun.call(thisp, value, i, object)) {
        result.push(value)
      }
    }
  }
  return result
};
var every = function every(array, fun) {
  var thisp = arguments[2];
  if(Array.prototype.every) {
    return array.every(fun, thisp)
  }
  var object = toObject(array), self = splitString && _toString(array) == "[object String]" ? array.split("") : object, length = self.length >>> 0;
  if(_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }
  for(var i = 0;i < length;i++) {
    if(i in self && !fun.call(thisp, self[i], i, object)) {
      return false
    }
  }
  return true
};
var some = function some(array, fun) {
  var thisp = arguments[2];
  if(Array.prototype.some) {
    return array.some(fun, thisp)
  }
  var object = toObject(array), self = splitString && _toString(array) == "[object String]" ? array.split("") : object, length = self.length >>> 0;
  if(_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }
  for(var i = 0;i < length;i++) {
    if(i in self && fun.call(thisp, self[i], i, object)) {
      return true
    }
  }
  return false
};
var indexOf = function indexOf(array, sought) {
  var fromIndex = arguments[2];
  if(Array.prototype.indexOf) {
    return array.indexOf(sought, fromIndex)
  }
  var self = splitString && _toString(array) == "[object String]" ? array.split("") : toObject(array), length = self.length >>> 0;
  if(!length) {
    return-1
  }
  var i = 0;
  if(arguments.length > 2) {
    i = toInteger(fromIndex)
  }
  i = i >= 0 ? i : Math.max(0, length + i);
  for(;i < length;i++) {
    if(i in self && self[i] === sought) {
      return i
    }
  }
  return-1
};
var keys = function keys(object) {
  if(Object.keys) {
    return Object.keys(object)
  }
  var hasDontEnumBug = true, dontEnums = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], dontEnumsLength = dontEnums.length;
  for(var key in{"toString":null}) {
    hasDontEnumBug = false
  }
  if(typeof object != "object" && typeof object != "function" || object === null) {
    throw new TypeError("Object.keys called on a non-object");
  }
  var keys = [];
  for(var name in object) {
    if(owns(object, name)) {
      keys.push(name)
    }
  }
  if(hasDontEnumBug) {
    for(var i = 0, ii = dontEnumsLength;i < ii;i++) {
      var dontEnum = dontEnums[i];
      if(owns(object, dontEnum)) {
        keys.push(dontEnum)
      }
    }
  }
  return keys
};
var toObject = function(o) {
  if(o == null) {
    throw new TypeError("can't convert " + o + " to object");
  }
  return Object(o)
};
var prototypeOfObject = Object.prototype;
var _toString = function(val) {
  return prototypeOfObject.toString.apply(val)
};
var owns = function(object, name) {
  return prototypeOfObject.hasOwnProperty.call(object, name)
};
var create = function create(o) {
  if(Object.create) {
    return Object.create(o)
  }
  var F = function() {
  };
  if(arguments.length != 1) {
    throw new Error("Object.create implementation only accepts one parameter.");
  }
  F.prototype = o;
  return new F
};
"use strict";
var ASSERT = true;
var assert = function() {
  return!ASSERT ? function() {
  } : function(val, str) {
    if(str === void 0) {
      str = "failed!"
    }
    if(!val) {
      var err = new Error(str);
      err.location = Assert.location;
      throw err;
    }
  }
}();
var message = function(errorCode, args) {
  var str = Assert.messages[errorCode];
  var location = Assert.location;
  if(args) {
    forEach(args, function(arg, i) {
      str = str.replace("%" + (i + 1), arg)
    })
  }
  return errorCode + ": " + str
};
var reserveCodeRange = function(first, last, moduleName) {
  assert(first <= last, "Invalid code range");
  var noConflict = every(Assert.reservedCodes, function(range) {
    return last < range.first || first > range.last
  });
  assert(noConflict, "Conflicting request for error code range");
  Assert.reservedCodes.push({first:first, last:last, name:moduleName})
};
var setLocation = function(location) {
  Assert.location = location
};
var clearLocation = function() {
  Assert.location = null
};
var Assert = {assert:assert, message:message, messages:{}, reserveCodeRange:reserveCodeRange, reservedCodes:[], setLocation:setLocation, clearLocation:clearLocation};
"use strict";
var TRACE = false;
var global = this;
var trace = function() {
  return!TRACE ? function() {
  } : function trace(str) {
    if(global.console && global.console.log) {
      console.log(str)
    }else {
      if(global.print) {
        print(str)
      }else {
        throw"No trace function defined!";
      }
    }
  }
}();
"use strict";
var Ast = exports.Ast = function() {
  var nodePool = ["unused"];
  var numberMap = {};
  var stringMap = {};
  var nodeMap = {};
  function Ast() {
  }
  Ast.clearPool = function() {
    nodePool = ["unused"];
    numberMap = {};
    stringMap = {};
    nodeMap = {}
  };
  Ast.prototype.create = function create(op, args) {
    var node = create(this);
    if(typeof op === "string") {
      node.op = op;
      if(args instanceof Array) {
        node.args = args
      }else {
        node.args = []
      }
    }else {
      if(op !== null && typeof op === "object") {
        var obj = op;
        forEach(keys(obj), function(v, i) {
          node[v] = obj[v]
        })
      }
    }
    return node
  };
  Ast.prototype.arg = function arg(node) {
    if(!isNode(this)) {
      throw"Malformed node";
    }
    this.args.push(node);
    return this
  };
  Ast.prototype.argN = function argN(i, node) {
    if(!isNode(this)) {
      throw"Malformed node";
    }
    if(node === undefined) {
      return this.args[i]
    }
    this.args[i] = node;
    return this
  };
  Ast.prototype.args = function args(args) {
    if(!isNode(this)) {
      throw"Malformed node";
    }
    if(args === undefined) {
      return this.args
    }
    this.args = args;
    return this
  };
  Ast.prototype.isNode = isNode;
  function isNode(obj) {
    if(obj === undefined) {
      obj = this
    }
    return obj.op && obj.args
  }
  Ast.intern = Ast.prototype.intern = function intern(node) {
    if(this instanceof Ast && (node === undefined && isNode(this))) {
      node = this
    }
    if(typeof node === "number") {
      node = {op:"num", args:[node.toString()]}
    }else {
      if(typeof node === "string") {
        node = {op:"str", args:[node]}
      }
    }
    assert(typeof node === "object", "node not an object");
    var op = node.op;
    var count = node.args.length;
    var args = "";
    var args_nids = [];
    for(var i = 0;i < count;i++) {
      if(node.op === "str" || node.op === "num") {
        args += args_nids[i] = node.args[i]
      }else {
        args += args_nids[i] = intern(node.args[i])
      }
    }
    var key = op + count + args;
    var nid = nodeMap[key];
    if(nid === void 0) {
      nodePool.push({op:op, args:args_nids});
      nid = nodePool.length - 1;
      nodeMap[key] = nid
    }
    return nid
  };
  Ast.prototype.node = function node(nid) {
    var n = JSON.parse(JSON.stringify(nodePool[nid]));
    var node = create(n);
    switch(n.op) {
      case "num":
      ;
      case "str":
        n = n;
        break;
      default:
        for(var i = 0;i < n.args.length;i++) {
          n.args[i] = this.node(n.args[i])
        }
        break
    }
    return n
  };
  Ast.dumpAll = Ast.prototype.dumpAll = function dumpAll() {
    var s = "";
    var ast = this;
    forEach(nodePool, function(n, i) {
      s += "\n" + i + ": " + Ast.dump(n)
    });
    return s
  };
  Ast.dump = Ast.prototype.dump = function dump(n) {
    if(typeof n === "string") {
      var s = '"' + n + '"'
    }else {
      if(typeof n === "number") {
        var s = n
      }else {
        var s = '{ op: "' + n.op + '", args: [ ';
        for(var i = 0;i < n.args.length;i++) {
          if(i > 0) {
            s += " , "
          }
          s += dump(n.args[i])
        }
        s += " ] }"
      }
    }
    return s
  };
  var RUN_SELF_TESTS = false;
  function test() {
    (function() {
      trace("Ast self testing");
      var ast = new Ast;
      var node1 = {op:"+", args:[10, 20]};
      var node2 = {op:"+", args:[10, 30]};
      var node3 = {op:"num", args:[10]};
      var node4 = ast.create("+").arg(10).arg(30);
      var node5 = ast.create("+", [10, 20]);
      var node6 = ast.create({op:"+", args:[10, 20]});
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
      trace(result + ": " + "nid5 === nid6")
    })()
  }
  if(RUN_SELF_TESTS) {
    test()
  }
  return Ast
}();
"use strict";
var Model = exports.Model = function() {
  function error(str) {
    trace("error: " + str)
  }
  function Model() {
  }
  Model.fn = {};
  Model.env = env = {};
  var envStack = [];
  var env = {};
  Model.pushEnv = function pushEnv(e) {
    envStack.push(env);
    Model.env = env = e
  };
  Model.popEnv = function popEnv() {
    assert(envStack.length > 0, "Empty envStack");
    Model.env = env = envStack.pop()
  };
  function isChemCore() {
    return!!Model.env["Au"]
  }
  var Mp = Model.prototype = new Ast;
  Assert.reserveCodeRange(1E3, 1999, "model");
  Assert.messages[1001] = "Invalid syntax. '%1' expected, '%2' found.";
  Assert.messages[1002] = "Square brackets can only be used to denote intervals.";
  Assert.messages[1003] = "Extra characters in input at position: %1, lexeme: %2.";
  Assert.messages[1004] = "Invalid character '%1' (%2) in input.";
  var message = Assert.message;
  Model.create = Mp.create = function create(node, location) {
    assert(node, "Model.create() called with invalid argument " + node);
    if(node instanceof Model) {
      if(location) {
        node.location = location
      }
      return node
    }
    if(!(this instanceof Model)) {
      return(new Model).create(node, location)
    }
    var model = create(this);
    model.location = location;
    if(typeof node === "string") {
      node = parse(node, Model.env).expr()
    }else {
      node = JSON.parse(JSON.stringify(node))
    }
    forEach(keys(Model.fn), function(v, i) {
      if(!Mp.hasOwnProperty(v)) {
        Mp[v] = function() {
          var fn = Model.fn[v];
          if(arguments.length > 1 && arguments[1] instanceof Model) {
            return fn.apply(this, arguments)
          }else {
            var args = [this];
            for(var i = 0;i < arguments.length;i++) {
              args.push(arguments[i])
            }
            return fn.apply(this, args)
          }
        }
      }
    });
    forEach(keys(node), function(v, i) {
      model[v] = node[v]
    });
    return model
  };
  Model.fromLaTex = Mp.fromLaTex = function fromLaTex(src) {
    assert(typeof src === "string", "Model.prototype.fromLaTex");
    if(!this) {
      return Model.create(src);
    }
    return this.create(src);
  };
  Mp.toLaTeX = function toLaTeX(node) {
    return render(node)
  };
  var OpStr = {ADD:"+", SUB:"-", MUL:"times", DIV:"div", FRAC:"frac", EQL:"=", ATAN2:"atan2", SQRT:"sqrt", PM:"pm", SIN:"sin", COS:"cos", TAN:"tan", SEC:"sec", COT:"cot", CSC:"csc", LOG:"log", LN:"ln", LG:"lg", VAR:"var", NUM:"num", CST:"cst", COMMA:",", POW:"^", SUBSCRIPT:"_", ABS:"abs", PAREN:"()", HIGHLIGHT:"hi", LT:"lt", LE:"le", GT:"gt", GE:"ge", INTERVAL:"interval", EXISTS:"exists", IN:"in", FORALL:"forall", LIM:"lim", EXP:"exp", TO:"to", SUM:"sum", INT:"int", PROD:"prod", PERCENT:"%", M:"M", 
  RIGHTARROW:"->", BANG:"!"};
  forEach(keys(OpStr), function(v, i) {
    Model[v] = OpStr[v]
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
  OpToLaTeX[OpStr.SUBSCRIPT] = "_";
  OpToLaTeX[OpStr.PM] = "\\pm";
  OpToLaTeX[OpStr.SIN] = "\\sin";
  OpToLaTeX[OpStr.COS] = "\\cos";
  OpToLaTeX[OpStr.TAN] = "\\tan";
  OpToLaTeX[OpStr.SEC] = "\\sec";
  OpToLaTeX[OpStr.COT] = "\\cot";
  OpToLaTeX[OpStr.CSC] = "\\csc";
  OpToLaTeX[OpStr.LN] = "\\ln";
  OpToLaTeX[OpStr.COMMA] = ",";
  OpToLaTeX[OpStr.M] = "\\M";
  var render = function render(n) {
    var text = "";
    if(typeof n === "string") {
      text = n
    }else {
      if(typeof n === "number") {
        text = n
      }else {
        if(typeof n === "object") {
          var args = [];
          for(var i = 0;i < n.args.length;i++) {
            args[i] = render(n.args[i])
          }
          switch(n.op) {
            case OpStr.VAR:
            ;
            case OpStr.CST:
            ;
            case OpStr.NUM:
              text = n.args[0];
              break;
            case OpStr.SUB:
              if(n.args.length === 1) {
                text = OpToLaTeX[n.op] + " " + args[0]
              }else {
                text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1]
              }
              break;
            case OpStr.DIV:
            ;
            case OpStr.PM:
            ;
            case OpStr.EQL:
              text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1];
              break;
            case OpStr.POW:
              var lhs = n.args[0];
              var rhs = n.args[1];
              if(lhs.args && lhs.args.length === 2 || rhs.args && rhs.args.length === 2) {
                if(lhs.op === OpStr.ADD || (lhs.op === OpStr.SUB || (lhs.op === OpStr.MUL || (lhs.op === OpStr.DIV || lhs.op === OpStr.SQRT)))) {
                  args[0] = " (" + args[0] + ") "
                }
              }
              text = "{" + args[0] + "^{" + args[1] + "}}";
              break;
            case OpStr.SIN:
            ;
            case OpStr.COS:
            ;
            case OpStr.TAN:
            ;
            case OpStr.SEC:
            ;
            case OpStr.COT:
            ;
            case OpStr.CSC:
            ;
            case OpStr.LN:
            ;
            case OpStr.M:
              text = "{" + OpToLaTeX[n.op] + "{" + args[0] + "}}";
              break;
            case OpStr.FRAC:
              text = "\\dfrac{" + args[0] + "}{" + args[1] + "}";
              break;
            case OpStr.SQRT:
              switch(args.length) {
                case 1:
                  text = "\\sqrt{" + args[0] + "}";
                  break;
                case 2:
                  text = "\\sqrt[" + args[0] + "]{" + args[1] + "}";
                  break
              }
              break;
            case OpStr.MUL:
              var prevTerm;
              text = "";
              forEach(n.args, function(term, index) {
                if(term.args && term.args.length >= 2) {
                  if(term.op === OpStr.ADD || term.op === OpStr.SUB) {
                    args[index] = "(" + args[index] + ")"
                  }
                  if(index !== 0 && typeof term === "number") {
                    text += OpToLaTeX[n.op] + " "
                  }
                  text += args[index]
                }else {
                  if(term.op === OpStr.PAREN || (term.op === OpStr.VAR || (term.op === OpStr.CST || typeof prevTerm === "number" && typeof term !== "number"))) {
                    text += args[index]
                  }else {
                    if(index !== 0) {
                      text += " " + OpToLaTeX[n.op] + " "
                    }
                    text += args[index]
                  }
                }
                prevTerm = term
              });
              break;
            case OpStr.ADD:
            ;
            case OpStr.COMMA:
              forEach(args, function(value, index) {
                if(index === 0) {
                  text = value
                }else {
                  text = text + " " + OpToLaTeX[n.op] + " " + value
                }
              });
              break;
            default:
              assert(false, "unimplemented eval operator");
              break
          }
        }else {
          assert(false, "invalid expression type")
        }
      }
    }
    return text
  };
  var parse = function parse(src, env) {
    var TK_NONE = 0;
    var TK_ADD = "+".charCodeAt(0);
    var TK_CARET = "^".charCodeAt(0);
    var TK_UNDERSCORE = "_".charCodeAt(0);
    var TK_COS = 261;
    var TK_COT = 264;
    var TK_CSC = 265;
    var TK_DIV = "/".charCodeAt(0);
    var TK_EQL = "=".charCodeAt(0);
    var TK_FRAC = 256;
    var TK_LN = 263;
    var TK_LEFTBRACE = "{".charCodeAt(0);
    var TK_VERTICALBAR = "|".charCodeAt(0);
    var TK_LEFTBRACKET = "[".charCodeAt(0);
    var TK_LEFTPAREN = "(".charCodeAt(0);
    var TK_MUL = "*".charCodeAt(0);
    var TK_NUM = "0".charCodeAt(0);
    var TK_PM = 258;
    var TK_RIGHTBRACE = "}".charCodeAt(0);
    var TK_RIGHTBRACKET = "]".charCodeAt(0);
    var TK_RIGHTPAREN = ")".charCodeAt(0);
    var TK_SEC = 262;
    var TK_SIN = 259;
    var TK_SQRT = 257;
    var TK_SUB = "-".charCodeAt(0);
    var TK_TAN = 260;
    var TK_VAR = "a".charCodeAt(0);
    var TK_CONST = "A".charCodeAt(0);
    var TK_NEXT = 266;
    var TK_COMMA = ",".charCodeAt(0);
    var TK_LG = 267;
    var TK_LOG = 268;
    var TK_TEXT = 269;
    var TK_LT = 270;
    var TK_LE = 271;
    var TK_GT = 272;
    var TK_GE = 273;
    var TK_EXISTS = 274;
    var TK_IN = 275;
    var TK_FORALL = 276;
    var TK_LIM = 277;
    var TK_EXP = 278;
    var TK_TO = 279;
    var TK_SUM = 280;
    var TK_INT = 281;
    var TK_PROD = 282;
    var TK_PERCENT = "%".charCodeAt(0);
    var TK_M = 283;
    var TK_RIGHTARROW = 284;
    var TK_BANG = "!".charCodeAt(0);
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
    tokenToOperator[TK_LG] = OpStr.LG;
    tokenToOperator[TK_LOG] = OpStr.LOG;
    tokenToOperator[TK_EQL] = OpStr.EQL;
    tokenToOperator[TK_COMMA] = OpStr.COMMA;
    tokenToOperator[TK_TEXT] = OpStr.TEXT;
    tokenToOperator[TK_LT] = OpStr.LT;
    tokenToOperator[TK_LE] = OpStr.LE;
    tokenToOperator[TK_GT] = OpStr.GT;
    tokenToOperator[TK_GE] = OpStr.GE;
    tokenToOperator[TK_EXISTS] = OpStr.EXISTS;
    tokenToOperator[TK_IN] = OpStr.IN;
    tokenToOperator[TK_FORALL] = OpStr.FORALL;
    tokenToOperator[TK_LIM] = OpStr.LIM;
    tokenToOperator[TK_EXP] = OpStr.EXP;
    tokenToOperator[TK_TO] = OpStr.TO;
    tokenToOperator[TK_SUM] = OpStr.SUM;
    tokenToOperator[TK_INT] = OpStr.INT;
    tokenToOperator[TK_PROD] = OpStr.PROD;
    tokenToOperator[TK_M] = OpStr.M;
    tokenToOperator[TK_RIGHTARROW] = OpStr.RIGHTARROW;
    tokenToOperator[TK_BANG] = OpStr.BANG;
    function numberNode(n, doScale, roundOnly) {
      if(doScale) {
        var n = new BigDecimal(n.toString());
        var scale = option("decimalPlaces");
        if(!roundOnly || n.scale() > scale) {
          n = n.setScale(scale, BigDecimal.ROUND_HALF_UP)
        }
      }
      return{op:Model.NUM, args:[n.toString()]}
    }
    function multiplyNode(args, flatten) {
      return binaryNode(Model.MUL, args, flatten)
    }
    function unaryNode(op, args) {
      assert(args.length === 1, "Wrong number of arguments for unary node");
      if(op === Model.ADD) {
        return args[0]
      }else {
        return{op:op, args:args}
      }
    }
    function binaryNode(op, args, flatten) {
      assert(args.length > 1, "Too few argument for binary node");
      var aa = [];
      forEach(args, function(n) {
        if(flatten && n.op === op) {
          aa = aa.concat(n.args)
        }else {
          aa.push(n)
        }
      });
      return{op:op, args:aa}
    }
    var scan = scanner(src);
    function start() {
      T0 = scan.start()
    }
    function hd() {
      return T0
    }
    function lexeme() {
      return scan.lexeme()
    }
    function matchToken(t) {
      if(T0 == t) {
        next();
        return true
      }
      return false
    }
    function next() {
      T0 = T1;
      T1 = TK_NONE;
      if(T0 === TK_NONE) {
        T0 = scan.start()
      }
    }
    function replace(t) {
      T0 = t
    }
    function eat(tc) {
      var tk = hd();
      if(tk !== tc) {
        var expected = String.fromCharCode(tc);
        var found = tk ? String.fromCharCode(tk) : "EOS";
        assert(false, message(1001, [expected, found]))
      }
      next()
    }
    function match(tc) {
      var tk = hd();
      if(tk !== tc) {
        return false
      }
      next();
      return true
    }
    function primaryExpr() {
      var e;
      var tk;
      var op;
      switch(tk = hd()) {
        case "A".charCodeAt(0):
        ;
        case "a".charCodeAt(0):
        ;
        case TK_VAR:
          var args = [lexeme()];
          next();
          if((t = hd()) === TK_UNDERSCORE) {
            next();
            args.push(primaryExpr())
          }
          e = {op:"var", args:args};
          break;
        case TK_NUM:
          e = {op:"num", args:[lexeme()]};
          next();
          break;
        case TK_LEFTPAREN:
        ;
        case TK_LEFTBRACKET:
          e = parenExpr(tk);
          break;
        case TK_LEFTBRACE:
          e = braceExpr();
          break;
        case TK_VERTICALBAR:
          e = absExpr();
          break;
        case TK_FRAC:
          next();
          var expr1 = braceExpr();
          var expr2 = braceExpr();
          e = {op:Model.MUL, args:[expr1, {op:Model.POW, args:[expr2, {op:Model.NUM, args:["-1"]}]}]};
          break;
        case TK_SQRT:
          next();
          switch(hd()) {
            case TK_LEFTBRACKET:
              var root = bracketExpr();
              var base = braceExpr();
              e = {op:Model.POW, args:[base, root, {op:Model.NUM, args:["-1"]}]};
              break;
            case TK_LEFTBRACE:
              var base = braceExpr();
              e = {op:Model.POW, args:[base, {op:Model.NUM, args:["2"]}, {op:Model.NUM, args:["-1"]}]};
              break;
            default:
              assert(false, message(1001, ["{ or (", String.fromCharCode(hd())]));
              break
          }
          break;
        case TK_SIN:
        ;
        case TK_COS:
        ;
        case TK_TAN:
        ;
        case TK_SEC:
        ;
        case TK_COT:
        ;
        case TK_CSC:
          next();
          var t, args = [];
          while((t = hd()) === TK_CARET) {
            next();
            args.push(unaryExpr())
          }
          args.unshift({op:tokenToOperator[tk], args:[primaryExpr()]});
          if(args.length > 1) {
            return{op:Model.POW, args:args}
          }else {
            return args[0]
          }
          break;
        case TK_LN:
          next();
          return{op:Model.LOG, args:[{op:Model.VAR, args:["e"]}, primaryExpr()]};
        case TK_LG:
          next();
          return{op:Model.LOG, args:[{op:Model.NUM, args:["10"]}, primaryExpr()]};
        case TK_LOG:
          next();
          var t, args = [];
          if((t = hd()) === TK_UNDERSCORE) {
            next();
            args.push(primaryExpr())
          }else {
            args.push({op:Model.VAR, args:["e"]})
          }
          args.push(primaryExpr());
          return{op:Model.LOG, args:args};
          break;
        case TK_LIM:
          next();
          var t, args = [];
          eat(TK_UNDERSCORE);
          args.push(primaryExpr());
          args.push(primaryExpr());
          return{op:tokenToOperator[tk], args:args};
          break;
        case TK_SUM:
        ;
        case TK_INT:
        ;
        case TK_PROD:
          next();
          var t, args = [];
          if(hd() === TK_UNDERSCORE) {
            next();
            args.push(primaryExpr());
            eat(TK_CARET);
            args.push(primaryExpr())
          }
          args.push(commaExpr());
          return{op:tokenToOperator[tk], args:args};
          break;
        case TK_EXISTS:
          next();
          return{op:Model.EXISTS, args:[equalExpr()]};
        case TK_FORALL:
          next();
          return{op:Model.FORALL, args:[commaExpr()]};
        case TK_EXP:
          next();
          return{op:Model.EXP, args:[additiveExpr()]};
        case TK_M:
          next();
          return{op:Model.M, args:[multiplicativeExpr()]};
        default:
          assert(false, "Model.primaryExpr() unexpected expression kind " + lexeme());
          e = void 0;
          break
      }
      return e
    }
    function absExpr() {
      eat(TK_VERTICALBAR);
      var e = additiveExpr();
      eat(TK_VERTICALBAR);
      return unaryNode(Model.ABS, [e])
    }
    function braceExpr() {
      eat(TK_LEFTBRACE);
      var e = commaExpr();
      eat(TK_RIGHTBRACE);
      return e
    }
    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      var e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e
    }
    function parenExpr(tk) {
      var tk2;
      eat(tk);
      var e = commaExpr();
      eat(tk2 = hd() === TK_RIGHTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
      if(e.args.length !== 2 && (tk === TK_LEFTBRACKET || tk2 === TK_RIGHTBRACKET)) {
        assert(false, message(1002))
      }
      e.lbrk = tk;
      e.rbrk = tk2;
      return e
    }
    function postfixExpr() {
      var t;
      var expr = primaryExpr();
      switch(t = hd()) {
        case TK_PERCENT:
          next();
          expr = {op:Model.PERCENT, args:[expr]};
          break;
        case TK_BANG:
          next();
          expr = {op:Model.BANG, args:[expr]};
          break;
        default:
          break
      }
      return expr
    }
    function unaryExpr() {
      var t;
      var expr;
      switch(t = hd()) {
        case TK_ADD:
          next();
          expr = unaryExpr();
          break;
        case TK_SUB:
        ;
        case TK_PM:
          next();
          expr = unaryExpr();
          expr = {op:tokenToOperator[t], args:[expr]};
          break;
        default:
          expr = postfixExpr();
          break
      }
      return expr
    }
    function subscriptExpr() {
      var t, args = [unaryExpr()];
      while((t = hd()) === TK_UNDERSCORE) {
        next();
        args.push(unaryExpr())
      }
      if(args.length > 1) {
        return{op:Model.SUBSCRIPT, args:args}
      }else {
        return args[0]
      }
    }
    function exponentialExpr() {
      var t, args = [subscriptExpr()];
      while((t = hd()) === TK_CARET) {
        next();
        var t;
        if((isMathSymbol(args[0]) || isChemCore() && isChemSymbol(args[0])) && ((t = hd()) === TK_ADD || t === TK_SUB)) {
          next();
          args.push(unaryNode(t, [numberNode(1)]))
        }else {
          var n = unaryExpr();
          if(isChemCore() && ((t = hd()) === TK_ADD || t === TK_SUB)) {
            next();
            args.push(unaryNode(t, [n]))
          }else {
            args.push(n)
          }
        }
      }
      if(args.length > 1) {
        return{op:Model.POW, args:args}
      }else {
        return args[0]
      }
    }
    function isChemSymbol(n) {
      if(n.op !== Model.VAR) {
        return false
      }
      var sym = Model.env[n.args[0]];
      return sym && sym.mass ? true : false
    }
    function isMathSymbol(n) {
      if(n.op !== Model.VAR) {
        return false
      }
      var sym = Model.env[n.args[0]];
      return sym && sym.name ? true : false
    }
    function isVar(n, id) {
      assert(typeof id === "undefined" || typeof id === "string", "Internal error in 'isVar()'");
      if(n.op !== Model.VAR) {
        return false
      }
      return n === undefined ? true : n.args[0] === id
    }
    function multiplicativeExpr() {
      var t, expr;
      var args = [exponentialExpr()];
      while((t = hd()) && (!isAdditive(t) && (!isRelational(t) && (t !== TK_COMMA && (t !== TK_EQL && (t !== TK_RIGHTBRACE && (t !== TK_RIGHTPAREN && (t !== TK_RIGHTBRACKET && (t !== TK_RIGHTARROW && (t !== TK_LT && t !== TK_VERTICALBAR)))))))))) {
        if(isMultiplicative(t)) {
          next()
        }
        expr = exponentialExpr();
        if(t === TK_DIV) {
          expr = {op:Model.POW, args:[expr, {op:Model.NUM, args:["-1"]}]}
        }else {
          if(isChemCore() && (t === TK_LEFTPAREN && isVar(args[args.length - 1], "M"))) {
            args.pop();
            expr = unaryNode(Model.M, [expr])
          }
        }
        args.push(expr)
      }
      if(args.length > 1) {
        if(isChemCore() && isChemSymbol(args[1])) {
          if(args[0].op === Model.NUM) {
            var coeff = args.shift();
            return multiplyNode([coeff, binaryNode(Model.ADD, args)])
          }else {
            return binaryNode(Model.ADD, args)
          }
        }else {
          return{op:Model.MUL, args:args}
        }
      }else {
        return args[0]
      }
      function isMultiplicative(t) {
        return t === TK_MUL || t === TK_DIV
      }
    }
    function isNeg(n) {
      if(typeof n === "number") {
        return n < 0
      }else {
        if(n.args.length === 1) {
          return n.op === OpStr.SUB && n.args[0] > 0
        }else {
          if(n.args.length === 2) {
            return n.op === OpStr.MUL && isNeg(n.args[0])
          }
        }
      }
    }
    function negate(n) {
      if(typeof n === "number") {
        return-n
      }else {
        if(n.args.length === 1) {
          if(n.op === Model.SUB) {
            return n.args[0]
          }else {
            if(n.op === Model.ADD) {
              n.args[0] = negate(n.args[0]);
              return n
            }else {
              return{op:Model.MUL, args:[{op:Model.NUM, args:["-1"]}, n]}
            }
          }
        }else {
          if(n.op === Model.MUL) {
            n.args.unshift({op:Model.NUM, args:["-1"]});
            return n
          }
        }
      }
      return{op:Model.MUL, args:[{op:Model.NUM, args:["-1"]}, n]}
    }
    function isAdditive(t) {
      return t === TK_ADD || (t === TK_SUB || t === TK_PM)
    }
    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while(isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        switch(t) {
          case TK_PM:
            expr = {op:Model.PM, args:[expr, expr2]};
            break;
          case TK_SUB:
            expr2 = negate(expr2);
          default:
            expr = {op:Model.ADD, args:[expr, expr2]};
            break
        }
      }
      return expr
    }
    function isRelational(t) {
      return t === TK_LT || (t === TK_LE || (t === TK_GT || (t === TK_GE || (t === TK_IN || t === TK_TO))))
    }
    function relationalExpr() {
      var expr = additiveExpr();
      var t;
      while(isRelational(t = hd())) {
        next();
        var expr2 = additiveExpr();
        switch(t) {
          default:
            expr = {op:tokenToOperator[t], args:[expr, expr2]};
            break
        }
      }
      return expr
    }
    function equalExpr() {
      var expr = relationalExpr();
      var t;
      while((t = hd()) === TK_EQL || t === TK_RIGHTARROW) {
        next();
        var expr2 = relationalExpr();
        expr = {op:tokenToOperator[t], args:[expr, expr2]}
      }
      return expr
    }
    function commaExpr() {
      var expr = equalExpr();
      var args = [expr];
      var t;
      while((t = hd()) === TK_COMMA) {
        next();
        args.push(equalExpr())
      }
      if(args.length > 1) {
        return{op:tokenToOperator[TK_COMMA], args:args}
      }else {
        return expr
      }
    }
    function expr() {
      start();
      var n = commaExpr();
      assert(!hd(), message(1003, [scan.pos(), scan.lexeme()]));
      return n
    }
    function scanner(src) {
      var curIndex = 0;
      var lexeme = "";
      var lexemeToToken = [];
      lexemeToToken["\\cdot"] = TK_MUL;
      lexemeToToken["\\times"] = TK_MUL;
      lexemeToToken["\\div"] = TK_DIV;
      lexemeToToken["\\dfrac"] = TK_FRAC;
      lexemeToToken["\\frac"] = TK_FRAC;
      lexemeToToken["\\sqrt"] = TK_SQRT;
      lexemeToToken["\\pm"] = TK_PM;
      lexemeToToken["\\sin"] = TK_SIN;
      lexemeToToken["\\cos"] = TK_COS;
      lexemeToToken["\\tan"] = TK_TAN;
      lexemeToToken["\\sec"] = TK_SEC;
      lexemeToToken["\\cot"] = TK_COT;
      lexemeToToken["\\csc"] = TK_CSC;
      lexemeToToken["\\ln"] = TK_LN;
      lexemeToToken["\\lg"] = TK_LG;
      lexemeToToken["\\log"] = TK_LOG;
      lexemeToToken["\\left"] = null;
      lexemeToToken["\\right"] = null;
      lexemeToToken["\\big"] = null;
      lexemeToToken["\\Big"] = null;
      lexemeToToken["\\bigg"] = null;
      lexemeToToken["\\Bigg"] = null;
      lexemeToToken["\\text"] = TK_TEXT;
      lexemeToToken["\\textrm"] = TK_TEXT;
      lexemeToToken["\\textit"] = TK_TEXT;
      lexemeToToken["\\textbf"] = TK_TEXT;
      lexemeToToken["\\lt"] = TK_LT;
      lexemeToToken["\\le"] = TK_LE;
      lexemeToToken["\\gt"] = TK_GT;
      lexemeToToken["\\ge"] = TK_GE;
      lexemeToToken["\\exists"] = TK_EXISTS;
      lexemeToToken["\\in"] = TK_IN;
      lexemeToToken["\\forall"] = TK_FORALL;
      lexemeToToken["\\lim"] = TK_LIM;
      lexemeToToken["\\exp"] = TK_EXP;
      lexemeToToken["\\to"] = TK_TO;
      lexemeToToken["\\sum"] = TK_SUM;
      lexemeToToken["\\int"] = TK_INT;
      lexemeToToken["\\prod"] = TK_PROD;
      lexemeToToken["\\%"] = TK_PERCENT;
      lexemeToToken["\\rightarrow"] = TK_RIGHTARROW;
      var identifiers = keys(env);
      return{start:start, lexeme:function() {
        return lexeme
      }, pos:function() {
        return curIndex
      }};
      function start() {
        var c;
        lexeme = "";
        while(curIndex < src.length) {
          switch(c = src.charCodeAt(curIndex++)) {
            case 32:
            ;
            case 9:
            ;
            case 10:
            ;
            case 13:
              continue;
            case 92:
              lexeme += String.fromCharCode(c);
              var tk = latex();
              if(tk) {
                return tk
              }
              lexeme = "";
              continue;
            case 45:
              if(src.charCodeAt(curIndex) === 62) {
                curIndex++;
                return TK_RIGHTARROW
              }
            ;
            case 33:
            ;
            case 37:
            ;
            case 40:
            ;
            case 41:
            ;
            case 42:
            ;
            case 43:
            ;
            case 44:
            ;
            case 47:
            ;
            case 61:
            ;
            case 91:
            ;
            case 93:
            ;
            case 94:
            ;
            case 95:
            ;
            case 123:
            ;
            case 124:
            ;
            case 125:
              lexeme += String.fromCharCode(c);
              return c;
            case 36:
              lexeme += String.fromCharCode(c);
              return TK_VAR;
            case 60:
              if(src.charCodeAt(curIndex) === 61) {
                curIndex++;
                return TK_LE
              }
              return TK_LT;
            case 62:
              if(src.charCodeAt(curIndex) === 61) {
                curIndex++;
                return TK_GE
              }
              return TK_GT;
            default:
              if(c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0) || c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
                return variable(c)
              }else {
                if(c === ".".charCodeAt(0) || c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
                  return number(c)
                }else {
                  assert(false, message(1004, [String.fromCharCode(c), c]));
                  return 0
                }
              }
          }
        }
        return 0
      }
      function number(c) {
        while(c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0) || c === ".".charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++)
        }
        curIndex--;
        return TK_NUM
      }
      function variable(c) {
        var ch = String.fromCharCode(c);
        lexeme += ch;
        while(c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0) || c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          var prefix = lexeme + ch;
          var match = some(identifiers, function(u) {
            return u.indexOf(prefix) === 0
          });
          if(!match) {
            break
          }
          lexeme += ch
        }
        while(c === "'".charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          lexeme += ch
        }
        curIndex--;
        return TK_VAR
      }
      function latex() {
        var c = src.charCodeAt(curIndex++);
        if(c === "$".charCodeAt(0)) {
          lexeme = String.fromCharCode(c)
        }else {
          if(c === "%".charCodeAt(0)) {
            lexeme += String.fromCharCode(c)
          }else {
            while(c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0) || c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              c = src.charCodeAt(curIndex++)
            }
            curIndex--
          }
        }
        var tk = lexemeToToken[lexeme];
        if(tk === void 0) {
          tk = TK_VAR
        }else {
          if(tk === TK_TEXT) {
            var c = src.charCodeAt(curIndex++);
            while(c !== "{".charCodeAt(0)) {
              c = src.charCodeAt(curIndex++)
            }
            lexeme = "";
            var c = src.charCodeAt(curIndex++);
            while(c !== "}".charCodeAt(0)) {
              var ch = String.fromCharCode(c);
              lexeme += ch;
              c = src.charCodeAt(curIndex++)
            }
            tk = TK_VAR
          }
        }
        return tk
      }
    }
    return{expr:expr}
  };
  function test() {
    trace("\nModel self testing");
    (function() {
      var node = Model.create("\\int y dx");
      trace("node=" + JSON.stringify(node, null, 2))
    })()
  }
  var RUN_SELF_TESTS = false;
  if(RUN_SELF_TESTS) {
    test()
  }
  return Model
}();
var MathContext = function() {
  MathContext.prototype.getDigits = getDigits;
  MathContext.prototype.getForm = getForm;
  MathContext.prototype.getLostDigits = getLostDigits;
  MathContext.prototype.getRoundingMode = getRoundingMode;
  MathContext.prototype.toString = toString;
  MathContext.prototype.isValidRound = isValidRound;
  MathContext.PLAIN = MathContext.prototype.PLAIN = 0;
  MathContext.SCIENTIFIC = MathContext.prototype.SCIENTIFIC = 1;
  MathContext.ENGINEERING = MathContext.prototype.ENGINEERING = 2;
  MathContext.ROUND_CEILING = MathContext.prototype.ROUND_CEILING = 2;
  MathContext.ROUND_DOWN = MathContext.prototype.ROUND_DOWN = 1;
  MathContext.ROUND_FLOOR = MathContext.prototype.ROUND_FLOOR = 3;
  MathContext.ROUND_HALF_DOWN = MathContext.prototype.ROUND_HALF_DOWN = 5;
  MathContext.ROUND_HALF_EVEN = MathContext.prototype.ROUND_HALF_EVEN = 6;
  MathContext.ROUND_HALF_UP = MathContext.prototype.ROUND_HALF_UP = 4;
  MathContext.ROUND_UNNECESSARY = MathContext.prototype.ROUND_UNNECESSARY = 7;
  MathContext.ROUND_UP = MathContext.prototype.ROUND_UP = 0;
  MathContext.prototype.DEFAULT_FORM = MathContext.prototype.SCIENTIFIC;
  MathContext.prototype.DEFAULT_DIGITS = 9;
  MathContext.prototype.DEFAULT_LOSTDIGITS = false;
  MathContext.prototype.DEFAULT_ROUNDINGMODE = MathContext.prototype.ROUND_HALF_UP;
  MathContext.prototype.MIN_DIGITS = 0;
  MathContext.prototype.MAX_DIGITS = 999999999;
  MathContext.prototype.ROUNDS = new Array(MathContext.prototype.ROUND_HALF_UP, MathContext.prototype.ROUND_UNNECESSARY, MathContext.prototype.ROUND_CEILING, MathContext.prototype.ROUND_DOWN, MathContext.prototype.ROUND_FLOOR, MathContext.prototype.ROUND_HALF_DOWN, MathContext.prototype.ROUND_HALF_EVEN, MathContext.prototype.ROUND_UP);
  MathContext.prototype.ROUNDWORDS = new Array("ROUND_HALF_UP", "ROUND_UNNECESSARY", "ROUND_CEILING", "ROUND_DOWN", "ROUND_FLOOR", "ROUND_HALF_DOWN", "ROUND_HALF_EVEN", "ROUND_UP");
  MathContext.prototype.DEFAULT = new MathContext(MathContext.prototype.DEFAULT_DIGITS, MathContext.prototype.DEFAULT_FORM, MathContext.prototype.DEFAULT_LOSTDIGITS, MathContext.prototype.DEFAULT_ROUNDINGMODE);
  function MathContext() {
    this.digits = 0;
    this.form = 0;
    this.lostDigits = false;
    this.roundingMode = 0;
    var setform = this.DEFAULT_FORM;
    var setlostdigits = this.DEFAULT_LOSTDIGITS;
    var setroundingmode = this.DEFAULT_ROUNDINGMODE;
    if(arguments.length == 4) {
      setform = arguments[1];
      setlostdigits = arguments[2];
      setroundingmode = arguments[3]
    }else {
      if(arguments.length == 3) {
        setform = arguments[1];
        setlostdigits = arguments[2]
      }else {
        if(arguments.length == 2) {
          setform = arguments[1]
        }else {
          if(arguments.length != 1) {
            throw"MathContext(): " + arguments.length + " arguments given; expected 1 to 4";
          }
        }
      }
    }
    var setdigits = arguments[0];
    if(setdigits != this.DEFAULT_DIGITS) {
      if(setdigits < this.MIN_DIGITS) {
        throw"MathContext(): Digits too small: " + setdigits;
      }
      if(setdigits > this.MAX_DIGITS) {
        throw"MathContext(): Digits too large: " + setdigits;
      }
    }
    if(setform == this.SCIENTIFIC) {
    }else {
      if(setform == this.ENGINEERING) {
      }else {
        if(setform == this.PLAIN) {
        }else {
          throw"MathContext() Bad form value: " + setform;
        }
      }
    }
    if(!this.isValidRound(setroundingmode)) {
      throw"MathContext(): Bad roundingMode value: " + setroundingmode;
    }
    this.digits = setdigits;
    this.form = setform;
    this.lostDigits = setlostdigits;
    this.roundingMode = setroundingmode;
    return
  }
  function getDigits() {
    return this.digits
  }
  function getForm() {
    return this.form
  }
  function getLostDigits() {
    return this.lostDigits
  }
  function getRoundingMode() {
    return this.roundingMode
  }
  function toString() {
    var formstr = null;
    var r = 0;
    var roundword = null;
    if(this.form == this.SCIENTIFIC) {
      formstr = "SCIENTIFIC"
    }else {
      if(this.form == this.ENGINEERING) {
        formstr = "ENGINEERING"
      }else {
        formstr = "PLAIN"
      }
    }
    var $1 = this.ROUNDS.length;
    r = 0;
    r:for(;$1 > 0;$1--, r++) {
      if(this.roundingMode == this.ROUNDS[r]) {
        roundword = this.ROUNDWORDS[r];
        break r
      }
    }
    return"digits=" + this.digits + " " + "form=" + formstr + " " + "lostDigits=" + (this.lostDigits ? "1" : "0") + " " + "roundingMode=" + roundword
  }
  function isValidRound(testround) {
    var r = 0;
    var $2 = this.ROUNDS.length;
    r = 0;
    r:for(;$2 > 0;$2--, r++) {
      if(testround == this.ROUNDS[r]) {
        return true
      }
    }
    return false
  }
  return MathContext
}();
var BigDecimal = function(MathContext) {
  function div(a, b) {
    return(a - a % b) / b
  }
  BigDecimal.prototype.div = div;
  function arraycopy(src, srcindex, dest, destindex, length) {
    var i;
    if(destindex > srcindex) {
      for(i = length - 1;i >= 0;--i) {
        dest[i + destindex] = src[i + srcindex]
      }
    }else {
      for(i = 0;i < length;++i) {
        dest[i + destindex] = src[i + srcindex]
      }
    }
  }
  BigDecimal.prototype.arraycopy = arraycopy;
  function createArrayWithZeros(length) {
    var retVal = new Array(length);
    var i;
    for(i = 0;i < length;++i) {
      retVal[i] = 0
    }
    return retVal
  }
  BigDecimal.prototype.createArrayWithZeros = createArrayWithZeros;
  BigDecimal.prototype.abs = abs;
  BigDecimal.prototype.add = add;
  BigDecimal.prototype.compareTo = compareTo;
  BigDecimal.prototype.divide = divide;
  BigDecimal.prototype.divideInteger = divideInteger;
  BigDecimal.prototype.max = max;
  BigDecimal.prototype.min = min;
  BigDecimal.prototype.multiply = multiply;
  BigDecimal.prototype.negate = negate;
  BigDecimal.prototype.plus = plus;
  BigDecimal.prototype.pow = pow;
  BigDecimal.prototype.remainder = remainder;
  BigDecimal.prototype.subtract = subtract;
  BigDecimal.prototype.equals = equals;
  BigDecimal.prototype.format = format;
  BigDecimal.prototype.intValueExact = intValueExact;
  BigDecimal.prototype.movePointLeft = movePointLeft;
  BigDecimal.prototype.movePointRight = movePointRight;
  BigDecimal.prototype.scale = scale;
  BigDecimal.prototype.setScale = setScale;
  BigDecimal.prototype.signum = signum;
  BigDecimal.prototype.toString = toString;
  BigDecimal.prototype.layout = layout;
  BigDecimal.prototype.intcheck = intcheck;
  BigDecimal.prototype.dodivide = dodivide;
  BigDecimal.prototype.bad = bad;
  BigDecimal.prototype.badarg = badarg;
  BigDecimal.prototype.extend = extend;
  BigDecimal.prototype.byteaddsub = byteaddsub;
  BigDecimal.prototype.diginit = diginit;
  BigDecimal.prototype.clone = clone;
  BigDecimal.prototype.checkdigits = checkdigits;
  BigDecimal.prototype.round = round;
  BigDecimal.prototype.allzero = allzero;
  BigDecimal.prototype.finish = finish;
  BigDecimal.prototype.isGreaterThan = isGreaterThan;
  BigDecimal.prototype.isLessThan = isLessThan;
  BigDecimal.prototype.isGreaterThanOrEqualTo = isGreaterThanOrEqualTo;
  BigDecimal.prototype.isLessThanOrEqualTo = isLessThanOrEqualTo;
  BigDecimal.prototype.isPositive = isPositive;
  BigDecimal.prototype.isNegative = isNegative;
  BigDecimal.prototype.isZero = isZero;
  BigDecimal.ROUND_CEILING = BigDecimal.prototype.ROUND_CEILING = MathContext.prototype.ROUND_CEILING;
  BigDecimal.ROUND_DOWN = BigDecimal.prototype.ROUND_DOWN = MathContext.prototype.ROUND_DOWN;
  BigDecimal.ROUND_FLOOR = BigDecimal.prototype.ROUND_FLOOR = MathContext.prototype.ROUND_FLOOR;
  BigDecimal.ROUND_HALF_DOWN = BigDecimal.prototype.ROUND_HALF_DOWN = MathContext.prototype.ROUND_HALF_DOWN;
  BigDecimal.ROUND_HALF_EVEN = BigDecimal.prototype.ROUND_HALF_EVEN = MathContext.prototype.ROUND_HALF_EVEN;
  BigDecimal.ROUND_HALF_UP = BigDecimal.prototype.ROUND_HALF_UP = MathContext.prototype.ROUND_HALF_UP;
  BigDecimal.ROUND_UNNECESSARY = BigDecimal.prototype.ROUND_UNNECESSARY = MathContext.prototype.ROUND_UNNECESSARY;
  BigDecimal.ROUND_UP = BigDecimal.prototype.ROUND_UP = MathContext.prototype.ROUND_UP;
  BigDecimal.prototype.ispos = 1;
  BigDecimal.prototype.iszero = 0;
  BigDecimal.prototype.isneg = -1;
  BigDecimal.prototype.MinExp = -999999999;
  BigDecimal.prototype.MaxExp = 999999999;
  BigDecimal.prototype.MinArg = -999999999;
  BigDecimal.prototype.MaxArg = 999999999;
  BigDecimal.prototype.plainMC = new MathContext(0, MathContext.prototype.PLAIN);
  BigDecimal.prototype.bytecar = new Array(90 + 99 + 1);
  BigDecimal.prototype.bytedig = diginit();
  BigDecimal.ZERO = BigDecimal.prototype.ZERO = new BigDecimal("0");
  BigDecimal.ONE = BigDecimal.prototype.ONE = new BigDecimal("1");
  BigDecimal.TEN = BigDecimal.prototype.TEN = new BigDecimal("10");
  function BigDecimal() {
    this.ind = 0;
    this.form = MathContext.prototype.PLAIN;
    this.mant = null;
    this.exp = 0;
    if(arguments.length == 0) {
      return
    }
    var inchars;
    var offset;
    var length;
    if(arguments.length == 1) {
      inchars = arguments[0];
      offset = 0;
      length = inchars.length
    }else {
      inchars = arguments[0];
      offset = arguments[1];
      length = arguments[2]
    }
    if(typeof inchars == "string") {
      inchars = inchars.split("")
    }
    var exotic;
    var hadexp;
    var d;
    var dotoff;
    var last;
    var i = 0;
    var si = 0;
    var eneg = false;
    var k = 0;
    var elen = 0;
    var j = 0;
    var sj = 0;
    var dvalue = 0;
    var mag = 0;
    if(length <= 0) {
      this.bad("BigDecimal(): ", inchars)
    }
    this.ind = this.ispos;
    if(inchars[0] == "-") {
      length--;
      if(length == 0) {
        this.bad("BigDecimal(): ", inchars)
      }
      this.ind = this.isneg;
      offset++
    }else {
      if(inchars[0] == "+") {
        length--;
        if(length == 0) {
          this.bad("BigDecimal(): ", inchars)
        }
        offset++
      }
    }
    exotic = false;
    hadexp = false;
    d = 0;
    dotoff = -1;
    last = -1;
    var $1 = length;
    i = offset;
    i:for(;$1 > 0;$1--, i++) {
      si = inchars[i];
      if(si >= "0") {
        if(si <= "9") {
          last = i;
          d++;
          continue i
        }
      }
      if(si == ".") {
        if(dotoff >= 0) {
          this.bad("BigDecimal(): ", inchars)
        }
        dotoff = i - offset;
        continue i
      }
      if(si != "e") {
        if(si != "E") {
          if(si < "0" || si > "9") {
            this.bad("BigDecimal(): ", inchars)
          }
          exotic = true;
          last = i;
          d++;
          continue i
        }
      }
      if(i - offset > length - 2) {
        this.bad("BigDecimal(): ", inchars)
      }
      eneg = false;
      if(inchars[i + 1] == "-") {
        eneg = true;
        k = i + 2
      }else {
        if(inchars[i + 1] == "+") {
          k = i + 2
        }else {
          k = i + 1
        }
      }
      elen = length - (k - offset);
      if(elen == 0 || elen > 9) {
        this.bad("BigDecimal(): ", inchars)
      }
      var $2 = elen;
      j = k;
      j:for(;$2 > 0;$2--, j++) {
        sj = inchars[j];
        if(sj < "0") {
          this.bad("BigDecimal(): ", inchars)
        }
        if(sj > "9") {
          this.bad("BigDecimal(): ", inchars)
        }else {
          dvalue = sj - "0"
        }
        this.exp = this.exp * 10 + dvalue
      }
      if(eneg) {
        this.exp = -this.exp
      }
      hadexp = true;
      break i
    }
    if(d == 0) {
      this.bad("BigDecimal(): ", inchars)
    }
    if(dotoff >= 0) {
      this.exp = this.exp + dotoff - d
    }
    var $3 = last - 1;
    i = offset;
    i:for(;i <= $3;i++) {
      si = inchars[i];
      if(si == "0") {
        offset++;
        dotoff--;
        d--
      }else {
        if(si == ".") {
          offset++;
          dotoff--
        }else {
          if(si <= "9") {
            break i
          }else {
            break i
          }
        }
      }
    }
    this.mant = new Array(d);
    j = offset;
    if(exotic) {
      exotica:do {
        var $4 = d;
        i = 0;
        i:for(;$4 > 0;$4--, i++) {
          if(i == dotoff) {
            j++
          }
          sj = inchars[j];
          if(sj <= "9") {
            this.mant[i] = sj - "0"
          }else {
            this.bad("BigDecimal(): ", inchars)
          }
          j++
        }
      }while(false)
    }else {
      simple:do {
        var $5 = d;
        i = 0;
        i:for(;$5 > 0;$5--, i++) {
          if(i == dotoff) {
            j++
          }
          this.mant[i] = inchars[j] - "0";
          j++
        }
      }while(false)
    }
    if(this.mant[0] == 0) {
      this.ind = this.iszero;
      if(this.exp > 0) {
        this.exp = 0
      }
      if(hadexp) {
        this.mant = this.ZERO.mant;
        this.exp = 0
      }
    }else {
      if(hadexp) {
        this.form = MathContext.prototype.SCIENTIFIC;
        mag = this.exp + this.mant.length - 1;
        if(mag < this.MinExp || mag > this.MaxExp) {
          this.bad("BigDecimal(): ", inchars)
        }
      }
    }
    return
  }
  function abs() {
    var set;
    if(arguments.length == 1) {
      set = arguments[0]
    }else {
      if(arguments.length == 0) {
        set = this.plainMC
      }else {
        throw"abs(): " + arguments.length + " arguments given; expected 0 or 1";
      }
    }
    if(this.ind == this.isneg) {
      return this.negate(set)
    }
    return this.plus(set)
  }
  function add() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"add(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    var lhs;
    var reqdig;
    var res;
    var usel;
    var usellen;
    var user;
    var userlen;
    var newlen = 0;
    var tlen = 0;
    var mult = 0;
    var t = null;
    var ia = 0;
    var ib = 0;
    var ea = 0;
    var eb = 0;
    var ca = 0;
    var cb = 0;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    lhs = this;
    if(lhs.ind == 0) {
      if(set.form != MathContext.prototype.PLAIN) {
        return rhs.plus(set)
      }
    }
    if(rhs.ind == 0) {
      if(set.form != MathContext.prototype.PLAIN) {
        return lhs.plus(set)
      }
    }
    reqdig = set.digits;
    if(reqdig > 0) {
      if(lhs.mant.length > reqdig) {
        lhs = this.clone(lhs).round(set)
      }
      if(rhs.mant.length > reqdig) {
        rhs = this.clone(rhs).round(set)
      }
    }
    res = new BigDecimal;
    usel = lhs.mant;
    usellen = lhs.mant.length;
    user = rhs.mant;
    userlen = rhs.mant.length;
    padder:do {
      if(lhs.exp == rhs.exp) {
        res.exp = lhs.exp
      }else {
        if(lhs.exp > rhs.exp) {
          newlen = usellen + lhs.exp - rhs.exp;
          if(newlen >= userlen + reqdig + 1) {
            if(reqdig > 0) {
              res.mant = usel;
              res.exp = lhs.exp;
              res.ind = lhs.ind;
              if(usellen < reqdig) {
                res.mant = this.extend(lhs.mant, reqdig);
                res.exp = res.exp - (reqdig - usellen)
              }
              return res.finish(set, false)
            }
          }
          res.exp = rhs.exp;
          if(newlen > reqdig + 1) {
            if(reqdig > 0) {
              tlen = newlen - reqdig - 1;
              userlen = userlen - tlen;
              res.exp = res.exp + tlen;
              newlen = reqdig + 1
            }
          }
          if(newlen > usellen) {
            usellen = newlen
          }
        }else {
          newlen = userlen + rhs.exp - lhs.exp;
          if(newlen >= usellen + reqdig + 1) {
            if(reqdig > 0) {
              res.mant = user;
              res.exp = rhs.exp;
              res.ind = rhs.ind;
              if(userlen < reqdig) {
                res.mant = this.extend(rhs.mant, reqdig);
                res.exp = res.exp - (reqdig - userlen)
              }
              return res.finish(set, false)
            }
          }
          res.exp = lhs.exp;
          if(newlen > reqdig + 1) {
            if(reqdig > 0) {
              tlen = newlen - reqdig - 1;
              usellen = usellen - tlen;
              res.exp = res.exp + tlen;
              newlen = reqdig + 1
            }
          }
          if(newlen > userlen) {
            userlen = newlen
          }
        }
      }
    }while(false);
    if(lhs.ind == this.iszero) {
      res.ind = this.ispos
    }else {
      res.ind = lhs.ind
    }
    if((lhs.ind == this.isneg ? 1 : 0) == (rhs.ind == this.isneg ? 1 : 0)) {
      mult = 1
    }else {
      signdiff:do {
        mult = -1;
        swaptest:do {
          if(rhs.ind == this.iszero) {
          }else {
            if(usellen < userlen || lhs.ind == this.iszero) {
              t = usel;
              usel = user;
              user = t;
              tlen = usellen;
              usellen = userlen;
              userlen = tlen;
              res.ind = -res.ind
            }else {
              if(usellen > userlen) {
              }else {
                ia = 0;
                ib = 0;
                ea = usel.length - 1;
                eb = user.length - 1;
                compare:for(;;) {
                  if(ia <= ea) {
                    ca = usel[ia]
                  }else {
                    if(ib > eb) {
                      if(set.form != MathContext.prototype.PLAIN) {
                        return this.ZERO
                      }
                      break compare
                    }
                    ca = 0
                  }
                  if(ib <= eb) {
                    cb = user[ib]
                  }else {
                    cb = 0
                  }
                  if(ca != cb) {
                    if(ca < cb) {
                      t = usel;
                      usel = user;
                      user = t;
                      tlen = usellen;
                      usellen = userlen;
                      userlen = tlen;
                      res.ind = -res.ind
                    }
                    break compare
                  }
                  ia++;
                  ib++
                }
              }
            }
          }
        }while(false)
      }while(false)
    }
    res.mant = this.byteaddsub(usel, usellen, user, userlen, mult, false);
    return res.finish(set, false)
  }
  function compareTo() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"compareTo(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    var thislength = 0;
    var i = 0;
    var newrhs;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    if(this.ind == rhs.ind && this.exp == rhs.exp) {
      thislength = this.mant.length;
      if(thislength < rhs.mant.length) {
        return-this.ind
      }
      if(thislength > rhs.mant.length) {
        return this.ind
      }
      if(thislength <= set.digits || set.digits == 0) {
        var $6 = thislength;
        i = 0;
        i:for(;$6 > 0;$6--, i++) {
          if(this.mant[i] < rhs.mant[i]) {
            return-this.ind
          }
          if(this.mant[i] > rhs.mant[i]) {
            return this.ind
          }
        }
        return 0
      }
    }else {
      if(this.ind < rhs.ind) {
        return-1
      }
      if(this.ind > rhs.ind) {
        return 1
      }
    }
    newrhs = this.clone(rhs);
    newrhs.ind = -newrhs.ind;
    return this.add(newrhs, set).ind
  }
  function divide() {
    var set;
    var scale = -1;
    if(arguments.length == 2) {
      if(typeof arguments[1] == "number") {
        set = new MathContext(0, MathContext.prototype.PLAIN, false, arguments[1])
      }else {
        set = arguments[1]
      }
    }else {
      if(arguments.length == 3) {
        scale = arguments[1];
        if(scale < 0) {
          throw"divide(): Negative scale: " + scale;
        }
        set = new MathContext(0, MathContext.prototype.PLAIN, false, arguments[2])
      }else {
        if(arguments.length == 1) {
          set = this.plainMC
        }else {
          throw"divide(): " + arguments.length + " arguments given; expected between 1 and 3";
        }
      }
    }
    var rhs = arguments[0];
    return this.dodivide("D", rhs, set, scale)
  }
  function divideInteger() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"divideInteger(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    return this.dodivide("I", rhs, set, 0)
  }
  function max() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"max(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    if(this.compareTo(rhs, set) >= 0) {
      return this.plus(set)
    }else {
      return rhs.plus(set)
    }
  }
  function min() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"min(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    if(this.compareTo(rhs, set) <= 0) {
      return this.plus(set)
    }else {
      return rhs.plus(set)
    }
  }
  function multiply() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"multiply(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    var lhs;
    var padding;
    var reqdig;
    var multer = null;
    var multand = null;
    var multandlen;
    var acclen = 0;
    var res;
    var acc;
    var n = 0;
    var mult = 0;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    lhs = this;
    padding = 0;
    reqdig = set.digits;
    if(reqdig > 0) {
      if(lhs.mant.length > reqdig) {
        lhs = this.clone(lhs).round(set)
      }
      if(rhs.mant.length > reqdig) {
        rhs = this.clone(rhs).round(set)
      }
    }else {
      if(lhs.exp > 0) {
        padding = padding + lhs.exp
      }
      if(rhs.exp > 0) {
        padding = padding + rhs.exp
      }
    }
    if(lhs.mant.length < rhs.mant.length) {
      multer = lhs.mant;
      multand = rhs.mant
    }else {
      multer = rhs.mant;
      multand = lhs.mant
    }
    multandlen = multer.length + multand.length - 1;
    if(multer[0] * multand[0] > 9) {
      acclen = multandlen + 1
    }else {
      acclen = multandlen
    }
    res = new BigDecimal;
    acc = this.createArrayWithZeros(acclen);
    var $7 = multer.length;
    n = 0;
    n:for(;$7 > 0;$7--, n++) {
      mult = multer[n];
      if(mult != 0) {
        acc = this.byteaddsub(acc, acc.length, multand, multandlen, mult, true)
      }
      multandlen--
    }
    res.ind = lhs.ind * rhs.ind;
    res.exp = lhs.exp + rhs.exp - padding;
    if(padding == 0) {
      res.mant = acc
    }else {
      res.mant = this.extend(acc, acc.length + padding)
    }
    return res.finish(set, false)
  }
  function negate() {
    var set;
    if(arguments.length == 1) {
      set = arguments[0]
    }else {
      if(arguments.length == 0) {
        set = this.plainMC
      }else {
        throw"negate(): " + arguments.length + " arguments given; expected 0 or 1";
      }
    }
    var res;
    if(set.lostDigits) {
      this.checkdigits(null, set.digits)
    }
    res = this.clone(this);
    res.ind = -res.ind;
    return res.finish(set, false)
  }
  function plus() {
    var set;
    if(arguments.length == 1) {
      set = arguments[0]
    }else {
      if(arguments.length == 0) {
        set = this.plainMC
      }else {
        throw"plus(): " + arguments.length + " arguments given; expected 0 or 1";
      }
    }
    if(set.lostDigits) {
      this.checkdigits(null, set.digits)
    }
    if(set.form == MathContext.prototype.PLAIN) {
      if(this.form == MathContext.prototype.PLAIN) {
        if(this.mant.length <= set.digits) {
          return this
        }
        if(set.digits == 0) {
          return this
        }
      }
    }
    return this.clone(this).finish(set, false)
  }
  function pow() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"pow(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    var n;
    var lhs;
    var reqdig;
    var workdigits = 0;
    var L = 0;
    var workset;
    var res;
    var seenbit;
    var i = 0;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    n = rhs.intcheck(this.MinArg, this.MaxArg);
    lhs = this;
    reqdig = set.digits;
    if(reqdig == 0) {
      if(rhs.ind == this.isneg) {
        throw"pow(): Negative power: " + rhs.toString();
      }
      workdigits = 0
    }else {
      if(rhs.mant.length + rhs.exp > reqdig) {
        throw"pow(): Too many digits: " + rhs.toString();
      }
      if(lhs.mant.length > reqdig) {
        lhs = this.clone(lhs).round(set)
      }
      L = rhs.mant.length + rhs.exp;
      workdigits = reqdig + L + 1
    }
    workset = new MathContext(workdigits, set.form, false, set.roundingMode);
    res = this.ONE;
    if(n == 0) {
      return res
    }
    if(n < 0) {
      n = -n
    }
    seenbit = false;
    i = 1;
    i:for(;;i++) {
      n <<= 1;
      if(n < 0) {
        seenbit = true;
        res = res.multiply(lhs, workset)
      }
      if(i == 31) {
        break i
      }
      if(!seenbit) {
        continue i
      }
      res = res.multiply(res, workset)
    }
    if(rhs.ind < 0) {
      res = this.ONE.divide(res, workset)
    }
    return res.finish(set, true)
  }
  function remainder() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"remainder(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    return this.dodivide("R", rhs, set, -1)
  }
  function subtract() {
    var set;
    if(arguments.length == 2) {
      set = arguments[1]
    }else {
      if(arguments.length == 1) {
        set = this.plainMC
      }else {
        throw"subtract(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var rhs = arguments[0];
    var newrhs;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    newrhs = this.clone(rhs);
    newrhs.ind = -newrhs.ind;
    return this.add(newrhs, set)
  }
  function equals(obj) {
    var rhs;
    var i = 0;
    var lca = null;
    var rca = null;
    if(obj == null) {
      return false
    }
    if(!(obj instanceof BigDecimal)) {
      return false
    }
    rhs = obj;
    if(this.ind != rhs.ind) {
      return false
    }
    if(this.mant.length == rhs.mant.length && this.exp == rhs.exp && this.form == rhs.form) {
      var $8 = this.mant.length;
      i = 0;
      i:for(;$8 > 0;$8--, i++) {
        if(this.mant[i] != rhs.mant[i]) {
          return false
        }
      }
    }else {
      lca = this.layout();
      rca = rhs.layout();
      if(lca.length != rca.length) {
        return false
      }
      var $9 = lca.length;
      i = 0;
      i:for(;$9 > 0;$9--, i++) {
        if(lca[i] != rca[i]) {
          return false
        }
      }
    }
    return true
  }
  function format() {
    var explaces;
    var exdigits;
    var exformint;
    var exround;
    if(arguments.length == 6) {
      explaces = arguments[2];
      exdigits = arguments[3];
      exformint = arguments[4];
      exround = arguments[5]
    }else {
      if(arguments.length == 2) {
        explaces = -1;
        exdigits = -1;
        exformint = MathContext.prototype.SCIENTIFIC;
        exround = this.ROUND_HALF_UP
      }else {
        throw"format(): " + arguments.length + " arguments given; expected 2 or 6";
      }
    }
    var before = arguments[0];
    var after = arguments[1];
    var num;
    var mag = 0;
    var thisafter = 0;
    var lead = 0;
    var newmant = null;
    var chop = 0;
    var need = 0;
    var oldexp = 0;
    var a;
    var p = 0;
    var newa = null;
    var i = 0;
    var places = 0;
    if(before < -1 || before == 0) {
      this.badarg("format", 1, before)
    }
    if(after < -1) {
      this.badarg("format", 2, after)
    }
    if(explaces < -1 || explaces == 0) {
      this.badarg("format", 3, explaces)
    }
    if(exdigits < -1) {
      this.badarg("format", 4, exdigits)
    }
    if(exformint == MathContext.prototype.SCIENTIFIC) {
    }else {
      if(exformint == MathContext.prototype.ENGINEERING) {
      }else {
        if(exformint == -1) {
          exformint = MathContext.prototype.SCIENTIFIC
        }else {
          this.badarg("format", 5, exformint)
        }
      }
    }
    if(exround != this.ROUND_HALF_UP) {
      try {
        if(exround == -1) {
          exround = this.ROUND_HALF_UP
        }else {
          new MathContext(9, MathContext.prototype.SCIENTIFIC, false, exround)
        }
      }catch($10) {
        this.badarg("format", 6, exround)
      }
    }
    num = this.clone(this);
    setform:do {
      if(exdigits == -1) {
        num.form = MathContext.prototype.PLAIN
      }else {
        if(num.ind == this.iszero) {
          num.form = MathContext.prototype.PLAIN
        }else {
          mag = num.exp + num.mant.length;
          if(mag > exdigits) {
            num.form = exformint
          }else {
            if(mag < -5) {
              num.form = exformint
            }else {
              num.form = MathContext.prototype.PLAIN
            }
          }
        }
      }
    }while(false);
    if(after >= 0) {
      setafter:for(;;) {
        if(num.form == MathContext.prototype.PLAIN) {
          thisafter = -num.exp
        }else {
          if(num.form == MathContext.prototype.SCIENTIFIC) {
            thisafter = num.mant.length - 1
          }else {
            lead = (num.exp + num.mant.length - 1) % 3;
            if(lead < 0) {
              lead = 3 + lead
            }
            lead++;
            if(lead >= num.mant.length) {
              thisafter = 0
            }else {
              thisafter = num.mant.length - lead
            }
          }
        }
        if(thisafter == after) {
          break setafter
        }
        if(thisafter < after) {
          newmant = this.extend(num.mant, num.mant.length + after - thisafter);
          num.mant = newmant;
          num.exp = num.exp - (after - thisafter);
          if(num.exp < this.MinExp) {
            throw"format(): Exponent Overflow: " + num.exp;
          }
          break setafter
        }
        chop = thisafter - after;
        if(chop > num.mant.length) {
          num.mant = this.ZERO.mant;
          num.ind = this.iszero;
          num.exp = 0;
          continue setafter
        }
        need = num.mant.length - chop;
        oldexp = num.exp;
        num.round(need, exround);
        if(num.exp - oldexp == chop) {
          break setafter
        }
      }
    }
    a = num.layout();
    if(before > 0) {
      var $11 = a.length;
      p = 0;
      p:for(;$11 > 0;$11--, p++) {
        if(a[p] == ".") {
          break p
        }
        if(a[p] == "E") {
          break p
        }
      }
      if(p > before) {
        this.badarg("format", 1, before)
      }
      if(p < before) {
        newa = new Array(a.length + before - p);
        var $12 = before - p;
        i = 0;
        i:for(;$12 > 0;$12--, i++) {
          newa[i] = " "
        }
        this.arraycopy(a, 0, newa, i, a.length);
        a = newa
      }
    }
    if(explaces > 0) {
      var $13 = a.length - 1;
      p = a.length - 1;
      p:for(;$13 > 0;$13--, p--) {
        if(a[p] == "E") {
          break p
        }
      }
      if(p == 0) {
        newa = new Array(a.length + explaces + 2);
        this.arraycopy(a, 0, newa, 0, a.length);
        var $14 = explaces + 2;
        i = a.length;
        i:for(;$14 > 0;$14--, i++) {
          newa[i] = " "
        }
        a = newa
      }else {
        places = a.length - p - 2;
        if(places > explaces) {
          this.badarg("format", 3, explaces)
        }
        if(places < explaces) {
          newa = new Array(a.length + explaces - places);
          this.arraycopy(a, 0, newa, 0, p + 2);
          var $15 = explaces - places;
          i = p + 2;
          i:for(;$15 > 0;$15--, i++) {
            newa[i] = "0"
          }
          this.arraycopy(a, p + 2, newa, i, places);
          a = newa
        }
      }
    }
    return a.join("")
  }
  function intValueExact() {
    var lodigit;
    var useexp = 0;
    var result;
    var i = 0;
    var topdig = 0;
    if(this.ind == this.iszero) {
      return 0
    }
    lodigit = this.mant.length - 1;
    if(this.exp < 0) {
      lodigit = lodigit + this.exp;
      if(!this.allzero(this.mant, lodigit + 1)) {
        throw"intValueExact(): Decimal part non-zero: " + this.toString();
      }
      if(lodigit < 0) {
        return 0
      }
      useexp = 0
    }else {
      if(this.exp + lodigit > 9) {
        throw"intValueExact(): Conversion overflow: " + this.toString();
      }
      useexp = this.exp
    }
    result = 0;
    var $16 = lodigit + useexp;
    i = 0;
    i:for(;i <= $16;i++) {
      result = result * 10;
      if(i <= lodigit) {
        result = result + this.mant[i]
      }
    }
    if(lodigit + useexp == 9) {
      topdig = div(result, 1E9);
      if(topdig != this.mant[0]) {
        if(result == -2147483648) {
          if(this.ind == this.isneg) {
            if(this.mant[0] == 2) {
              return result
            }
          }
        }
        throw"intValueExact(): Conversion overflow: " + this.toString();
      }
    }
    if(this.ind == this.ispos) {
      return result
    }
    return-result
  }
  function movePointLeft(n) {
    var res;
    res = this.clone(this);
    res.exp = res.exp - n;
    return res.finish(this.plainMC, false)
  }
  function movePointRight(n) {
    var res;
    res = this.clone(this);
    res.exp = res.exp + n;
    return res.finish(this.plainMC, false)
  }
  function scale() {
    if(this.exp >= 0) {
      return 0
    }
    return-this.exp
  }
  function setScale() {
    var round;
    if(arguments.length == 2) {
      round = arguments[1]
    }else {
      if(arguments.length == 1) {
        round = this.ROUND_UNNECESSARY
      }else {
        throw"setScale(): " + arguments.length + " given; expected 1 or 2";
      }
    }
    var scale = arguments[0];
    var ourscale;
    var res;
    var padding = 0;
    var newlen = 0;
    ourscale = this.scale();
    if(ourscale == scale) {
      if(this.form == MathContext.prototype.PLAIN) {
        return this
      }
    }
    res = this.clone(this);
    if(ourscale <= scale) {
      if(ourscale == 0) {
        padding = res.exp + scale
      }else {
        padding = scale - ourscale
      }
      res.mant = this.extend(res.mant, res.mant.length + padding);
      res.exp = -scale
    }else {
      if(scale < 0) {
        throw"setScale(): Negative scale: " + scale;
      }
      newlen = res.mant.length - (ourscale - scale);
      res = res.round(newlen, round);
      if(res.exp != -scale) {
        res.mant = this.extend(res.mant, res.mant.length + 1);
        res.exp = res.exp - 1
      }
    }
    res.form = MathContext.prototype.PLAIN;
    return res
  }
  function signum() {
    return this.ind
  }
  function toString() {
    return this.layout().join("")
  }
  function layout() {
    var cmant;
    var i = 0;
    var sb = null;
    var euse = 0;
    var sig = 0;
    var csign = 0;
    var rec = null;
    var needsign;
    var mag;
    var len = 0;
    cmant = new Array(this.mant.length);
    var $18 = this.mant.length;
    i = 0;
    i:for(;$18 > 0;$18--, i++) {
      cmant[i] = this.mant[i] + ""
    }
    if(this.form != MathContext.prototype.PLAIN) {
      sb = "";
      if(this.ind == this.isneg) {
        sb += "-"
      }
      euse = this.exp + cmant.length - 1;
      if(this.form == MathContext.prototype.SCIENTIFIC) {
        sb += cmant[0];
        if(cmant.length > 1) {
          sb += "."
        }
        sb += cmant.slice(1).join("")
      }else {
        engineering:do {
          sig = euse % 3;
          if(sig < 0) {
            sig = 3 + sig
          }
          euse = euse - sig;
          sig++;
          if(sig >= cmant.length) {
            sb += cmant.join("");
            var $19 = sig - cmant.length;
            for(;$19 > 0;$19--) {
              sb += "0"
            }
          }else {
            sb += cmant.slice(0, sig).join("");
            sb += ".";
            sb += cmant.slice(sig).join("")
          }
        }while(false)
      }
      if(euse != 0) {
        if(euse < 0) {
          csign = "-";
          euse = -euse
        }else {
          csign = "+"
        }
        sb += "E";
        sb += csign;
        sb += euse
      }
      return sb.split("")
    }
    if(this.exp == 0) {
      if(this.ind >= 0) {
        return cmant
      }
      rec = new Array(cmant.length + 1);
      rec[0] = "-";
      this.arraycopy(cmant, 0, rec, 1, cmant.length);
      return rec
    }
    needsign = this.ind == this.isneg ? 1 : 0;
    mag = this.exp + cmant.length;
    if(mag < 1) {
      len = needsign + 2 - this.exp;
      rec = new Array(len);
      if(needsign != 0) {
        rec[0] = "-"
      }
      rec[needsign] = "0";
      rec[needsign + 1] = ".";
      var $20 = -mag;
      i = needsign + 2;
      i:for(;$20 > 0;$20--, i++) {
        rec[i] = "0"
      }
      this.arraycopy(cmant, 0, rec, needsign + 2 - mag, cmant.length);
      return rec
    }
    if(mag > cmant.length) {
      len = needsign + mag;
      rec = new Array(len);
      if(needsign != 0) {
        rec[0] = "-"
      }
      this.arraycopy(cmant, 0, rec, needsign, cmant.length);
      var $21 = mag - cmant.length;
      i = needsign + cmant.length;
      i:for(;$21 > 0;$21--, i++) {
        rec[i] = "0"
      }
      return rec
    }
    len = needsign + 1 + cmant.length;
    rec = new Array(len);
    if(needsign != 0) {
      rec[0] = "-"
    }
    this.arraycopy(cmant, 0, rec, needsign, mag);
    rec[needsign + mag] = ".";
    this.arraycopy(cmant, mag, rec, needsign + mag + 1, cmant.length - mag);
    return rec
  }
  function intcheck(min, max) {
    var i;
    i = this.intValueExact();
    if(i < min || i > max) {
      throw"intcheck(): Conversion overflow: " + i;
    }
    return i
  }
  function dodivide(code, rhs, set, scale) {
    var lhs;
    var reqdig;
    var newexp;
    var res;
    var newlen;
    var var1;
    var var1len;
    var var2;
    var var2len;
    var b2b;
    var have;
    var thisdigit = 0;
    var i = 0;
    var v2 = 0;
    var ba = 0;
    var mult = 0;
    var start = 0;
    var padding = 0;
    var d = 0;
    var newvar1 = null;
    var lasthave = 0;
    var actdig = 0;
    var newmant = null;
    if(set.lostDigits) {
      this.checkdigits(rhs, set.digits)
    }
    lhs = this;
    if(rhs.ind == 0) {
      throw"dodivide(): Divide by 0";
    }
    if(lhs.ind == 0) {
      if(set.form != MathContext.prototype.PLAIN) {
        return this.ZERO
      }
      if(scale == -1) {
        return lhs
      }
      return lhs.setScale(scale)
    }
    reqdig = set.digits;
    if(reqdig > 0) {
      if(lhs.mant.length > reqdig) {
        lhs = this.clone(lhs).round(set)
      }
      if(rhs.mant.length > reqdig) {
        rhs = this.clone(rhs).round(set)
      }
    }else {
      if(scale == -1) {
        scale = lhs.scale()
      }
      reqdig = lhs.mant.length;
      if(scale != -lhs.exp) {
        reqdig = reqdig + scale + lhs.exp
      }
      reqdig = reqdig - (rhs.mant.length - 1) - rhs.exp;
      if(reqdig < lhs.mant.length) {
        reqdig = lhs.mant.length
      }
      if(reqdig < rhs.mant.length) {
        reqdig = rhs.mant.length
      }
    }
    newexp = lhs.exp - rhs.exp + lhs.mant.length - rhs.mant.length;
    if(newexp < 0) {
      if(code != "D") {
        if(code == "I") {
          return this.ZERO
        }
        return this.clone(lhs).finish(set, false)
      }
    }
    res = new BigDecimal;
    res.ind = lhs.ind * rhs.ind;
    res.exp = newexp;
    res.mant = this.createArrayWithZeros(reqdig + 1);
    newlen = reqdig + reqdig + 1;
    var1 = this.extend(lhs.mant, newlen);
    var1len = newlen;
    var2 = rhs.mant;
    var2len = newlen;
    b2b = var2[0] * 10 + 1;
    if(var2.length > 1) {
      b2b = b2b + var2[1]
    }
    have = 0;
    outer:for(;;) {
      thisdigit = 0;
      inner:for(;;) {
        if(var1len < var2len) {
          break inner
        }
        if(var1len == var2len) {
          compare:do {
            var $22 = var1len;
            i = 0;
            i:for(;$22 > 0;$22--, i++) {
              if(i < var2.length) {
                v2 = var2[i]
              }else {
                v2 = 0
              }
              if(var1[i] < v2) {
                break inner
              }
              if(var1[i] > v2) {
                break compare
              }
            }
            thisdigit++;
            res.mant[have] = thisdigit;
            have++;
            var1[0] = 0;
            break outer
          }while(false);
          ba = var1[0]
        }else {
          ba = var1[0] * 10;
          if(var1len > 1) {
            ba = ba + var1[1]
          }
        }
        mult = div(ba * 10, b2b);
        if(mult == 0) {
          mult = 1
        }
        thisdigit = thisdigit + mult;
        var1 = this.byteaddsub(var1, var1len, var2, var2len, -mult, true);
        if(var1[0] != 0) {
          continue inner
        }
        var $23 = var1len - 2;
        start = 0;
        start:for(;start <= $23;start++) {
          if(var1[start] != 0) {
            break start
          }
          var1len--
        }
        if(start == 0) {
          continue inner
        }
        this.arraycopy(var1, start, var1, 0, var1len)
      }
      if(have != 0 || thisdigit != 0) {
        res.mant[have] = thisdigit;
        have++;
        if(have == reqdig + 1) {
          break outer
        }
        if(var1[0] == 0) {
          break outer
        }
      }
      if(scale >= 0) {
        if(-res.exp > scale) {
          break outer
        }
      }
      if(code != "D") {
        if(res.exp <= 0) {
          break outer
        }
      }
      res.exp = res.exp - 1;
      var2len--
    }
    if(have == 0) {
      have = 1
    }
    if(code == "I" || code == "R") {
      if(have + res.exp > reqdig) {
        throw"dodivide(): Integer overflow";
      }
      if(code == "R") {
        remainder:do {
          if(res.mant[0] == 0) {
            return this.clone(lhs).finish(set, false)
          }
          if(var1[0] == 0) {
            return this.ZERO
          }
          res.ind = lhs.ind;
          padding = reqdig + reqdig + 1 - lhs.mant.length;
          res.exp = res.exp - padding + lhs.exp;
          d = var1len;
          i = d - 1;
          i:for(;i >= 1;i--) {
            if(!(res.exp < lhs.exp && res.exp < rhs.exp)) {
              break
            }
            if(var1[i] != 0) {
              break i
            }
            d--;
            res.exp = res.exp + 1
          }
          if(d < var1.length) {
            newvar1 = new Array(d);
            this.arraycopy(var1, 0, newvar1, 0, d);
            var1 = newvar1
          }
          res.mant = var1;
          return res.finish(set, false)
        }while(false)
      }
    }else {
      if(var1[0] != 0) {
        lasthave = res.mant[have - 1];
        if(lasthave % 5 == 0) {
          res.mant[have - 1] = lasthave + 1
        }
      }
    }
    if(scale >= 0) {
      scaled:do {
        if(have != res.mant.length) {
          res.exp = res.exp - (res.mant.length - have)
        }
        actdig = res.mant.length - (-res.exp - scale);
        res.round(actdig, set.roundingMode);
        if(res.exp != -scale) {
          res.mant = this.extend(res.mant, res.mant.length + 1);
          res.exp = res.exp - 1
        }
        return res.finish(set, true)
      }while(false)
    }
    if(have == res.mant.length) {
      res.round(set);
      have = reqdig
    }else {
      if(res.mant[0] == 0) {
        return this.ZERO
      }
      newmant = new Array(have);
      this.arraycopy(res.mant, 0, newmant, 0, have);
      res.mant = newmant
    }
    return res.finish(set, true)
  }
  function bad(prefix, s) {
    throw prefix + "Not a number: " + s;
  }
  function badarg(name, pos, value) {
    throw"Bad argument " + pos + " to " + name + ": " + value;
  }
  function extend(inarr, newlen) {
    var newarr;
    if(inarr.length == newlen) {
      return inarr
    }
    newarr = createArrayWithZeros(newlen);
    this.arraycopy(inarr, 0, newarr, 0, inarr.length);
    return newarr
  }
  function byteaddsub(a, avlen, b, bvlen, m, reuse) {
    var alength;
    var blength;
    var ap;
    var bp;
    var maxarr;
    var reb;
    var quickm;
    var digit;
    var op = 0;
    var dp90 = 0;
    var newarr;
    var i = 0;
    alength = a.length;
    blength = b.length;
    ap = avlen - 1;
    bp = bvlen - 1;
    maxarr = bp;
    if(maxarr < ap) {
      maxarr = ap
    }
    reb = null;
    if(reuse) {
      if(maxarr + 1 == alength) {
        reb = a
      }
    }
    if(reb == null) {
      reb = this.createArrayWithZeros(maxarr + 1)
    }
    quickm = false;
    if(m == 1) {
      quickm = true
    }else {
      if(m == -1) {
        quickm = true
      }
    }
    digit = 0;
    op = maxarr;
    op:for(;op >= 0;op--) {
      if(ap >= 0) {
        if(ap < alength) {
          digit = digit + a[ap]
        }
        ap--
      }
      if(bp >= 0) {
        if(bp < blength) {
          if(quickm) {
            if(m > 0) {
              digit = digit + b[bp]
            }else {
              digit = digit - b[bp]
            }
          }else {
            digit = digit + b[bp] * m
          }
        }
        bp--
      }
      if(digit < 10) {
        if(digit >= 0) {
          quick:do {
            reb[op] = digit;
            digit = 0;
            continue op
          }while(false)
        }
      }
      dp90 = digit + 90;
      reb[op] = this.bytedig[dp90];
      digit = this.bytecar[dp90]
    }
    if(digit == 0) {
      return reb
    }
    newarr = null;
    if(reuse) {
      if(maxarr + 2 == a.length) {
        newarr = a
      }
    }
    if(newarr == null) {
      newarr = new Array(maxarr + 2)
    }
    newarr[0] = digit;
    var $24 = maxarr + 1;
    i = 0;
    i:for(;$24 > 0;$24--, i++) {
      newarr[i + 1] = reb[i]
    }
    return newarr
  }
  function diginit() {
    var work;
    var op = 0;
    var digit = 0;
    work = new Array(90 + 99 + 1);
    op = 0;
    op:for(;op <= 90 + 99;op++) {
      digit = op - 90;
      if(digit >= 0) {
        work[op] = digit % 10;
        BigDecimal.prototype.bytecar[op] = div(digit, 10);
        continue op
      }
      digit = digit + 100;
      work[op] = digit % 10;
      BigDecimal.prototype.bytecar[op] = div(digit, 10) - 10
    }
    return work
  }
  function clone(dec) {
    var copy;
    copy = new BigDecimal;
    copy.ind = dec.ind;
    copy.exp = dec.exp;
    copy.form = dec.form;
    copy.mant = dec.mant;
    return copy
  }
  function checkdigits(rhs, dig) {
    if(dig == 0) {
      return
    }
    if(this.mant.length > dig) {
      if(!this.allzero(this.mant, dig)) {
        throw"Too many digits: " + this.toString();
      }
    }
    if(rhs == null) {
      return
    }
    if(rhs.mant.length > dig) {
      if(!this.allzero(rhs.mant, dig)) {
        throw"Too many digits: " + rhs.toString();
      }
    }
    return
  }
  function round() {
    var len;
    var mode;
    if(arguments.length == 2) {
      len = arguments[0];
      mode = arguments[1]
    }else {
      if(arguments.length == 1) {
        var set = arguments[0];
        len = set.digits;
        mode = set.roundingMode
      }else {
        throw"round(): " + arguments.length + " arguments given; expected 1 or 2";
      }
    }
    var adjust;
    var sign;
    var oldmant;
    var reuse = false;
    var first = 0;
    var increment;
    var newmant = null;
    adjust = this.mant.length - len;
    if(adjust <= 0) {
      return this
    }
    this.exp = this.exp + adjust;
    sign = this.ind;
    oldmant = this.mant;
    if(len > 0) {
      this.mant = new Array(len);
      this.arraycopy(oldmant, 0, this.mant, 0, len);
      reuse = true;
      first = oldmant[len]
    }else {
      this.mant = this.ZERO.mant;
      this.ind = this.iszero;
      reuse = false;
      if(len == 0) {
        first = oldmant[0]
      }else {
        first = 0
      }
    }
    increment = 0;
    modes:do {
      if(mode == this.ROUND_HALF_UP) {
        if(first >= 5) {
          increment = sign
        }
      }else {
        if(mode == this.ROUND_UNNECESSARY) {
          if(!this.allzero(oldmant, len)) {
            throw"round(): Rounding necessary";
          }
        }else {
          if(mode == this.ROUND_HALF_DOWN) {
            if(first > 5) {
              increment = sign
            }else {
              if(first == 5) {
                if(!this.allzero(oldmant, len + 1)) {
                  increment = sign
                }
              }
            }
          }else {
            if(mode == this.ROUND_HALF_EVEN) {
              if(first > 5) {
                increment = sign
              }else {
                if(first == 5) {
                  if(!this.allzero(oldmant, len + 1)) {
                    increment = sign
                  }else {
                    if(this.mant[this.mant.length - 1] % 2 == 1) {
                      increment = sign
                    }
                  }
                }
              }
            }else {
              if(mode == this.ROUND_DOWN) {
              }else {
                if(mode == this.ROUND_UP) {
                  if(!this.allzero(oldmant, len)) {
                    increment = sign
                  }
                }else {
                  if(mode == this.ROUND_CEILING) {
                    if(sign > 0) {
                      if(!this.allzero(oldmant, len)) {
                        increment = sign
                      }
                    }
                  }else {
                    if(mode == this.ROUND_FLOOR) {
                      if(sign < 0) {
                        if(!this.allzero(oldmant, len)) {
                          increment = sign
                        }
                      }
                    }else {
                      throw"round(): Bad round value: " + mode;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }while(false);
    if(increment != 0) {
      bump:do {
        if(this.ind == this.iszero) {
          this.mant = this.ONE.mant;
          this.ind = increment
        }else {
          if(this.ind == this.isneg) {
            increment = -increment
          }
          newmant = this.byteaddsub(this.mant, this.mant.length, this.ONE.mant, 1, increment, reuse);
          if(newmant.length > this.mant.length) {
            this.exp++;
            this.arraycopy(newmant, 0, this.mant, 0, this.mant.length)
          }else {
            this.mant = newmant
          }
        }
      }while(false)
    }
    if(this.exp > this.MaxExp) {
      throw"round(): Exponent Overflow: " + this.exp;
    }
    return this
  }
  function allzero(array, start) {
    var i = 0;
    if(start < 0) {
      start = 0
    }
    var $25 = array.length - 1;
    i = start;
    i:for(;i <= $25;i++) {
      if(array[i] != 0) {
        return false
      }
    }
    return true
  }
  function finish(set, strip) {
    var d = 0;
    var i = 0;
    var newmant = null;
    var mag = 0;
    var sig = 0;
    if(set.digits != 0) {
      if(this.mant.length > set.digits) {
        this.round(set)
      }
    }
    if(strip) {
      if(set.form != MathContext.prototype.PLAIN) {
        d = this.mant.length;
        i = d - 1;
        i:for(;i >= 1;i--) {
          if(this.mant[i] != 0) {
            break i
          }
          d--;
          this.exp++
        }
        if(d < this.mant.length) {
          newmant = new Array(d);
          this.arraycopy(this.mant, 0, newmant, 0, d);
          this.mant = newmant
        }
      }
    }
    this.form = MathContext.prototype.PLAIN;
    var $26 = this.mant.length;
    i = 0;
    i:for(;$26 > 0;$26--, i++) {
      if(this.mant[i] != 0) {
        if(i > 0) {
          delead:do {
            newmant = new Array(this.mant.length - i);
            this.arraycopy(this.mant, i, newmant, 0, this.mant.length - i);
            this.mant = newmant
          }while(false)
        }
        mag = this.exp + this.mant.length;
        if(mag > 0) {
          if(mag > set.digits) {
            if(set.digits != 0) {
              this.form = set.form
            }
          }
          if(mag - 1 <= this.MaxExp) {
            return this
          }
        }else {
          if(mag < -5) {
            this.form = set.form
          }
        }
        mag--;
        if(mag < this.MinExp || mag > this.MaxExp) {
          overflow:do {
            if(this.form == MathContext.prototype.ENGINEERING) {
              sig = mag % 3;
              if(sig < 0) {
                sig = 3 + sig
              }
              mag = mag - sig;
              if(mag >= this.MinExp) {
                if(mag <= this.MaxExp) {
                  break overflow
                }
              }
            }
            throw"finish(): Exponent Overflow: " + mag;
          }while(false)
        }
        return this
      }
    }
    this.ind = this.iszero;
    if(set.form != MathContext.prototype.PLAIN) {
      this.exp = 0
    }else {
      if(this.exp > 0) {
        this.exp = 0
      }else {
        if(this.exp < this.MinExp) {
          throw"finish(): Exponent Overflow: " + this.exp;
        }
      }
    }
    this.mant = this.ZERO.mant;
    return this
  }
  function isGreaterThan(other) {
    return this.compareTo(other) > 0
  }
  function isLessThan(other) {
    return this.compareTo(other) < 0
  }
  function isGreaterThanOrEqualTo(other) {
    return this.compareTo(other) >= 0
  }
  function isLessThanOrEqualTo(other) {
    return this.compareTo(other) <= 0
  }
  function isPositive() {
    return this.compareTo(BigDecimal.prototype.ZERO) > 0
  }
  function isNegative() {
    return this.compareTo(BigDecimal.prototype.ZERO) < 0
  }
  function isZero() {
    return this.equals(BigDecimal.prototype.ZERO)
  }
  return BigDecimal
}(MathContext);
"use strict";
(function() {
  var messages = Assert.messages;
  Assert.reserveCodeRange(2E3, 2999, "mathmodel");
  messages[2001] = "Factoring multi-variate polynomials is not supported";
  messages[2002] = "Expressions of the form 'x^y^z' are not supported.";
  messages[2003] = "Factoring higher order polynomials is not supported.";
  messages[2004] = "Compound units not supported.";
  messages[2005] = "Expressions with variables cannot be compared with equivValue.";
  messages[2006] = "More that two equals symbols in equation.";
  messages[2007] = "equivValue of lists not supported.";
  messages[2008] = "Tolerances are not supported on unit expressions.";
  messages[2009] = "Units must be specified on none or both values for equivValue.";
  messages[2010] = "Invalid option name %1.";
  messages[2011] = "Invalid option value %2 for option %1.";
  var bigOne = new BigDecimal("1");
  var bigZero = new BigDecimal("0");
  var bigMinusOne = new BigDecimal("-1");
  function isZero(n) {
    if(n === null) {
      return false
    }else {
      if(n instanceof BigDecimal) {
        return!bigZero.compareTo(n)
      }else {
        if(typeof n === "number") {
          return n === 0
        }else {
          if(n.op !== undefined) {
            return!bigZero.compareTo(mathValue(n))
          }
        }
      }
    }
    assert(false, "Internal error: unable to compare with zero.")
  }
  function isOne(n) {
    if(n === null) {
      return false
    }else {
      if(n instanceof BigDecimal) {
        return!bigOne.compareTo(n)
      }else {
        if(typeof n === "number") {
          return n === 1
        }else {
          if(n.op !== undefined) {
            return!bigOne.compareTo(mathValue(n))
          }
        }
      }
    }
    assert(false, "Internal error: unable to compare with zero.")
  }
  function isMinusOne(n) {
    if(n === null) {
      return false
    }else {
      if(n instanceof BigDecimal) {
        return!bigMinusOne.compareTo(n)
      }else {
        if(typeof n === "number") {
          return n === -1
        }else {
          if(n.op !== undefined) {
            return!bigMinusOne.compareTo(mathValue(n))
          }
        }
      }
    }
    assert(false, "Internal error: unable to compare with zero.")
  }
  function toNumber(bd) {
    if(!bd) {
      return NaN
    }
    return parseFloat(bd.toString())
  }
  function Visitor() {
    function visit(node, visit) {
      assert(node.op && node.args, "Visitor.visit() op=" + node.op + " args = " + node.args);
      switch(node.op) {
        case Model.NUM:
          node = visit.numeric(node);
          break;
        case Model.ADD:
        ;
        case Model.SUB:
        ;
        case Model.PM:
          if(node.args.length === 1) {
            node = visit.unary(node)
          }else {
            node = visit.additive(node)
          }
          break;
        case Model.MUL:
        ;
        case Model.DIV:
        ;
        case Model.FRAC:
          node = visit.multiplicative(node);
          break;
        case Model.POW:
        ;
        case Model.LOG:
          node = visit.exponential(node);
          break;
        case Model.VAR:
          node = visit.variable(node);
          break;
        case Model.SQRT:
        ;
        case Model.COS:
        ;
        case Model.SIN:
        ;
        case Model.TAN:
        ;
        case Model.SEC:
        ;
        case Model.CSC:
        ;
        case Model.COT:
        ;
        case Model.PERCENT:
        ;
        case Model.M:
        ;
        case Model.ABS:
          node = visit.unary(node);
          break;
        case Model.COMMA:
          node = visit.comma(node);
          break;
        case Model.EQL:
        ;
        case Model.LT:
        ;
        case Model.LE:
        ;
        case Model.GT:
        ;
        case Model.GE:
          node = visit.equals(node);
          break;
        default:
          assert(false, "Should not get here. Unhandled node operator " + node.op);
          break
      }
      return node
    }
    function degree(root, notAbsolute) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"degree", exponential:function(node) {
        var args = node.args;
        var d;
        if(node.op === Model.POW) {
          var expo = mathValue(args[1]);
          if(expo) {
            if(notAbsolute) {
              d = degree(args[0], notAbsolute) * toNumber(expo)
            }else {
              d = degree(args[0], notAbsolute) * Math.abs(toNumber(expo))
            }
          }else {
            d = Number.POSITIVE_INFINITY
          }
        }else {
          if(node.op === Model.LOG) {
            d = Number.POSITIVE_INFINITY
          }
        }
        return d
      }, multiplicative:function(node) {
        var args = node.args;
        var d = 0;
        forEach(args, function(n) {
          d += degree(n, notAbsolute)
        });
        return d
      }, additive:function(node) {
        var args = node.args;
        var d = 0;
        var t;
        forEach(args, function(n) {
          t = degree(n, notAbsolute);
          if(t > d) {
            d = t
          }
        });
        return d
      }, numeric:function(node) {
        return 0
      }, unary:function(node) {
        var args = node.args;
        var d = degree(args[0], notAbsolute);
        switch(node.op) {
          case Model.ADD:
          ;
          case Model.SUB:
          ;
          case Model.COS:
          ;
          case Model.SIN:
          ;
          case Model.TAN:
          ;
          case Model.SEC:
          ;
          case Model.CSC:
          ;
          case Model.COT:
          ;
          case Model.PM:
          ;
          case Model.PERCENT:
          ;
          case Model.M:
          ;
          case Model.ABS:
            return d;
          case Model.SQRT:
            assert(args.length === 1, message(2003));
            return d / 2;
          default:
            assert(false, "Should not get here. Unhandled case.");
            return 0
        }
      }, variable:function(node) {
        if(!name || node.args[0] === name) {
          return 1
        }
        return 0
      }, comma:function(node) {
        var args = node.args;
        var dd = [];
        forEach(args, function(n) {
          dd = dd.concat(degree(n, notAbsolute))
        });
        return dd
      }, equals:function(node) {
        var args = node.args;
        var d = 0;
        var t;
        forEach(args, function(n) {
          t = degree(n, notAbsolute);
          if(t > d) {
            d = t
          }
        });
        return d
      }})
    }
    function coeff(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return numberNode("0")
      }
      return visit(root, {name:"coeff", exponential:function(node) {
        var base = mathValue(node.args[0]);
        var expo = mathValue(node.args[1]);
        if(base !== null && (expo !== 0 && expo !== null)) {
          return node
        }else {
          return numberNode("1")
        }
      }, multiplicative:function(node) {
        var args = node.args;
        var val = bigOne;
        var ff = [];
        forEach(args, function(n) {
          var d = degree(n);
          var mv = mathValue(n);
          if(mv !== null) {
            if(isOne(mv)) {
            }else {
              if(isZero(mv)) {
                ff.push(numberNode("0"))
              }else {
                ff.push(n)
              }
            }
          }
        });
        if(ff.length === 0) {
          return numberNode("1")
        }else {
          if(ff.length === 1) {
            return ff[0]
          }
        }
        return multiplyNode(ff)
      }, additive:function(node) {
        return numberNode("1")
      }, unary:function(node) {
        if(node.op === Model.M) {
          return numberNode("1")
        }
        var c = coeff(node.args[0]);
        if(c !== null) {
          return unaryNode(node.op, [c])
        }
        return node
      }, numeric:function(node) {
        return node
      }, variable:function(node) {
        return numberNode("1")
      }, comma:function(node) {
        return null
      }, equals:function(node) {
        return null
      }})
    }
    function variables(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"variables", exponential:function(node) {
        var args = node.args;
        var val = [];
        forEach(args, function(n) {
          var vars = variables(n);
          forEach(vars, function(v) {
            if(indexOf(val, v) < 0) {
              val.push(v)
            }
          })
        });
        return val
      }, multiplicative:function(node) {
        var args = node.args;
        var val = [];
        forEach(args, function(n) {
          var vars = variables(n);
          forEach(vars, function(v) {
            if(indexOf(val, v) < 0) {
              val.push(v)
            }
          })
        });
        return val
      }, additive:function(node) {
        var args = node.args;
        var val = [];
        forEach(args, function(n) {
          var vars = variables(n);
          forEach(vars, function(v) {
            if(indexOf(val, v) < 0) {
              val.push(v)
            }
          })
        });
        return val
      }, unary:function(node) {
        return variables(node.args[0])
      }, numeric:function(node) {
        return[]
      }, variable:function(node) {
        return[node.args[0]]
      }, comma:function(node) {
        var args = node.args;
        var val = [];
        forEach(args, function(n) {
          val = val.concat(variables(n))
        });
        return val
      }, equals:function(node) {
        var args = node.args;
        var val = [];
        forEach(args, function(n) {
          val = val.concat(variables(n))
        });
        return val
      }})
    }
    function variablePart(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return null
      }
      return visit(root, {name:"variablePart", exponential:function(node) {
        if(degree(node) !== 0) {
          return node
        }
        return null
      }, multiplicative:function(node) {
        var args = node.args;
        var vals = [];
        forEach(args, function(n) {
          var v = variablePart(n);
          if(v !== null) {
            vals.push(v)
          }
        });
        if(vals.length === 0) {
          return null
        }else {
          if(vals.length === 1) {
            return vals[0]
          }
        }
        return multiplyNode(vals)
      }, additive:function(node) {
        if(mathValue(node) !== null) {
          return null
        }
        return node
      }, unary:function(node) {
        var vp = variablePart(node.args[0]);
        if(vp !== null) {
          return node
        }
        return null
      }, numeric:function(node) {
        return null
      }, variable:function(node) {
        return node
      }, comma:function(node) {
        return null
      }, equals:function(node) {
        return null
      }})
    }
    function terms(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"terms", exponential:function(node) {
        return[node]
      }, multiplicative:function(node) {
        return[node]
      }, additive:function(node) {
        var vals = [];
        forEach(node.args, function(n) {
          vals = vals.concat(terms(n))
        });
        return vals
      }, unary:function(node) {
        return[node]
      }, numeric:function(node) {
        return[node]
      }, variable:function(node) {
        return[node]
      }, comma:function(node) {
        var vals = [];
        forEach(node.args, function(n) {
          vals = vals.concat(terms(n))
        });
        return vals
      }, equals:function(node) {
        var vals = [];
        forEach(node.args, function(n) {
          vals = vals.concat(terms(n))
        });
        return vals
      }})
    }
    function normalize(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      var nid = Ast.intern(root);
      var node = Model.create(visit(root, {name:"normalized", numeric:function(node) {
        var arg0 = +node.args[0];
        if(arg0 < 0 && arg0 !== -1) {
          node = multiplyNode([numberNode("-1"), numberNode(Math.abs(arg0.toString()))])
        }
        return node
      }, additive:function(node) {
        assert(node.op !== Model.SUB, "Subtraction should be eliminated during parsing");
        if(node.op === Model.PM) {
          assert(node.args.length === 2, "Operator pm can only be used on binary nodes");
          node = binaryNode(Model.ADD, [node.args[0], {op:Model.PM, args:[node.args[1]]}])
        }
        var args = [];
        node = flattenNestedNodes(node);
        return sort(node)
      }, multiplicative:function(node) {
        assert(node.op !== Model.DIV, "Divsion should be eliminated during parsing");
        var args = [];
        forEach(node.args, function(n) {
          n = normalize(n);
          if(Ast.intern(n) === Ast.intern(numberNode("1"))) {
            return
          }
          if(n.op === Model.MUL) {
            args = args.concat(n.args)
          }else {
            args.push(n)
          }
        });
        if(args.length === 0) {
          node = numberNode("1")
        }else {
          if(args.length === 1) {
            node = args[0]
          }else {
            node = sort(binaryNode(node.op, args))
          }
        }
        return node
      }, unary:function(node) {
        var arg0 = normalize(node.args[0]);
        switch(node.op) {
          case Model.SUB:
            if(arg0.op === Model.MUL) {
              arg0.args.push(numberNode("-1"));
              node = arg0
            }else {
              node = multiplyNode([arg0, numberNode("-1")])
            }
            break;
          case Model.PERCENT:
            node = multiplyNode([binaryNode(Model.POW, [numberNode("100"), numberNode("-1")]), arg0]);
            break;
          default:
            node = unaryNode(node.op, [arg0]);
            break
        }
        return node
      }, variable:function(node) {
        if(option("allowDecimal") && node.args[0] === "\\pi") {
          node = numberNode(Math.PI)
        }
        return node
      }, exponential:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          n = normalize(n);
          args.push(n)
        });
        return binaryNode(node.op, args)
      }, comma:function(node) {
        var vals = [];
        forEach(node.args, function(n) {
          vals = vals.concat(normalize(n))
        });
        var node = {op:Model.COMMA, args:vals};
        return node
      }, equals:function(node) {
        assert(node.args.length === 2, message(2006));
        if(node.op === Model.GT || node.op === Model.GE) {
          node.op = node.op === Model.GT ? Model.LE : Model.LT;
          var t = node.args[0];
          node.args[0] = node.args[1];
          node.args[1] = t
        }
        node = sort(node);
        if(!isOne(mathValue(node.args[1]))) {
          var lnode = multiplyNode([node.args[0], binaryNode(Model.POW, [node.args[1], numberNode("-1")])]);
          node = binaryNode(node.op, [normalize(lnode), numberNode("1")])
        }
        return node
      }}), root.location);
      while(nid !== Ast.intern(node)) {
        nid = Ast.intern(node);
        node = normalize(node)
      }
      return node
    }
    function sort(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"sort", numeric:function(node) {
        return node
      }, additive:function(node) {
        var args = [];
        forEach(node.args, function(n, i) {
          args.push(sort(n))
        });
        node = binaryNode(node.op, args);
        if(node.op === Model.PM) {
          return node
        }
        var d0, d1;
        var n0, n1;
        var v0, v1;
        for(var i = 0;i < node.args.length - 1;i++) {
          n0 = node.args[i];
          n1 = node.args[i + 1];
          d0 = degree(node.args[i]);
          d1 = degree(node.args[i + 1]);
          if(d0 < d1) {
            node.args[i] = n1;
            node.args[i + 1] = n0
          }else {
            if(d0 === d1) {
              v0 = variables(n0);
              v1 = variables(n1);
              if(v0.length !== v1.length) {
                if(v0.length < v1.length) {
                  node.args[i] = n1;
                  node.args[i + 1] = n0
                }
              }else {
                if(v0.length > 0) {
                  if(v0.join("") !== v1.join("")) {
                    if(v0.join("") < v1.join("")) {
                      node.args[i] = n1;
                      node.args[i + 1] = n0
                    }
                  }else {
                    if(isLessThan(coeff(n0), coeff(n1))) {
                      node.args[i] = n1;
                      node.args[i + 1] = n0
                    }
                  }
                }else {
                  if(d0 === 0) {
                    if(exponent(n0) !== exponent(n1)) {
                      if(exponent(n0) < exponent(n1)) {
                        node.args[i] = n1;
                        node.args[i + 1] = n0
                      }
                    }else {
                      if(isLessThan(coeff(n0), coeff(n1))) {
                        node.args[i] = n1;
                        node.args[i + 1] = n0
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return node
      }, multiplicative:function(node) {
        var args = [];
        forEach(node.args, function(n, i) {
          args.push(sort(n))
        });
        node = binaryNode(node.op, args);
        var d0, d1;
        var n0, n1;
        var v0, v1;
        for(var i = 0;i < node.args.length - 1;i++) {
          n0 = node.args[i];
          n1 = node.args[i + 1];
          d0 = Math.abs(degree(n0));
          d1 = Math.abs(degree(n1));
          if(d0 > d1) {
            node.args[i] = n1;
            node.args[i + 1] = n0
          }else {
            if(d0 === d1) {
              v0 = variables(n0);
              v1 = variables(n1);
              var e0 = exponent(n0);
              var e1 = exponent(n1);
              if(e0 !== e1 && (!isNaN(e0) && !isNaN(e1))) {
                if(e0 < e1) {
                  node.args[i] = n1;
                  node.args[i + 1] = n0
                }
              }else {
                if(v0.length !== v1.length && v0.length < v1.length || v0.length > 0 && v0[0] < v1[0]) {
                  var t = node.args[i];
                  node.args[i] = n1;
                  node.args[i + 1] = n0
                }
              }
            }
          }
        }
        return node
      }, unary:function(node) {
        node.args[0] = sort(node.args[0]);
        return node
      }, exponential:function(node) {
        return node
      }, variable:function(node) {
        return node
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(sort(n))
        });
        return{op:Model.COMMA, args:args}
      }, equals:function(node) {
        forEach(node.args, function(n, i) {
          node.args[i] = sort(n)
        });
        if(node.op !== Model.EQL) {
          return node
        }
        var d0, d1;
        var n0, n1;
        var v0, v1;
        for(var i = 0;i < node.args.length - 1;i++) {
          n0 = node.args[i];
          n1 = node.args[i + 1];
          if((d0 = degree(node.args[i], true)) < (d1 = degree(node.args[i + 1], true))) {
            node.args[i] = n1;
            node.args[i + 1] = n0
          }else {
            if(d0 === d1) {
              v0 = variables(n0);
              v1 = variables(n1);
              if(v0.length !== v1.length && v0.length < v1.length || v0.length > 0 && v0[0] < v1[0]) {
                var t = node.args[i];
                node.args[i] = n1;
                node.args[i + 1] = n0
              }
            }
          }
        }
        return node
      }})
    }
    function isAdditive(node) {
      return node.op === Model.ADD || (node.op === Model.SUB || node.op === Model.PM)
    }
    function isMultiplicative(node) {
      return node.op === Model.MUL || node.op === Model.DIV
    }
    function isInteger(bd) {
      if(bd === null) {
        return false
      }
      return bd.remainder(bigOne).compareTo(bigZero) === 0
    }
    function isLessThan(n1, n2) {
      if(n1.op !== undefined) {
        n1 = mathValue(n1)
      }
      if(n2.op !== undefined) {
        n2 = mathValue(n2)
      }
      if(n1 === null || (!(n1 instanceof BigDecimal) || (n2 === null || !(n1 instanceof BigDecimal)))) {
        return false
      }
      return n1.compareTo(n2) < 0
    }
    function isNeg(n) {
      if(n.op === Model.NUM) {
        n = mathValue(n)
      }
      return n.compareTo(bigZero) < 0
    }
    function isPos(bd) {
      return bd.compareTo(bigZero) > 0
    }
    function pow(b, e) {
      var val;
      if(b === null || e === null) {
        return null
      }
      if(b instanceof BigDecimal) {
        if(isInteger(e)) {
          val = b.pow(e.abs());
          if(isNeg(e)) {
            val = divide(bigOne, val)
          }
          return val
        }else {
          b = toNumber(b);
          e = toNumber(e);
          val = Math.pow(b, e);
          if(isNaN(val)) {
            return null
          }
          return new BigDecimal(val.toString())
        }
      }else {
        return new BigDecimal(Math.pow(b, e).toString())
      }
    }
    function sqrtNode(node) {
      return binaryNode(Model.POW, [n, {op:Model.NUM, args:["2"]}, {op:Model.NUM, args:["-1"]}])
    }
    function numberNode(n, doScale, roundOnly) {
      if(doScale) {
        var n = new BigDecimal(n.toString());
        var scale = option("decimalPlaces");
        if(!roundOnly || n.scale() > scale) {
          n = n.setScale(scale, BigDecimal.ROUND_HALF_UP)
        }
      }
      return{op:Model.NUM, args:[n.toString()]}
    }
    function multiplyNode(args, flatten) {
      return binaryNode(Model.MUL, args, flatten)
    }
    function unaryNode(op, args) {
      assert(args.length === 1, "Wrong number of arguments for unary node");
      if(op === Model.ADD) {
        return args[0]
      }else {
        return{op:op, args:args}
      }
    }
    function binaryNode(op, args, flatten) {
      if(args.length < 2) {
        return args
      }
      var aa = [];
      forEach(args, function(n) {
        if(flatten && n.op === op) {
          aa = aa.concat(n.args)
        }else {
          aa.push(n)
        }
      });
      return{op:op, args:aa}
    }
    function divide(n, d) {
      if(n === null || d === null) {
        return null
      }
      if(n instanceof BigDecimal) {
        n = toNumber(n);
        d = toNumber(d)
      }
      return new BigDecimal((n / d).toString())
    }
    function sqrt(n) {
      if(n instanceof BigDecimal) {
        if(n === null) {
          return null
        }
        n = toNumber(n)
      }else {
        if(isNaN(n)) {
          return null
        }
      }
      return(new BigDecimal(Math.sqrt(n).toString())).setScale(option("decimalPlaces"), BigDecimal.ROUND_HALF_UP)
    }
    function abs(n) {
      if(n instanceof BigDecimal) {
        if(n === null) {
          return null
        }
        n = toNumber(n)
      }else {
        if(isNaN(n)) {
          return null
        }
      }
      return new BigDecimal(Math.abs(n).toString())
    }
    function flattenNestedNodes(node, doSimplify) {
      var args = [];
      forEach(node.args, function(n) {
        if(doSimplify) {
          n = simplify(n)
        }
        n = normalize(n);
        if(n.op === node.op) {
          args = args.concat(n.args)
        }else {
          args.push(n)
        }
      });
      return binaryNode(node.op, args)
    }
    function groupLikes(node) {
      var hash = {};
      var vp, vpnid, list;
      forEach(node.args, function(n, i) {
        if(node.op === Model.MUL) {
          vp = variables(n).join("")
        }else {
          vp = variablePart(n)
        }
        if(vp) {
          vpnid = Ast.intern(vp)
        }else {
          vpnid = "none"
        }
        list = hash[vpnid] ? hash[vpnid] : hash[vpnid] = [];
        list.push(n)
      });
      var args = [];
      forEach(keys(hash), function(k) {
        var aa = hash[k];
        assert(aa);
        if(aa.length > 1) {
          args.push(binaryNode(node.op, aa))
        }else {
          args.push(aa[0])
        }
      });
      if(args.length > 1) {
        node = binaryNode(node.op, args)
      }else {
        assert(args.length !== 0);
        node = args[0]
      }
      return node
    }
    function groupIdenticalFactors(node) {
      var hash = {};
      var nid, list;
      var ff = factors(node, null, false, true);
      forEach(ff, function(n, i) {
        var nid = Ast.intern(n);
        list = hash[nid] ? hash[nid] : hash[nid] = [];
        list.push(n)
      });
      var args = [];
      forEach(keys(hash), function(k) {
        var aa = hash[k];
        assert(aa);
        if(aa.length > 1) {
          args.push(binaryNode(Model.MUL, aa))
        }else {
          args.push(aa[0])
        }
      });
      return args
    }
    function simplify(root, env) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      var nid = Ast.intern(root);
      var node = Model.create(visit(root, {name:"simplify", numeric:function(node) {
        assert(typeof node.args[0] === "string");
        return node
      }, additive:function(node) {
        assert(node.op !== Model.SUB, "simplify() additive node not normalized: " + JSON.stringify(node));
        if(node.op === Model.PM) {
          return node
        }
        node = flattenNestedNodes(node);
        node = groupLikes(node);
        if(!isAdditive(node)) {
          return simplify(args[0])
        }
        var args = node.args.slice(0);
        var args2 = [args.shift()];
        forEach(args, function(n1, i) {
          if(!isZero(mathValue(n1))) {
            args2 = args2.concat(unfold(args2.pop(), n1))
          }
        });
        args = args2;
        if(args.length > 1) {
          node = binaryNode(node.op, args)
        }else {
          if(isAdditive(args[0])) {
            assert(args.length !== 0);
            node = args[0]
          }else {
            return simplify(args[0])
          }
        }
        var args = node.args.slice(0);
        var n0 = [simplify(args.shift())];
        forEach(args, function(n1, i) {
          n1 = simplify(n1);
          if(!isZero(mathValue(n1))) {
            var t = fold(n0.pop(), n1);
            n0 = n0.concat(t)
          }
        });
        if(n0.length < 2) {
          node = n0[0]
        }else {
          node = binaryNode(node.op, n0)
        }
        assert(node.args.length > 0);
        return node;
        function unfold(lnode, rnode) {
          var ldeg = degree(lnode);
          var rdeg = degree(rnode);
          if(isZero(ldeg) && isZero(rdeg)) {
            var lfact = factors(lnode, null, false, true);
            var rfact = factors(rnode, null, false, true);
            var ldenom = numberNode("1"), lnumer = numberNode("1");
            forEach(lfact, function(n) {
              if(n.op === Model.POW && isMinusOne(mathValue(n.args[1]))) {
                if(!isOne(ldenom)) {
                  ldenom = multiplyNode([ldenom, n.args[0]], true)
                }else {
                  ldenom = n.args[0]
                }
              }else {
                if(!isOne(lnumer)) {
                  lnumer = multiplyNode([lnumer, n], true)
                }else {
                  lnumer = n
                }
              }
            });
            var rdenom = numberNode("1"), rnumer = numberNode("1");
            forEach(rfact, function(n) {
              if(n.op === Model.POW && isMinusOne(mathValue(n.args[1]))) {
                if(!isOne(rdenom)) {
                  rdenom = multiplyNode([rdenom, n.args[0]], true)
                }else {
                  rdenom = n.args[0]
                }
              }else {
                if(!isOne(rnumer)) {
                  rnumer = multiplyNode([rnumer, n], true)
                }else {
                  rnumer = n
                }
              }
            });
            var mvldenom = mathValue(ldenom);
            var mvrdenom = mathValue(rdenom);
            if(mvldenom !== null && (mvrdenom !== null && isZero(mvldenom.compareTo(mvrdenom)))) {
              if(isZero(mvldenom.compareTo(bigOne))) {
                return[binaryNode(Model.ADD, [lnumer, rnumer])]
              }else {
                return[multiplyNode([binaryNode(Model.ADD, [lnumer, rnumer]), binaryNode(Model.POW, [ldenom, numberNode("-1")])])]
              }
            }else {
              lnumer = multiplyNode([rdenom, lnumer], true);
              rnumer = multiplyNode([ldenom, rnumer], true);
              return[multiplyNode([binaryNode(Model.ADD, [lnumer, rnumer]), binaryNode(Model.POW, [multiplyNode([ldenom, rdenom]), numberNode("-1")])])]
            }
          }
          return[lnode, rnode]
        }
        function fold(lnode, rnode) {
          var ldegr = degree(lnode);
          var rdegr = degree(rnode);
          var lcoeff = coeff(lnode);
          var rcoeff = coeff(rnode);
          if(ldegr === rdegr) {
            var lvpart = variablePart(lnode);
            var rvpart = variablePart(rnode);
            if(lvpart !== null && (rvpart !== null && Ast.intern(lvpart) === Ast.intern(rvpart))) {
              var c = binaryNode(Model.ADD, [lcoeff, rcoeff]);
              var cmv = mathValue(c);
              if(isZero(cmv)) {
                return numberNode("0")
              }else {
                if(isOne(cmv)) {
                  return lvpart
                }
              }
              return multiplyNode([c, lvpart])
            }else {
              if(lnode.op === Model.LOG && (rnode.op === Model.LOG && Ast.intern(lnode.args[0]) === Ast.intern(rnode.args[0]))) {
                return simplify({op:Model.LOG, args:[lnode.args[0], multiplyNode([lnode.args[1], rnode.args[1]])]})
              }else {
                if(ldegr === 0 && rdegr === 0) {
                  var mv1 = mathValue(lnode);
                  var mv2 = mathValue(rnode);
                  if(isInteger(mv1) && isInteger(mv2) || mv1 !== null && (mv2 !== null && option("allowDecimal"))) {
                    return numberNode(mv1.add(mv2))
                  }else {
                    if(Ast.intern(lnode) === Ast.intern(rnode)) {
                      return multiplyNode([numberNode("2"), lnode])
                    }else {
                      if(commonFactors(lnode, rnode).length > 0) {
                        return[factorTerms(lnode, rnode)]
                      }else {
                        if(false) {
                        }else {
                          return[lnode, rnode]
                        }
                      }
                    }
                  }
                }
              }
            }
          }else {
            if(Ast.intern(lnode) === Ast.intern(rnode)) {
              return multiplyNode([numberNode("2"), lnode])
            }else {
              if(isZero(mathValue(lcoeff))) {
                return rnode
              }else {
                if(isZero(mathValue(rcoeff))) {
                  return lnode
                }else {
                  if(!isOne(mathValue(lcoeff)) && !isOne(mathValue(rcoeff))) {
                    if(commonFactors(lnode, rnode).length > 0) {
                      var node = [factorTerms(lnode, rnode)];
                      return node
                    }
                  }
                }
              }
            }
          }
          return[lnode, rnode]
        }
      }, multiplicative:function(node) {
        assert(node.op === Model.MUL, "simplify() multiplicative node not normalized: " + JSON.stringify(node));
        node = flattenNestedNodes(node, true);
        node = groupLikes(node);
        if(!isMultiplicative(node)) {
          return simplify(args[0])
        }
        var nid = Ast.intern(node);
        var args = node.args.slice(0);
        var n0 = [simplify(args.shift())];
        forEach(args, function(n1, i) {
          n1 = simplify(n1);
          n0 = n0.concat(fold(n0.pop(), n1))
        });
        if(n0.length < 2) {
          if(exponent(n0[0]) < 0) {
            node = n0[0]
          }else {
            node = n0[0]
          }
        }else {
          if(n0.length === 0) {
            assert(false)
          }
          node = sort(multiplyNode(n0))
        }
        return node;
        function fold(lnode, rnode) {
          var ldegr = degree(lnode);
          var rdegr = degree(rnode);
          var lvars = variables(lnode);
          var rvars = variables(rnode);
          var lvpart = variablePart(lnode);
          var rvpart = variablePart(rnode);
          var lcoeff = coeff(lnode);
          var rcoeff = coeff(rnode);
          var lcoeffmv = mathValue(lcoeff);
          var rcoeffmv = mathValue(rcoeff);
          if(ldegr === 0 && isZero(lcoeffmv) || rdegr === 0 && isZero(rcoeffmv)) {
            return numberNode("0")
          }else {
            if(ldegr === 0 && isOne(lcoeffmv)) {
              return rnode
            }else {
              if(rdegr === 0 && isOne(rcoeffmv)) {
                return lnode
              }else {
                if(ldegr === 0 && rdegr === 0) {
                  assert(lnode.op !== Model.MUL && rnode.op !== Model.MUL, "Internal error: multiplicative expressions not flattened");
                  if(isOne(rcoeffmv) && isOne(lcoeffmv)) {
                    return numberNode("1")
                  }
                  var lexpo = exponent(lnode);
                  var rexpo = exponent(rnode);
                  var lbase = base(lnode);
                  var rbase = base(rnode);
                  if(Math.abs(lexpo) === 1 && Math.abs(rexpo) === 1) {
                    if(lexpo === rexpo) {
                      var b = lbase.multiply(rbase);
                      if(isInteger(b) || option("allowDecimal")) {
                        node = numberNode(b);
                        if(lexpo === -1) {
                          node = binaryNode(Model.POW, [node, numberNode("-1")])
                        }
                      }else {
                        node = [lnode, rnode]
                      }
                    }else {
                      if(option("allowDecimal")) {
                        var n = lexpo === 1 ? lbase : rbase;
                        var d = lexpo === 1 ? rbase : lbase;
                        node = numberNode(divide(n, d))
                      }else {
                        var lbaseN = toNumber(lbase);
                        var rbaseN = toNumber(rbase);
                        var d = gcd(lbaseN, rbaseN);
                        lbase = divide(lbase, new BigDecimal(d.toString()));
                        rbase = divide(rbase, new BigDecimal(d.toString()));
                        if(lexpo < 0 && isOne(lbase)) {
                          node = numberNode(rbase)
                        }else {
                          if(rexpo < 0 && isOne(rbase)) {
                            node = numberNode(lbase)
                          }else {
                            var n = lexpo === 1 ? lbase : rbase;
                            var d = lexpo === 1 ? rbase : lbase;
                            if(isOne(n)) {
                              node = binaryNode(Model.POW, [numberNode(d), numberNode("-1")])
                            }else {
                              var q = divide(n, d);
                              if(isInteger(q)) {
                                node = numberNode(q)
                              }else {
                                if(isNeg(n) && isNeg(d)) {
                                  n = n.multiply(new BigDecimal("-1"));
                                  d = d.multiply(new BigDecimal("-1"))
                                }
                                node = [numberNode(n), binaryNode(Model.POW, [numberNode(d), numberNode("-1")])]
                              }
                            }
                          }
                        }
                      }
                    }
                  }else {
                    if(lnode.op === Model.POW && (rnode.op === Model.POW && Ast.intern(lnode.args[1]) === Ast.intern(rnode.args[1]))) {
                      var lbase = lnode.args[0];
                      var rbase = rnode.args[0];
                      var lexpo = exponent(lnode);
                      var rexpo = exponent(rnode);
                      var sqrtExpo = binaryNode(Model.POW, [numberNode("2"), numberNode("-1")]);
                      if(Ast.intern(lnode.args[1]) === Ast.intern(sqrtExpo) && Ast.intern(lbase) === Ast.intern(rbase)) {
                        node = lbase
                      }else {
                        var args = [];
                        if(lbase.op === Model.MUL) {
                          args = args.concat(lbase.args)
                        }else {
                          args.push(lbase)
                        }
                        if(rbase.op === Model.MUL) {
                          args = args.concat(rbase.args)
                        }else {
                          args.push(rbase)
                        }
                        node = binaryNode(Model.POW, [multiplyNode(args), lnode.args[1]])
                      }
                    }else {
                      var lval = pow(lbase, new BigDecimal(lexpo.toString()));
                      var rval = pow(rbase, new BigDecimal(rexpo.toString()));
                      if(rval !== null && lval !== null) {
                        var val = lval.multiply(rval);
                        if(isInteger(val) || option("allowDecimal")) {
                          node = numberNode(lval.multiply(rval))
                        }else {
                          node = [lnode, rnode]
                        }
                      }else {
                        node = [lnode, rnode]
                      }
                    }
                  }
                }else {
                  if(lvpart && (rvpart && Ast.intern(lvpart) === Ast.intern(rvpart))) {
                    var lnode = multiplyNode([lcoeff, rcoeff]);
                    if(lvpart.op === Model.POW) {
                      assert(lvpart.args.length === 2 && rvpart.args.length === 2, "Exponents of exponents not handled here.");
                      var lexpo = lvpart.args[1];
                      var rexpo = rvpart.args[1];
                      var rnode = binaryNode(Model.POW, [lvpart.args[0], binaryNode(Model.ADD, [lexpo, rexpo])])
                    }else {
                      var rnode = binaryNode(Model.POW, [lvpart, numberNode("2")])
                    }
                    if(isZero(mathValue(lnode))) {
                      node = []
                    }else {
                      if(isOne(mathValue(lnode))) {
                        node = rnode
                      }else {
                        node = [lnode, rnode]
                      }
                    }
                  }else {
                    if(Ast.intern(lnode.op === Model.POW ? lnode.args[0] : lnode) === Ast.intern(rnode.op === Model.POW ? rnode.args[0] : rnode)) {
                      var lexpo = exponent(lnode);
                      var rexpo = exponent(rnode);
                      var expo = lexpo + rexpo;
                      if(expo === 0) {
                        node = numberNode("1")
                      }else {
                        if(expo === 1) {
                          node = {op:Model.VAR, args:lvars}
                        }else {
                          if(!isNaN(expo)) {
                            node = binaryNode(Model.POW, [{op:Model.VAR, args:lvars}, numberNode(lexpo + rexpo)])
                          }else {
                            node = [lnode, rnode]
                          }
                        }
                      }
                    }else {
                      if(ldegr === 0 && isOne(lcoeffmv)) {
                        return rnode
                      }else {
                        if(rdegr === 0 && isOne(rcoeffmv)) {
                          return lnode
                        }else {
                          if(ldegr === 0 && option("allowDecimal")) {
                            var v = mathValue(lnode);
                            node = [numberNode(v), rnode]
                          }else {
                            if(rdegr === 0 && option("allowDecimal")) {
                              var v = mathValue(rnode);
                              node = [numberNode(v), lnode]
                            }else {
                              if(option("dontExpandPowers") && (lnode.op === Model.POW && (rnode.op === Model.POW && Ast.intern(lnode.args[1]) === Ast.intern(rnode.args[1])))) {
                                var lbase = lnode.args[0];
                                var rbase = rnode.args[0];
                                var lexpo = exponent(lnode);
                                var rexpo = exponent(rnode);
                                var args = [];
                                if(lbase.op === Model.MUL) {
                                  args = args.concat(lbase.args)
                                }else {
                                  args.push(lbase)
                                }
                                if(rbase.op === Model.MUL) {
                                  args = args.concat(rbase.args)
                                }else {
                                  args.push(rbase)
                                }
                                node = binaryNode(Model.POW, [multiplyNode(args), lnode.args[1]])
                              }else {
                                node = [lnode, rnode]
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          return node
        }
      }, unary:function(node) {
        switch(node.op) {
          case Model.SUB:
            node = multiplyNode([node.args[0], numberNode("-1")]);
            break;
          case Model.ABS:
            var mv = mathValue(node.args[0]);
            if(mv !== null) {
              node = numberNode(abs(mv))
            }
            break;
          default:
            break
        }
        return node
      }, exponential:function(node) {
        var nid = Ast.intern(node);
        var args = node.args.slice(0).reverse();
        var n0 = [simplify(args.shift())];
        forEach(args, function(n1, i) {
          n1 = simplify(n1);
          n0 = n0.concat(fold(n0.pop(), n1))
        });
        if(n0.length === 1) {
          var n = n0[0];
          if(n.op !== Model.NUM || (+n.args[0] === (+n.args[0] | 0) || option("allowDecimal"))) {
            node = n
          }
        }else {
          node = binaryNode(node.op, n0.reverse())
        }
        return node;
        function fold(expo, base) {
          var mv;
          var bmv = mathValue(base);
          var emv = mathValue(expo);
          if(isZero(bmv)) {
            return[numberNode("0")]
          }else {
            if(isZero(emv)) {
              return[numberNode("1")]
            }else {
              if(isOne(bmv)) {
                return[numberNode("1")]
              }else {
                if(isOne(emv)) {
                  return[base]
                }else {
                  if(!option("dontExpandPowers") && base.op === Model.MUL) {
                    var args = [];
                    base.args.forEach(function(n) {
                      if(n.op === Model.POW) {
                        args.push(binaryNode(Model.POW, [n.args[0], multiplyNode([n.args[1], expo])]))
                      }else {
                        args.push(binaryNode(Model.POW, [n, expo]))
                      }
                    });
                    return multiplyNode(args)
                  }else {
                    if(base.op === Model.POW) {
                      return binaryNode(Model.POW, [base.args[0], multiplyNode([base.args[1], expo])])
                    }else {
                      if(bmv !== null && emv !== null) {
                        var ff = factors(expo, null, false, true);
                        var b = mv = bmv;
                        for(var i = ff.length - 1;i >= 0;i--) {
                          var e = mathValue(ff[i]);
                          var mv = pow(mv, e);
                          if(mv !== null && (option("allowDecimal") || isInteger(mv))) {
                            b = mv;
                            ff.pop();
                            continue
                          }
                          break
                        }
                        if(option("allowDecimal") || isInteger(b)) {
                          base = numberNode(b);
                          if(ff.length === 0) {
                            return base
                          }else {
                            if(ff.length === 1) {
                              return[ff[0], base]
                            }else {
                              if(ff.length === 0) {
                                assert(false)
                              }
                              return[multiplyNode(ff), base]
                            }
                          }
                        }else {
                          return[expo, base]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          return[expo, base]
        }
      }, variable:function(node) {
        return node
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(simplify(n))
        });
        return{op:Model.COMMA, args:args}
      }, equals:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(simplify(n))
        });
        return{op:node.op, args:args}
      }}), root.location);
      while(nid !== Ast.intern(node)) {
        nid = Ast.intern(node);
        node = simplify(node)
      }
      return node
    }
    function base(node) {
      var op = node.op;
      return op === Model.POW ? mathValue(node.args[0]) : mathValue(node)
    }
    function exponent(node) {
      return node.op === Model.POW ? toNumber(mathValue(node.args[1])) : 1
    }
    function log(b, x) {
      return Math.log(x) / Math.log(b)
    }
    function mathValue(root, env) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"simplify", numeric:function(node) {
        return new BigDecimal(node.args[0])
      }, additive:function(node) {
        if(node.op === Model.PM) {
          return null
        }
        var val = bigZero;
        forEach(node.args, function(n) {
          var mv = mathValue(n, env);
          if(mv && val) {
            val = val.add(mv)
          }else {
            val = null
          }
        });
        return val
      }, multiplicative:function(node) {
        var val = bigOne;
        forEach(node.args, function(n) {
          var mv = mathValue(n, env);
          if(mv && val) {
            val = val.multiply(mv)
          }else {
            val = null
          }
        });
        return val
      }, unary:function(node) {
        switch(node.op) {
          case Model.SUB:
            var val = mathValue(node.args[0], env);
            return val.multiply(bigMinusOne);
          case Model.M:
            var args = [];
            if(node.args[0].op === Model.ADD) {
              forEach(node.args[0].args, function(n) {
                assert(n.op === Model.VAR, "Internal error: invalid arguments to the M tag");
                var sym = Model.env[n.args[0]];
                assert(sym && sym.mass, "Internal error: missing chemical symbol");
                var count = n.args[1] ? toNumber(mathValue(n.args[1])) : 1;
                args.push(numberNode(sym.mass * count))
              })
            }else {
              var n = node.args[0];
              assert(n.op === Model.VAR, "Internal error: invalid arguments to the M tag");
              var sym = Model.env[n.args[0]];
              assert(sym && sym.mass, "Internal error: missing chemical symbol");
              var count = n.args[1] ? toNumber(mathValue(n.args[1])) : 1;
              args.push(numberNode(sym.mass * count))
            }
            return mathValue(makeTerm(args));
          case Model.ABS:
            return abs(mathValue(node.args[0], env));
          default:
            return mathValue(node.args[0], env)
        }
      }, exponential:function(node) {
        var args = node.args.slice(0).reverse();
        var expo = mathValue(args.shift());
        var val;
        forEach(args, function(n) {
          val = pow(mathValue(n, env), expo)
        });
        return val
      }, variable:function(node) {
        var val;
        if(env && (val = env[node.args[0]])) {
          return new BigDecimal(String(val))
        }
        return null
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(mathValue(n, env))
        });
        return args
      }, equals:function(node) {
        return null
      }});
      function exponent(node) {
        return node.op === Model.POW ? +node.args[1].args[0] : 1
      }
    }
    function units(root, env) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"terms", exponential:function(node) {
        return units(node.args[0], env)
      }, multiplicative:function(node) {
        var uu = [];
        forEach(node.args, function(n) {
          uu = uu.concat(units(n, env))
        });
        return uu
      }, additive:function(node) {
        var uu = [];
        forEach(node.args, function(n) {
          uu = uu.concat(units(n, env))
        });
        return uu
      }, unary:function(node) {
        return units(node.args[0], env)
      }, numeric:function(node) {
        return[]
      }, variable:function(node) {
        var env = Model.env;
        if(env && typeof env[node.args[0]] === "number") {
          return[node.args[0]]
        }
        return[]
      }, comma:function(node) {
        var uu = [];
        forEach(node.args, function(n) {
          uu = uu.concat(units(n, env))
        });
        return uu
      }, equals:function(node) {
        var uu = [];
        forEach(node.args, function(n) {
          uu = uu.concat(units(n, env))
        });
        return uu
      }})
    }
    function expand(root, env) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      var nid = Ast.intern(root);
      var node = Model.create(visit(root, {name:"expand", numeric:function(node) {
        return node
      }, additive:function(node) {
        var nid = Ast.intern(node);
        var args = node.args.slice(0);
        var n0 = [expand(args.shift())];
        forEach(args, function(n1) {
          n1 = expand(n1);
          n0 = n0.concat(unfold(n0.pop(), n1))
        });
        if(n0.length < 2) {
          node = n0[0]
        }else {
          node = binaryNode(node.op, n0)
        }
        return node;
        function unfold(lnode, rnode) {
          return[lnode, rnode]
        }
      }, multiplicative:function(node) {
        var nid = Ast.intern(node);
        var args = node.args.slice(0);
        var n0 = [expand(args.shift())];
        forEach(args, function(n1, i) {
          n1 = expand(n1);
          n0 = n0.concat(unfold(n0.pop(), n1))
        });
        if(n0.length < 2) {
          node = n0[0]
        }else {
          node = multiplyNode(n0)
        }
        return node;
        function unfold(lnode, rnode) {
          var expo, lterms, rterms;
          if(lnode.op === Model.POW && (rnode.op === Model.POW && (expo = exponent(lnode)) === exponent(rnode))) {
            lterms = terms(lnode.args[0]);
            rterms = terms(rnode.args[0])
          }else {
            lterms = terms(lnode);
            rterms = terms(rnode)
          }
          if(lterms.length > 1 || rterms.length > 1) {
            var args = [];
            forEach(lterms, function(n0) {
              forEach(rterms, function(n1) {
                var args1 = [];
                if(n0.op === Model.MUL) {
                  args1 = args1.concat(n0.args)
                }else {
                  args1.push(n0)
                }
                if(n1.op === Model.MUL) {
                  args1 = args1.concat(n1.args)
                }else {
                  args1.push(n1)
                }
                args.push(multiplyNode(args1))
              })
            });
            var node = binaryNode(Model.ADD, args);
            if(expo !== undefined) {
              node = binaryNode(Model.POW, [node, numberNode(expo.toString())])
            }
            return[sort(node)]
          }
          var result = [];
          if(lnode.op === Model.MUL) {
            result = result.concat(lnode.args)
          }else {
            result.push(lnode)
          }
          if(rnode.op === Model.MUL) {
            result = result.concat(rnode.args)
          }else {
            result.push(rnode)
          }
          return result
        }
      }, unary:function(node) {
        assert(node.op !== Model.SQRT, "Internal error: SQRT removed during parsing");
        switch(node.op) {
          case Model.SUB:
            node = multplyNode([expand(node.args[0]), numberNode("-1")]);
            node.args[0] = expand(node.args[0]);
            break;
          case Model.TAN:
            var arg0 = expand(node.args[0]);
            node = multiplyNode([{op:Model.SIN, args:[arg0]}, binaryNode(Model.POW, [{op:Model.COS, args:[arg0]}, numberNode("-1")])]);
            break;
          case Model.COT:
            var arg0 = expand(node.args[0]);
            node = multiplyNode([{op:Model.COS, args:[arg0]}, binaryNode(Model.POW, [{op:Model.SIN, args:[arg0]}, numberNode("-1")])]);
            break;
          case Model.SEC:
            var arg0 = expand(node.args[0]);
            node = multiplyNode([numberNode("1"), binaryNode(Model.POW, [{op:Model.COS, args:[arg0]}, numberNode("-1")])]);
            break;
          case Model.CSC:
            var arg0 = expand(node.args[0]);
            node = multiplyNode([numberNode("1"), binaryNode(Model.POW, [{op:Model.SIN, args:[arg0]}, numberNode("-1")])]);
            break;
          default:
            node = unaryNode(node.op, [expand(node.args[0])]);
            break
        }
        return node
      }, exponential:function(node) {
        var nid = Ast.intern(node);
        var args = node.args.slice(0).reverse();
        var n0 = [expand(args.shift())];
        forEach(args, function(n1, i) {
          n1 = expand(n1);
          n0 = n0.concat(unfold(node.op, n0.pop(), n1))
        });
        if(n0.length < 2) {
          var n = n0[0];
          if(n.op !== Model.NUM || (+n.args[0] === (n.args[0] | 0) || option("allowDecimal"))) {
            node = n
          }
        }else {
          node = binaryNode(node.op, n0.reverse())
        }
        return node;
        function unfold(op, expo, base) {
          var node;
          var e = mathValue(expo);
          var ff = factors(base, null, false, true);
          if(ff.length === 0) {
            return numberNode("1")
          }
          var args = [];
          var dontExpandPowers = option("dontExpandPowers");
          forEach(ff, function(n) {
            if(op === Model.POW) {
              if(expo.op === Model.ADD) {
                forEach(expo.args, function(e) {
                  args.push({op:op, args:[n, e]})
                })
              }else {
                if(expo.op === Model.NUM) {
                  var emv = mathValue(expo);
                  if(isZero(emv)) {
                    args.push(numberNode("1"))
                  }else {
                    if(isAdditive(n) || !dontExpandPowers && isInteger(emv)) {
                      var ea = Math.abs(toNumber(emv));
                      var invert = isNeg(emv);
                      for(var i = 0;i < ea;i++) {
                        if(invert) {
                          args.push(binaryNode(Model.POW, [n, numberNode("-1")]))
                        }else {
                          args.push(n)
                        }
                      }
                    }else {
                      args.push({op:op, args:[n, expo]})
                    }
                  }
                }else {
                  if(!dontExpandPowers && expo.op === Model.MUL) {
                    var c = coeff(expo);
                    var cmv = mathValue(c);
                    var vp = variablePart(expo);
                    if(vp !== null) {
                      args.push(binaryNode(Model.POW, [n, c]));
                      args.push(binaryNode(Model.POW, [n, vp]))
                    }else {
                      if(cmv !== null) {
                        args.push({op:op, args:[n, numberNode(cmv.toString())]})
                      }else {
                        args.push({op:op, args:[n, expo]})
                      }
                    }
                  }else {
                    args.push({op:op, args:[n, expo]})
                  }
                }
              }
            }else {
              if(op === Model.LOG) {
                if(isMultiplicative(expo)) {
                  var aa = [];
                  forEach(expo.args, function(e) {
                    if(e.op === Model.POW) {
                      aa.push(multiplyNode([e.args[1], {op:Model.LOG, args:[n, e.args[0]]}]))
                    }else {
                      aa.push({op:op, args:[n, e]})
                    }
                  });
                  args.push(binaryNode(Model.ADD, aa))
                }else {
                  if(expo.op === Model.POW) {
                    args.push(multiplyNode([expo.args[1], {op:Model.LOG, args:[n, expo.args[0]]}]))
                  }else {
                    args.push({op:op, args:[n, expo]})
                  }
                }
              }
            }
          });
          if(args.length > 1) {
            node = multiplyNode(args)
          }else {
            node = args[0]
          }
          return[node]
        }
      }, variable:function(node) {
        return node
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(expand(n))
        });
        return{op:Model.COMMA, args:args}
      }, equals:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(expand(n))
        });
        return{op:node.op, args:args}
      }}), root.location);
      while(nid !== Ast.intern(node)) {
        nid = Ast.intern(node);
        node = expand(node)
      }
      return node
    }
    function factors(root, env, ignorePrimeFactors, preserveNeg) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"factors", numeric:function(node) {
        if(ignorePrimeFactors) {
          return[node]
        }
        var ff = [];
        if(preserveNeg && isNeg(node)) {
          ff.push(numberNode("-1"))
        }
        var absv = Math.abs(+node.args[0]);
        var pff = primeFactors(absv);
        if(pff.length === 0 && !isOne(absv)) {
          ff.push(numberNode(absv))
        }else {
          forEach(primeFactors(+node.args[0]), function(n) {
            ff.push(numberNode(n))
          })
        }
        return ff
      }, additive:function(node) {
        return[node]
      }, multiplicative:function(node) {
        switch(node.op) {
          case Model.MUL:
            var vars = variables(node);
            var ff = [];
            forEach(node.args, function(n) {
              ff = ff.concat(factors(n, env, ignorePrimeFactors, preserveNeg))
            });
            return ff;
          default:
            assert(false, "Node not normalized");
            break
        }
        return[node]
      }, unary:function(node) {
        return[node]
      }, exponential:function(node) {
        if(node.op === Model.POW) {
          if(mathValue(node.args[1]) < 0) {
            return[node]
          }else {
            var ff = [];
            var e = mathValue(node.args[1]);
            if(e !== null && isInteger(e)) {
              for(var i = toNumber(e);i > 0;i--) {
                ff.push(node.args[0])
              }
              return ff
            }else {
              return[node]
            }
          }
        }else {
          if(node.op === Model.LOG) {
            return[node]
          }
        }
      }, variable:function(node) {
        return[node]
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args = args.concat(factors(n))
        });
        return{op:Model.COMMA, args:args}
      }, equals:function(node) {
        return[node]
      }})
    }
    function commonFactors(lnode, rnode) {
      var t1 = [lnode, rnode];
      var t;
      var t2 = [];
      forEach(t1, function(n) {
        t = factors(n, null, false, true);
        var ff = [];
        forEach(t, function(n) {
          ff.push(Ast.intern(n))
        });
        t2.push(ff)
      });
      var intersect = t2.shift();
      forEach(t2, function(a) {
        intersect = filter(intersect, function(n) {
          var i = indexOf(a, n);
          if(i !== -1) {
            delete a[i];
            return true
          }
          return false
        })
      });
      return intersect
    }
    function factorTerms(lnode, rnode) {
      var cfacts = commonFactors(lnode, rnode);
      var lfacts = factors(lnode, null, false, true);
      var rfacts = factors(rnode, null, false, true);
      var lfacts2 = [], rfacts2 = [];
      var cf = cfacts.slice(0);
      var i;
      forEach(lfacts, function(f) {
        if((i = indexOf(cf, Ast.intern(f))) === -1) {
          lfacts2.push(f)
        }else {
          delete cf[i]
        }
      });
      var cf = cfacts.slice(0);
      forEach(rfacts, function(f) {
        if((i = indexOf(cf, Ast.intern(f))) === -1) {
          rfacts2.push(f)
        }else {
          delete cf[i]
        }
      });
      var aa = [];
      aa = aa.concat(makeFactor(lfacts2));
      aa = aa.concat(makeFactor(rfacts2));
      var args = [];
      if(aa.length > 0) {
        args.push(makeTerm(aa))
      }
      forEach(cfacts, function(i) {
        args.push((new Ast).node(i))
      });
      return makeFactor(args)[0]
    }
    function makeFactor(args) {
      if(args.length === 0) {
        return[numberNode("1")]
      }else {
        if(args.length === 1) {
          return args
        }
      }
      return[multiplyNode(args)]
    }
    function makeTerm(args) {
      assert(args.length > 0, "Too few arguments in makeTerm()");
      if(args.length === 1) {
        return args[0]
      }
      return binaryNode(Model.ADD, args)
    }
    function scale(root) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"scale", exponential:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }, multiplicative:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }, additive:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }, unary:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }, numeric:function(node) {
        return numberNode(node.args[0], true)
      }, variable:function(node) {
        return node
      }, comma:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }, equals:function(node) {
        var args = [];
        forEach(node.args, function(n) {
          args.push(scale(n))
        });
        return{op:node.op, args:args}
      }})
    }
    function isFactorised(root, env) {
      if(!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0
      }
      return visit(root, {name:"isFactorised", numeric:function(node) {
        return true
      }, additive:function(node) {
        if(node.op === Model.PM) {
          return true
        }
        var vars = variables(node);
        var coeffs, vals;
        var t1 = terms(simplify(expand(normalize(node))));
        var t;
        var t2 = [];
        forEach(t1, function(n) {
          t = factors(n);
          var ff = [];
          forEach(t, function(n) {
            ff.push(Ast.intern(n))
          });
          t2.push(ff)
        });
        var intersect = t2.shift();
        forEach(t2, function(a) {
          intersect = filter(intersect, function(n) {
            return indexOf(a, n) != -1
          })
        });
        if(intersect.length > 0) {
          return false
        }
        if(coeffs = isQuadratic(node)) {
          return!solveQuadratic(coeffs[0], coeffs[1], coeffs[2])
        }else {
          if(degree(node) < 2) {
            return true
          }else {
            assert(vars.length < 2, message(2001));
            assert(false, message(2003))
          }
        }
        return true
      }, multiplicative:function(node) {
        switch(node.op) {
          case Model.MUL:
            var result = every(node.args, function(n) {
              return isFactorised(n)
            });
            return result;
          default:
            assert(false, "isFactorised(): node not normalized");
            break
        }
        return false
      }, unary:function(node) {
        return true
      }, exponential:function(node) {
        return true
      }, variable:function(node) {
        return true
      }, comma:function(node) {
        var result = every(node.args, function(n) {
          return args.concat(isFactorised(n))
        });
        return result
      }, equals:function(node) {
        var result = every(node.args, function(n) {
          return args.concat(isFactorised(n))
        });
        return result
      }})
    }
    var primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    var primesCache = {};
    forEach(primes, function(v) {
      primesCache[v] = true
    });
    function isQuadratic(node) {
      var tt = terms(simplify(normalize(node)));
      var a = bigZero, b = bigZero, c = bigZero, notQuadratic = false;
      forEach(tt, function(v) {
        switch(degree(v)) {
          case 2:
            a = a.add(mathValue(coeff(v)));
            break;
          case 1:
            b = b.add(mathValue(coeff(v)));
            break;
          case 0:
            c = c.add(mathValue(coeff(v)));
            break;
          default:
            notQuadratic = true;
            break
        }
      });
      var vars = variables(node);
      notQuadratic = notQuadratic || (vars.length > 1 || a === 0);
      if(notQuadratic) {
        return null
      }
      return[a, b, c]
    }
    function solveQuadratic(a, b, c) {
      a = toNumber(a);
      b = toNumber(b);
      c = toNumber(c);
      var x0 = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      var x1 = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      var opt = option("field");
      var hasSolution = opt === "integer" && (x0 === (x0 | 0) && x1 === (x1 | 0)) || (opt === "real" && b * b - 4 * a * c >= 0 || opt === "complex");
      if(hasSolution) {
        return true
      }
      return false
    }
    function primeFactors(n) {
      var absN = Math.abs(n);
      if(absN <= 1) {
        return[]
      }else {
        if(isPrime(absN)) {
          return[absN]
        }
      }
      var maxf = Math.sqrt(absN);
      for(var f = 2;f <= maxf;f++) {
        if(n % f === 0) {
          return primeFactors(f).concat(primeFactors(absN / f))
        }
      }
    }
    function isPrime(n) {
      if(primesCache[n] !== void 0) {
        return primesCache[n]
      }
      if(n <= 1) {
        primesCache[n] = false;
        return false
      }else {
        if(n <= 1 || n > 2 && n % 2 === 0) {
          return primesCache[n] = false
        }else {
          for(var i = 3, sqrt = Math.sqrt(n);i <= sqrt;i += 2) {
            if(n % i === 0) {
              return primesCache[n] = false
            }
          }
        }
        return primesCache[n] = true
      }
    }
    function gcd(a, b) {
      if(arguments.length > 2) {
        var rest = [].slice.call(arguments, 1);
        return gcd(a, gcd.apply(rest))
      }else {
        var mod;
        a = Math.abs(a);
        b = Math.abs(b);
        while(b) {
          mod = a % b;
          a = b;
          b = mod
        }
        return a
      }
    }
    function lcm(a, b) {
      if(arguments.length > 2) {
        var rest = [].slice.call(arguments, 1);
        return lcm(a, lcm.apply(rest))
      }else {
        return Math.abs(a * b) / gcd(a, b)
      }
    }
    this.normalize = normalize;
    this.degree = degree;
    this.coeff = coeff;
    this.variables = variables;
    this.variablePart = variablePart;
    this.sort = sort;
    this.simplify = simplify;
    this.expand = expand;
    this.factors = factors;
    this.isFactorised = isFactorised;
    this.mathValue = mathValue;
    this.units = units;
    this.scale = scale
  }
  var visitor = new Visitor;
  function degree(node, notAbsolute) {
    return visitor.degree(node, notAbsolute)
  }
  function coeff(node, name) {
    return visitor.coeff(node, name)
  }
  function variables(node) {
    return visitor.variables(node)
  }
  function variablePart(node) {
    return visitor.variablePart(node)
  }
  function sort(node) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.sort(node);
    Assert.setLocation(prevLocation);
    return result
  }
  function normalize(node) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.normalize(node);
    Assert.setLocation(prevLocation);
    Assert.setLocation(prevLocation);
    return result
  }
  function mathValue(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.mathValue(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function units(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.units(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function simplify(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.simplify(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function expand(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.expand(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function factors(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.factors(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function isFactorised(node, env) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.isFactorised(node, env);
    Assert.setLocation(prevLocation);
    return result
  }
  function scale(node) {
    var prevLocation = Assert.location;
    if(node.location) {
      Assert.setLocation(node.location)
    }
    var result = visitor.scale(node);
    Assert.setLocation(prevLocation);
    return result
  }
  var env = Model.env;
  function precision(bd) {
    var scale = bd.scale();
    var prec = bd.mant.length;
    for(var i = 0;i < scale;i++) {
      if(bd.mant[prec - 1 - i] !== 0) {
        break
      }
    }
    return prec
  }
  function stripTrailingZeros(bd) {
    var mc = new MathContext(precision(bd));
    return v1.round(mc)
  }
  Model.fn.equivValue = function(n1, n2) {
    var options = Model.options = Model.options ? Model.options : {};
    var scale = options.decimalPlaces != undefined ? +options.decimalPlaces : 10;
    var env = Model.env;
    Model.options.allowDecimal = true;
    var v1t = bigZero;
    var v2t = bigZero;
    if(n1.op === Model.PM) {
      var n1t = n1.args[1];
      n1 = simplify(expand(normalize(n1.args[0])));
      n1t = simplify(expand(normalize(n1t)));
      var v1 = mathValue(n1, env);
      var v1t = mathValue(n1t, env);
      assert(v1 !== null, message(2005));
      assert(v1t !== null, message(2005))
    }else {
      n1 = simplify(expand(normalize(n1)));
      var v1 = mathValue(n1, env);
      assert(!(v1 instanceof Array), message(2007));
      assert(v1 !== null, message(2005))
    }
    if(n2.op === Model.PM) {
      var n2t = n2.args[1];
      n2 = simplify(expand(normalize(n2.args[0])));
      n2t = simplify(expand(normalize(n2t)));
      var v2 = mathValue(n2, env);
      var v2t = mathValue(n2t, env);
      assert(v1 !== null, message(2005));
      assert(v1t !== null, message(2005))
    }else {
      n2 = simplify(expand(normalize(n2)));
      var v2 = mathValue(n2, env);
      assert(!(v2 instanceof Array), message(2007));
      assert(v2 !== null, message(2005))
    }
    Assert.clearLocation();
    if(v1 instanceof Array && v2 instanceof Array) {
      if(n1.lbrk !== n2.lbrk || n1.rbrk !== n2.rbrk) {
        return false
      }
      return every(v1, function(v, i) {
        return v === v2[i].multiply(baseUnitConversion(n1.args[i], n2.args[i]))
      })
    }
    if(v1 !== null && v2 !== null) {
      assert(isZero(v1t) && isZero(v2t) || variables(n1).length === 0 && variables(n2).length === 0, message(2008));
      assert(baseUnit(n1) === undefined && baseUnit(n2) === undefined || baseUnit(n1) !== undefined && baseUnit(n2) !== undefined, message(2009));
      v2 = v2.multiply(baseUnitConversion(n1, n2));
      v1 = v1.setScale(scale, BigDecimal.ROUND_HALF_UP);
      v2 = v2.setScale(scale, BigDecimal.ROUND_HALF_UP);
      Model.options = options;
      if(isZero(v1t) && isZero(v2t)) {
        return!v1.compareTo(v2)
      }else {
        var v1min = v1.subtract(v1t);
        var v2min = v2.subtract(v2t);
        var v1max = v1.add(v1t);
        var v2max = v2.add(v2t);
        if(v1min.compareTo(v2min) >= 0 && v1max.compareTo(v2min) <= 0 || (v1min.compareTo(v2max) >= 0 && v1max.compareTo(v2max) <= 0 || (v2min.compareTo(v1min) >= 0 && v2max.compareTo(v1max) <= 0 || v2min.compareTo(v1max) >= 0 && v2max.compareTo(v1max) <= 0))) {
          return true
        }
      }
    }
    return false;
    function baseUnit(node) {
      var prevLocation = Assert.location;
      if(node.location) {
        Assert.setLocation(node.location)
      }
      var id;
      var baseUnits = {"g":"g", "cg":"g", "kg":"g", "mg":"g", "ng":"g", "m":"m", "cm":"m", "km":"m", "mm":"m", "nm":"m", "s":"s", "cs":"s", "ks":"s", "ms":"s", "ns":"s", "in":"ft", "ft":"ft", "mi":"ft", "fl":"fl", "cup":"fl", "pt":"fl", "qt":"fl", "gal":"fl", "oz":"lb", "lb":"lb", "st":"lb", "qtr":"lb", "cwt":"lb", "t":"lb", "L":"L", "mL":"L", "$":"$", "\\radians":"\\radians", "\\degrees":"\\radians", "mol":"mol"};
      if(node.op === Model.MUL && node.args[1].op === Model.VAR) {
        id = node.args[1].args[0]
      }else {
        if(node.op === Model.VAR) {
          id = node.args[0]
        }
      }
      Assert.setLocation(prevLocation);
      if(id && baseUnits[id]) {
        return baseUnits[id]
      }
      return undefined
    }
    function baseUnitConversion(n1, n2) {
      var NaN = Math.NaN;
      var baseUnitConversions = {"g/g":1, "lb/lb":1, "fl/fl":1, "m/m":1, "ft/ft":1, "s/s":1, "g/lb":"453.592", "lb/g":"0.00220462", "m/ft":"0.3048", "ft/m":"3.28084", "L/fl":"0.02957353", "fl/L":"33.814022702"};
      var u1 = baseUnit(n1);
      var u2 = baseUnit(n2);
      var val = (u1 === u2 ? 1 : 0) || baseUnitConversions[u1 + "/" + u2];
      return new BigDecimal(String(val))
    }
  };
  Model.fn.equivLiteral = function(n1, n2) {
    var ignoreOrder = option("ignoreOrder");
    if(ignoreOrder) {
      n1 = sort(n1);
      n2 = sort(n2)
    }
    var nid1 = this.intern(n1);
    var nid2 = this.intern(n2);
    if(nid1 === nid2) {
      return true
    }
    return false
  };
  Model.fn.equivSymbolic = function(n1, n2) {
    var nid1 = Ast.intern(scale(normalize(simplify(expand(normalize(n1))))));
    var nid2 = Ast.intern(scale(normalize(simplify(expand(normalize(n2))))));
    if(nid1 === nid2) {
      return true
    }
    return false
  };
  Model.fn.isExpanded = function(n1) {
    var dontExpandPowers = option("dontExpandPowers", true);
    var nid1 = Ast.intern(normalize(n1));
    var nid2 = Ast.intern(normalize(expand(normalize(n1))));
    option("dontExpandPowers", dontExpandPowers);
    if(nid1 === nid2) {
      return true
    }
    return false
  };
  Model.fn.isSimplified = function(n1) {
    var dontExpandPowers = option("dontExpandPowers", true);
    var nid1 = Ast.intern(normalize(n1));
    var nid2 = Ast.intern(normalize(simplify(expand(normalize(n1)))));
    option("dontExpandPowers", dontExpandPowers);
    if(nid1 === nid2) {
      return true
    }
    return false
  };
  Model.fn.simplify = function(n1) {
    var dontExpandPowers = option("dontExpandPowers", true);
    var node = normalize(simplify(expand(normalize(n1))));
    option("dontExpandPowers", dontExpandPowers);
    return node;
  };
  Model.fn.isFactorised = function(n1) {
    return isFactorised(normalize(n1))
  };
  Model.fn.isUnit = function(n1, n2) {
    var u1 = units(normalize(n1), env);
    var u2 = units(normalize(n2), env);
    if(!(u2 instanceof Array)) {
      u2 = [u2]
    }
    var result = every(u2, function(v) {
      return indexOf(u1, v) >= 0
    });
    return result
  };
  function option(p, v) {
    var options = Model.options;
    var opt = options && options[p];
    if(v !== void 0) {
      Model.options = options = options ? options : {};
      options[p] = v
    }
    if(!opt) {
      switch(p) {
        case "field":
          opt = "integer";
          break;
        case "decimalPlaces":
          opt = 10;
          break;
        case "allowDecimal":
        ;
        case "dontExpandPowers":
        ;
        default:
          opt = false;
          break
      }
    }
    return opt
  }
  var RUN_SELF_TESTS = false;
  if(RUN_SELF_TESTS) {
    trace("\nMath Model self testing");
    (function() {
      Model.options = {allowDecimal:true, decimalPlaces:3};
      var nd1 = Model.create("(x+2)(2x^2-3)");
      var nd2 = Model.create("2x^3+4x^2-3x-6");
      trace("start");
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2));
      trace("normalize");
      var nd1 = normalize(nd1);
      var nd2 = normalize(nd2);
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2));
      trace("expand");
      var nd1 = expand(nd1);
      var nd2 = expand(nd2);
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2));
      trace("simplify");
      var nd1 = simplify(nd1);
      var nd2 = simplify(nd2);
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2));
      trace("normalize");
      var nd1 = normalize(nd1);
      var nd2 = normalize(nd2);
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2));
      trace("scale");
      var nd1 = scale(nd1);
      var nd2 = scale(nd2);
      trace("nd1=" + JSON.stringify(nd1, null, 2));
      trace("nd2=" + JSON.stringify(nd2, null, 2))
    })()
  }
})();
"use strict";
var MathCore = exports.MathCore = function() {
  Assert.reserveCodeRange(3E3, 3999, "mathcore");
  var messages = Assert.messages;
  var message = Assert.message;
  var assert = Assert.assert;
  messages[3001] = "No Math Core spec provided.";
  messages[3002] = "No Math Core solution provided.";
  messages[3003] = "No Math Core spec value provided.";
  messages[3004] = "Invalid Math Core spec method '%1'.";
  messages[3005] = "No Math Core spec value provided.";
  var u = 1;
  var k = 1E3;
  var c = Math.pow(10, -2);
  var m = Math.pow(10, -3);
  var n = Math.pow(10, -9);
  var env = {"g":u, "s":u, "m":u, "L":u, "kg":k, "km":k, "ks":k, "cg":c, "cm":c, "cs":c, "mg":m, "ms":m, "mm":m, "mL":m, "ng":n, "ns":n, "nm":n, "in":1 / 12, "ft":u, "mi":5280, "fl":1, "cup":8, "pt":16, "qt":32, "gal":128, "oz":1 / 16, "lb":1, "st":14, "qtr":28, "cwt":112, "t":2240, "$":u, "\\radians":u, "\\degrees":Math.PI / 180, "\\pi":Math.PI, "R":{name:"reals"}};
  function evaluate(spec, solution) {
    try {
      assert(spec, message(3001, [spec]));
      assert(solution, message(3002, [solution]));
      var evaluator = makeEvaluator(spec);
      var result = evaluator.evaluate(solution)
    }catch(e) {
      trace(e + "\n" + e.stack);
      result = undefined
    }
    return result
  }
  function evaluateVerbose(spec, solution) {
    try {
      assert(spec, message(3001, [spec]));
      var evaluator = makeEvaluator(spec);
      var result, errorCode = 0, msg = "Normal completion", stack, location;
      result = evaluator.evaluate(solution)
    }catch(e) {
      result = undefined;
      errorCode = parseErrorCode(e.message);
      msg = parseMessage(e.message);
      stack = e.stack;
      location = e.location
    }
    return{result:result, errorCode:errorCode, message:msg, stack:stack, location:location, toString:function() {
      return this.errorCode + ": (" + location + ") " + msg + "\n" + this.stack
    }};
    function parseErrorCode(e) {
      var code = +e.slice(0, e.indexOf(":"));
      if(!isNaN(code)) {
        return code
      }
      return 0
    }
    function parseMessage(e) {
      var code = parseErrorCode(e);
      if(code) {
        return e.slice(e.indexOf(":") + 2)
      }
      return e
    }
  }
  function validateOption(p, v) {
    switch(p) {
      case "field":
        switch(v) {
          case void 0:
          ;
          case "integer":
          ;
          case "real":
          ;
          case "complex":
            break;
          default:
            assert(false, message(2011, [p, v]));
            break
        }
        break;
      case "decimalPlaces":
        if(v === void 0 || +v >= 0 && +v <= 20) {
          break
        }
        assert(false, message(2011, [p, v]));
        break;
      case "allowDecimal":
      ;
      case "dontExpandPowers":
      ;
      case "ignoreOrder":
        if(typeof v === "undefined" || typeof v === "boolean") {
          break
        }
        assert(false, message(2011, [p, v]));
        break;
      default:
        assert(false, message(2010, [p]));
        break
    }
    return
  }
  function validateOptions(options) {
    if(options) {
      forEach(keys(options), function(option) {
        validateOption(option, options[option])
      })
    }
  }
  function makeEvaluator(spec) {
    var method = spec.method;
    var value = spec.value;
    var options = Model.options = spec.options;
    Assert.setLocation("spec");
    validateOptions(options);
    Model.pushEnv(env);
    var valueNode = value ? Model.create(value, "spec") : undefined;
    Model.popEnv();
    var evaluate = function evaluate(solution) {
      Ast.clearPool();
      Assert.setLocation("user");
      assert(solution, message(3002));
      Model.pushEnv(env);
      var solutionNode = Model.create(solution, "user");
      Assert.setLocation("spec");
      var result;
      switch(method) {
        case "equivValue":
          assert(value, message(3005));
          result = valueNode.equivValue(solutionNode);
          break;
        case "equivLiteral":
          assert(value, message(3005));
          result = valueNode.equivLiteral(solutionNode);
          break;
        case "equivSymbolic":
          assert(value, message(3005));
          result = valueNode.equivSymbolic(solutionNode);
          break;
        case "isFactorised":
          result = solutionNode.isFactorised();
          break;
        case "isSimplified":
          result = solutionNode.isSimplified();
          break;
        case "isExpanded":
          result = solutionNode.isExpanded();
          break;
        case "isUnit":
          result = valueNode.isUnit(solutionNode);
          break;
        default:
          assert(false, message(3004, [method]));
          break
      }
      Model.popEnv();
      return result
    };
    return{evaluate:evaluate, evaluateVerbose:evaluateVerbose}
  }
  return{
      "evaluate":evaluate,
      "evaluateVerbose":evaluateVerbose,
      "makeEvaluator":makeEvaluator,
  }
}();

  return MathCore;
})();

