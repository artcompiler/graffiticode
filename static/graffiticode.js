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
            dataType: "json",
            success: function(data) {
		console.log("compileCode() data="+JSON.stringify(data))
		updateText(JSON.stringify(data))
//		updateImage()
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    function updateAST(data) {
	astCodeMirror.setValue(data);
    }

    function updateText(data) {
	textCodeMirror.setValue(data);
    }

    function updateImage() {
	$.ajax({
            url: "/image",
            dataType: "xml",
            success: function(data) {
		imageView;
            },
            error: function(xhr, msg, err) {
		xhr = xhr
            }
	})
    }

    return {
	compileCode: compileCode,
	updateAST: updateAST,
	updateGraffiti: updateText,
	updateImage: updateImage,
    }
})()