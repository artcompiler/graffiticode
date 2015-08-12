// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on csslint.js from https://github.com/stubbornella/csslint

// declare global: CSSLint

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerHelper("lint", "graffiti", function(text) {
    var found = [];
//    found.push({
//      from: CodeMirror.Pos(0, 0),
//      to: CodeMirror.Pos(0, 10),
//      message: "hello error",
//      severity : "error",
//    });
    if (window.errors) {
	return window.errors;
    } else {
	return [];
    }
});
});

