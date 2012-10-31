/* -*- Mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */

/* copyright (c) 2012, Jeff Dyer */

if (!GraffitiCode) {
    var GraffitiCode = {}
}

GraffitiCode.ui = (function () {

    function compileCode(data) {
	console.log("compileCode() data="+JSON.stringify(data))
	$.ajax({
	    type: "POST",
            url: "/code",
	    data: data,
            dataType: "text",
            success: function(data) {
		console.log("compileCode() data="+data)
//		updateText(data)
		updateImage(data)
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    function updateAST(data) {
//	astCodeMirror.setValue(data)
    }

    function updateText(data) {
	textCodeMirror.setValue(data)
    }

    function updateImage(data) {
	console.log("updateImage() data="+data)
	$("#graff-view").html(data)
    }

    return {
	compileCode: compileCode,
	updateAST: updateAST,
	updateGraffiti: updateText,
	updateImage: updateImage,
    }
})()