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
//        console.log("compileCode() ast="+JSON.stringify(ast))
	    $.ajax({
	        type: "PUT",
            url: "/code",
	        data: {ast: ast},
            dataType: "text",
            success: function(data) {
//                console.log("compileCode() data="+data)
                //		updateText(data)
		        updateGraffito(data, src, ast)
//		        updateCode(data)
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

        var user = $("#username").data("user")

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
                user: user.id,
                parent: parent,
            },
            dataType: "json",
            success: function(data) {
		        addPiece(data, src, obj, false)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }
    
    // get a list of piece ids that match a search criterial
    // {} -> [{id}]
    function queryPieces() {
	    $.ajax({
	        type: "GET",
            url: "/pieces",
	        data: {},
            dataType: "json",
            success: function(data) {
                var pieces = []
		        for (var i = 0; i < data.length; i++) {
		            pieces[i] = data[i].id
		        }
                GraffitiCode.pieces = pieces
                GraffitiCode.nextThumbnail = 0
                loadMoreThumbnails(true)
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
		        addPiece(data, data.src, data.obj, false)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }

    // {} -> [{id, src, obj}]
    function loadMoreThumbnails(doUpdateSrc) {
        var start = GraffitiCode.nextThumbnail
        var end = GraffitiCode.nextThumbnail = start + 10
        var len = GraffitiCode.pieces.length
        if (GraffitiCode.currentThumbnail >= len) {
            return
        }
        if (end > len) {
            end = len
        }
        var list = GraffitiCode.pieces.slice(start, end)
	    $.ajax({
	        type: "GET",
            url: "/code",
            data : {list: String(list)},
            dataType: "json",
            success: function(data) {
		        for (var i = 0; i < data.length; i++) {
		            var d = data[i]
                    GraffitiCode.currentThumbnail = start + i      // keep track of the current thumbnail in case of async
		            addPiece(d, d.src, d.obj, true)
		        }
                if (doUpdateSrc) {
                    updateSrc(data[0].id)
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

    // The source should always be associated with an id
    function updateSrc(id) {
        GraffitiCode.firstCompile = true
        GraffitiCode.id = id
        GraffitiCode.parent = GraffitiCode.id
        var data = $(".gallery-panel div#"+id).data("piece")
	    editor.setValue(data.src.split("\\n").join("\n"))
/*
	    $.ajax({
	        type: "GET",
            url: "/code/"+id,
            dataType: "json",
            success: function(data) {
		        data = data[0]
	            editor.setValue(data.src.split("\\n").join("\n"))
                // move piece to top of gallery
                var data = $(".gallery-panel div#"+id).data("piece")
                $(".gallery-panel div#"+id).remove()
                $(".gallery-panel div#text"+id).remove()
                addPiece(data, data.src, data.obj, false)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
*/
    }

    function updateCode(obj) {
//	    textCodeMirror.setValue(obj)
    }

    function updateGraffito(obj, src, pool) {
	    //console.log("updateImage() data="+data)
	    $("#graff-view").html(obj)
        $("#graff-view svg").attr("onclick", "GraffitiCode.ui.postPiece(this)")
        var width = $("#graff-view svg").width()
        var height = $("#graff-view svg").height()
//        console.log("updateGraffito() height="+height)
        $(".edit-panel").width(width+40)
        $(".edit-panel").height(height+$("#graff-view").height()+40)
        $("#graff-view").width(width)
        $("#graff-view").offset({"top": height+120})
        GraffitiCode.src = src
        GraffitiCode.pool = pool
        GraffitiCode.obj = obj
    }

    function clickThumbnail(e, id) {
        if (e.shiftKey) {
            var host = window.location.host
            var url = "http://"+host+"/graffiti/"+id
            window.open(url)
        }
        else {
            updateSrc(id)
        }
    }

    function addPiece(data, src, obj, append) {
        var id = data.id
        if (append) {
	        $(".gallery-panel").append("<div class='thumbnail' id='"+id+"'/>")
	        $(".gallery-panel").append("<div class='label' id='text"+id+"'/>")
        }
        else {
	        $(".gallery-panel").prepend("<div class='label' id='text"+id+"'/>")
	        $(".gallery-panel").prepend("<div class='thumbnail' id='"+id+"'/>")
        }
        // store info about piece in thumbnail object
        $(".gallery-panel div#"+id).data("piece", data)

        $(".gallery-panel div#"+id).append($(obj).clone())
        $(".gallery-panel div#"+id+" svg").css("width", "220")
        $(".gallery-panel div#"+id+" svg").css("height", "124")
        $(".gallery-panel div#"+id+" svg").css("border: 1")
        $(".gallery-panel div#"+id+" svg").attr("onclick", "GraffitiCode.ui.clickThumbnail(evt, '"+id+"')")
//        $(".gallery-panel div#text"+id).text(data.views+" views, "+data.forks+" forks, "+new Date(data.created))
//        $(".gallery-panel div#text"+id).text(data.views+" Views, "+data.forks+" Forks, " + new Date(data.created).toDateString() + " by " + data.name)
        $(".gallery-panel div#text"+id).text(data.views+" Views, "+ new Date(data.created).toDateString() + " by " + data.name)
    }

    function start() {
        queryPieces()
    }

    function showWhatItIs() {
        $(".gallery-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("what-it-is.html", function(data) {
//            console.log(data)
            $(".essay-panel").html(data)
        })
        
    }

    function showGallery() {
        $(".gallery-panel").css("display", "block")
        $(".essay-panel").css("display", "none")
    }

    return {
	    postPiece: postPiece,
	    compileCode: compileCode,
	    updateAST: updateAST,
	    updateSrc: updateSrc,
	    updateGraffito: updateGraffito,
        clickThumbnail: clickThumbnail,
        loadMoreThumbnails: loadMoreThumbnails,
        start: start,
        showWhatItIs: showWhatItIs,
        showGallery: showGallery,
    }
})()

