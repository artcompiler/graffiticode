/* -*- Mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */

/* copyright (c) 2012, Jeff Dyer */

if (!GraffitiCode) {
    var GraffitiCode = {}
}

GraffitiCode.ui = (function () {

    function compileCode(data) {
	$.ajax({
	    type: "POST",
            url: "/code",
	    data: data,
            dataType: "json",
            success: function(data) {
		updateText()
		updateImage()
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    function updateAST(data) {
	astCodeMirror.setValue(data);
    }

    function updateText() {
	$.ajax({
            url: "/text",
            dataType: "text",
            success: function(data) {
		textCodeMirror.setValue(data);
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
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
	updateText: updateText,
	updateImage: updateImage,
	compileCode: compileCode,
	updateAST: updateAST,
    }
})()