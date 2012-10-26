var parse = function(src) {
    var stream = new GraffitiCode.StringStream(src)
    var state = GraffitiCode.parser.startState()
    var next = function () {
	return GraffitiCode.parser.parse(stream, state)
    }
    while (state.cc != null) {
	next()
    }
    if (stream.peek() !== void 0) {
	throw "characters past end of program"
    }
    console.log(GraffitiCode.ast.dumpAll())
    return GraffitiCode.ast.pop()
}
