/* -*- Mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */

/* copyright (c) 2012, Jeff Dyer */

if (!GraffitiCode) {
    var GraffitiCode = {}
}

GraffitiCode.ui = (function () {

    // {src, ast} -> {id, obj}
    function compileCode(ast) {
	var src = editor.getValue()
//	console.log("compileCode() data="+src)
	$.ajax({
	    type: "PUT",
            url: "/code",
	    data: {ast: ast},
            dataType: "text",
            success: function(data) {
//		console.log("compileCode() data="+data)
//		updateText(data)
		updateImage(data, src, ast)
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    // {src, obj} -> {id}
    function postPiece() {
//        console.log("postPiece() src="+src+" ast="+ast)
	var src = GraffitiCode.src
	var ast = GraffitiCode.ast
	var obj = GraffitiCode.obj
	$.ajax({
	    type: "POST",
            url: "/code",
	    data: {src: src, ast: ast, obj: obj},
            dataType: "json",
            success: function(data) {
		addPiece(data.id, src, obj)
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    // {id} -> {id, src, obj}
    function getPiece(id) {
	$.ajax({
	    type: "GET",
            url: "/code/"+id,
            dataType: "json",
            success: function(data) {
		data = data
		addPiece(id, data.files.src.content, data.files.obj.content)
            },
            error: function(xhr, msg, err) {
		alert(msg+" "+err)
            }
	})
    }

    // {} -> [{id, src, obj}]
    function getPieces() {
	$.ajax({
	    type: "GET",
            url: "/code",
	    data: {},
            dataType: "json",
            success: function(data) {
		data = data
		for (var i = data.length-1; i >= 0; i--) {
		    getPiece(data[i].commit)
		}
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
	editor.setValue(data.split(",").join("\n"))
    }

    function updateImage(obj, src, ast) {
	//console.log("updateImage() data="+data)
	$("#graff-view").html(obj)
        $("#graff-view svg").attr("onclick", "GraffitiCode.ui.postPiece(this)")
        GraffitiCode.src = src
        GraffitiCode.ast = ast
        GraffitiCode.obj = obj
    }

    // store info about piece in thumbnail object
    function addPiece(id, src, obj) {
	$(".gallery-panel").prepend("<div class='thumbnail' id='"+id+"'/>")
        jQuery.data($(".gallery-panel div#"+id), "piece", {id: id, src: src, obj: obj})
        $(".gallery-panel div#"+id).append($(obj).clone())
        $(".gallery-panel div#"+id+" svg").attr("width", "320")
        $(".gallery-panel div#"+id+" svg").attr("height", "180")
        $(".gallery-panel div#"+id+" svg").attr("onclick", "GraffitiCode.ui.updateText('"+src.split("\n")+"')")
    }

    return {
	postPiece: postPiece,
	compileCode: compileCode,
	updateAST: updateAST,
	updateText: updateText,
	updateImage: updateImage,
	getPieces: getPieces,
    }
})()

