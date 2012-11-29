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
	    $.ajax({
	        type: "PUT",
            url: "/code",
	        data: {ast: ast},
            dataType: "text",
            success: function(data) {
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

    var loadIncrement = 50;

    // {} -> [{id, src, obj}]
    function loadMoreThumbnails(doUpdateSrc) {
        var start = GraffitiCode.nextThumbnail
        var end = GraffitiCode.nextThumbnail = start + loadIncrement
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
//                if (doUpdateSrc) {
//                    updateSrc(data[0].id)
//                }
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
        var data = $(".gallery-panel #"+id).data("piece")
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
	    $("#graff-view").html(obj)
        $("#graff-view").attr("onclick", "GraffitiCode.ui.postPiece(this)")
        var width = $("#graff-view svg").width()
        var height = $("#edit-view svg").height()
//        $(".edit-panel").width(width+40)
//        $(".edit-panel").height($("#graff-view").height()+height+40)
        $("#graff-view").width(width)
//        $("#graff-view").offset({"top": height+120})
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
            showWorkspace()
            updateSrc(id)
        }
    }

    function addPiece(data, src, obj, append) {
        var id = data.id
        if (append) {
	        $(".gallery-panel").append("<div class='piece' id='"+id+"'></div>")
            $(".gallery-panel #"+id).append("<div class='thumbnail'></div>")
	        $(".gallery-panel #"+id).append("<div class='label'></div>")
        }
        else {
	        $(".gallery-panel").prepend("<div class='piece' id='"+id+"'/>")
	        $("div#"+id).append("<div class='thumbnail'/>")
	        $("div#"+id).append("<div class='label'/>")
        }

        // store info about piece in thumbnail object
        $(".gallery-panel #"+id).data("piece", data)

        $(".gallery-panel #"+id+" .thumbnail").append($(obj).clone())
        $(".gallery-panel #"+id+" .thumbnail svg").css("width", "220")
        $(".gallery-panel #"+id+" .thumbnail svg").css("height", "124")
//        $(".gallery-panel div#"+id+" svg").css("border: 1")
        $(".gallery-panel #"+id).attr("onclick", "GraffitiCode.ui.clickThumbnail(event, '"+id+"')")
//        $(".gallery-panel div#text"+id).text(data.views+" views, "+data.forks+" forks, "+new Date(data.created))
//        $(".gallery-panel div#text"+id).text(data.views+" Views, "+data.forks+" Forks, " + new Date(data.created).toDateString() + " by " + data.name)

        $(".gallery-panel #"+id+" .label").text(data.views+" Views, "+ new Date(data.created).toDateString() + ", " + data.name +", "+id)
    }

    function start() {
        queryPieces()
//        showGallery()
        showWorkspace()
        $.get("draw-help.html", function (data) {
            $("#help-view").append(data)
        })
        $.get("http://"+location.host+"/graffiti/208", function (newButton) {
        $.get("http://"+location.host+"/graffiti/209", function (openButton) {
        $.get("http://"+location.host+"/graffiti/210", function (saveButton) {
        $.get("http://"+location.host+"/graffiti/211", function (shareButton) {
            $("#button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.newCode()' title='New' href='#'>"+newButton+"</a>")
            $("#button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.showGallery()' title='New' href='#'>"+openButton+"</a>")
            $("#button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.postPiece()' title='Save' href='#'>"+saveButton+"</a>")
            $("#button-bar").append("<a class='button-bar-button' title='Share'>"+shareButton+"</a>")
        })
        })
        })
        })



    }

    function showWhatItIs() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("what-it-is.html", function(data) {
            $(".essay-panel").html(data)
        })

        $("#workspace-link, #gallery-link").css("background-color", "#ddd")
        $("#workspace-link, #gallery-link").css("font-weight", "400")
//        $("nav ul li a:hover").css("background-color", "#999")
//        $("nav ul li a:hover").css("font-weight", "700")

        $("#about-link").css("background-color", "#bbb")
        $("#about-link").css("font-weight", "700")
    }

    function showGallery() {
        $(".gallery-panel").css("display", "block")
        $(".essay-panel").css("display", "none")
        $(".edit-panel").css("display", "none")

        $("#gallery-link").css("background-color", "#bbb")
        $("#gallery-link").css("font-weight", "700")

        $("#workspace-link, #about-link").css("background-color", "#ddd")
        $("#workspace-link, #about-link").css("font-weight", "400")
//        var lastColor, lastWeight
//        $("nav ul li a").hover(
//            function() { $(this).css("font-weight", "700").css("background-color", "#999") },
//            function() { $(this).css("font-weight", lastWeight).css("background-color", lastColor) }
//        )

    }

    function showWorkspace() {
        $(".gallery-panel").css("display", "none")
        $(".essay-panel").css("display", "none")
        $(".edit-panel").css("display", "block")

        $("#about-link, #gallery-link").css("background-color", "#ddd")
        $("#about-link, #gallery-link").css("font-weight", "400")
//        $("nav ul li a:hover").css("background-color", "#999")
//        $("nav ul li a:hover").css("font-weight", "700")

        $("#workspace-link").css("background-color", "#bbb")
        $("#workspace-link").css("font-weight", "700")
        showHelp()
        newCode()
    }

    function newCode() {
        editor.setValue("size 200 200.\n.")
    }


    function showHelp() {
        $("#help-view").css("display", "block")
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
        showWorkspace: showWorkspace,
        newCode: newCode,
    }
})()

