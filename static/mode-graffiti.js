CodeMirror.defineMode("graffiti", function() {

    function assert(b, str) {
        if (!b) {
            alert(str)
        }
    }

    function print(str) {
	console.log(str)
    }

    return {
        token: function(stream, state) {
            return GraffitiCode.parse(stream, state)
        },

        startState: function() {
            return {
                cc: GraffitiCode.program,   // top level parsing function
		argc: 0,
		argcStack: [0],
		env: [ {name: "global", lexicon: GraffitiCode.globalLexicon } ],
		exprc: 0,
		exprcStack: [0],
		nodeStack: [],
		nodePool: ["unused"],
		nodeMap: {},
            }
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

	}
    }

})

CodeMirror.defineMIME("text", "graffiti")

CodeMirror.handleCursorEvent = function (editor, evt) {
//    CodeMirror.simpleHint(editor, function (editor) {
//	return {list: ["let", "abc", "xyz"], from: editor.getCursor(), to: editor.getCursor()}
//    })
    return false
}
