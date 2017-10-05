/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
CodeMirror.defineMode("graffiti", function() {
  var parser = gcexports.parser;
  function assert(b, str) {
    if (!b) {
      alert(str);
    }
  }
  function print(str) {
    console.log(str);
  }
  return {
    token: function(stream, state) {
      return parser.parse(stream, state);
    },
    startState: function() {
      window.errors = [];
      return {
        cc: parser.program,   // top level parsing function
        argc: 0,
        argcStack: [0],
        paramc: 0,
        paramcStack: [0],
        env: [ {name: "global", lexicon: Object.assign({}, gcexports.keywords, gcexports.globalLexicon) } ],
        exprc: 0,
        exprcStack: [0],
        nodeStack: [],
        nodeStackStack: [],
        nodePool: ["unused"],
        nodeMap: {},
        nextToken: -1,
        errors: [],
        coords: [],
        inStr: 0,
      };
    },
    copyState: function(state) {
      return copyObject(state)
      function copyObject(obj) {
        var nobj = {}
        for (var p in obj) {
          if (obj[p] instanceof Array) {
            nobj[p] = copyArray(obj[p])
          }
          else if (obj[p] instanceof Function) {
            nobj[p] = obj[p]
          }
          else if (obj[p] instanceof Object) {
            nobj[p] = copyObject(obj[p])
          }
          else {
            nobj[p] = obj[p]
          }
        }
        return nobj
      }
      function copyArray(obj) {
        var nobj = []
        for (var p in obj) {
          if (obj[p] instanceof Array) {
            nobj[p] = copyArray(obj[p])
          }
          else if (obj[p] instanceof Function) {
            nobj[p] = obj[p]
          }
          else if (obj[p] instanceof Object) {
            nobj[p] = copyObject(obj[p])
          }
          else {
            nobj[p] = obj[p]
          }
        }
        return nobj
      }
    },
  };
});
CodeMirror.defineMIME("text", "graffiti")
CodeMirror.handleCursorEvent = function (editor, evt) {
  CodeMirror.simpleHint(editor, function (editor) {
    return {list: ["let", "abc", "xyz"], from: editor.getCursor(), to: editor.getCursor()}
  });
  return false;
}
