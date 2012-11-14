/* -*- Mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
/* vi: set ts=4 sw=4 expandtab: (add to ~/.vimrc: set modeline modelines=5) */

/* copyright (c) 2012, Jeff Dyer */

if (!GraffitiCode) {
    var GraffitiCode = {}
}

GraffitiCode.ui = (function () {

    // {src, ast} -> {id, obj}
    function compileCode(ast) {
        if (GraffitiCode.firstCompile) {
            GraffitiCode.firstCompile = false
        }
        else {
            GraffitiCode.id = 0
        }

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
		        updateCode(data)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }

    // {src, obj} -> {id}
    function postPiece() {
//        console.log("postPiece() src="+src+" ast="+ast)

        // if there are no changes then don't post
        if (GraffitiCode.parent === GraffitiCode.id) {
            return
        }
	    var src = GraffitiCode.src
	    var pool = GraffitiCode.pool
	    var obj = GraffitiCode.obj
        var parent = GraffitiCode.parent;
	    $.ajax({
	        type: "POST",
            url: "/code",
	        data: {
                src: src,
                ast: pool,
                obj: obj,
                user: GraffitiCode.user,
                parent: parent,
            },
            dataType: "json",
            success: function(data) {
		        addPiece(data, src, obj)
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
		        data = data[0]
		        addPiece(data, data.src, data.obj)
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
		        for (var i = data.length-1; i >= 0; i--) {
		            var d = data[i]
		            addPiece(d, d.src, d.obj)
		        }
                // move the first graffito in the editor
                GraffitiCode.id = data[0].id
                updateSrc(data[0].id)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }

    function updateAST(data) {
//	astCodeMirror.setValue(data)
    }

    // The source should always be associated with an id
    function updateSrc(id) {
        GraffitiCode.firstCompile = true
        GraffitiCode.id = id
        GraffitiCode.parent = GraffitiCode.id

	    $.ajax({
	        type: "GET",
            url: "/code/"+id,
            dataType: "json",
            success: function(data) {
		        data = data[0]
                console.log("updateSrc() src="+data.src)
	            editor.setValue(data.src.split("\\n").join("\n"))
                // move piece to top of gallery
                var data = $(".gallery-panel div#"+id).data("piece")
                $(".gallery-panel div#"+id).remove()
                $(".gallery-panel div#text"+id).remove()
                addPiece(data, data.src, data.obj)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }

    function updateCode(obj) {
	    textCodeMirror.setValue(obj)
    }

    function updateImage(obj, src, pool) {
	    //console.log("updateImage() data="+data)
	    $("#graff-view").html(obj)
        $("#graff-view svg").attr("onclick", "GraffitiCode.ui.postPiece(this)")
        $("#graff-view svg").attr("width", "640")
        $("#graff-view svg").attr("height", "360")
        GraffitiCode.src = src
        GraffitiCode.pool = pool
        GraffitiCode.obj = obj
    }

    function addPiece(data, src, obj) {
        var id = data.id
	    $(".gallery-panel").prepend("<div class='label' id='text"+id+"'/>")
	    $(".gallery-panel").prepend("<div class='thumbnail' id='"+id+"'/>")
        // store info about piece in thumbnail object
        $(".gallery-panel div#"+id).data("piece", data /*{id: id, src: src, obj: obj}*/)
        $(".gallery-panel div#"+id).append($(obj).clone())
        $(".gallery-panel div#"+id+" svg").attr("width", "640")
        $(".gallery-panel div#"+id+" svg").attr("height", "360")
        $(".gallery-panel div#"+id+" svg").attr("onclick", "GraffitiCode.ui.updateSrc('"+id+"')")
        $(".gallery-panel div#text"+id).text(data.forks+" forks, "+data.views+" views, "+new Date(data.created))
    }

    return {
	    postPiece: postPiece,
	    compileCode: compileCode,
	    updateAST: updateAST,
	    updateSrc: updateSrc,
	    updateImage: updateImage,
	    getPieces: getPieces,
    }
})()

