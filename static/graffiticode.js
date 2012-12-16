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
		        updateObj(data)
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }

    // {src, obj} -> {id}
    function postPiece(next) {

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
                GraffitiCode.id = data.id
                GraffitiCode.gist_id = data.gist_id
		        addPiece(data, src, obj, false)
                if (next) {
                    next()
                }
            },
            error: function(xhr, msg, err) {
		        alert(msg+" "+err)
            }
	    })
    }
    
    // {src, obj} -> {id}
    function postGist() {

        // if we already have a gist_id, then don't post
        if (GraffitiCode.gist_id) {
            return
        }

        // make sure piece is committed before gisting
        if (GraffitiCode.id === 0) {
            postPiece(postGist)
            return
        }

        var user = $("#username").data("user")

        var id = GraffitiCode.id
	    var src = GraffitiCode.src
	    var pool = GraffitiCode.pool
	    var obj = GraffitiCode.obj
        var parent = GraffitiCode.parent
	    $.ajax({
	        type: "POST",
            url: "/gist",
	        data: {
                id: id,
                src: src.replace(/\t/g,"    "),
                ast: pool,
                obj: obj,
                user: user.id,
                parent: parent,
            },
            dataType: "json",
            success: function(data) {
                var pieceData = $(".gallery-panel #"+id).data("piece")
                var gist_id = GraffitiCode.gist_id = data.gist_id
                $(".gallery-panel #"+id+" .label").html(pieceData.views+" Views, "+pieceData.forks+" Forks, " + 
                          new Date(pieceData.created).toDateString().substring(4) + ", " +
                          pieceData.name + 
                          ("<br><a href='http://"+location.host+"/graffiti/"+id+"' target='_blank'>Graffiti/"+id+"</a>")+
                          (gist_id?", <a href='https://gist.github.com/"+gist_id+"' target='_blank'>Gist/"+gist_id+"</a>":""))
            },
            error: function(xhr, msg, err) {
                console.log("postGist() msg="+msg+" err="+err)
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
        if (start >= len || GraffitiCode.currentThumbnail >= len) {
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
    function updateSrc(id, src) {
        GraffitiCode.firstCompile = true
        GraffitiCode.id = id
        GraffitiCode.parent = GraffitiCode.id
        var data = $(".gallery-panel #"+id).data("piece")
        if (data) {
            GraffitiCode.gist_id = data.gist_id
            if (!src) {
                var src = data.src
            }
        }
        if (src) {
	        editor.setValue(src.split("\\n").join("\n"))
        }
    }

    function updateObj(obj) {
	    objCodeMirror.setValue(obj)
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
        var gist_id = data.gist_id
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
        $(".gallery-panel #"+id+" .thumbnail")
            .attr("onclick", "GraffitiCode.ui.clickThumbnail(event, '"+id+"')")
            .attr("title", "Click to view in the workspace.")
//        $(".gallery-panel div#text"+id).text(data.views+" views, "+data.forks+" forks, "+new Date(data.created))
//        $(".gallery-panel div#text"+id).text(data.views+" Views, "+data.forks+" Forks, " + new Date(data.created).toDateString() + " by " + data.name)

        $(".gallery-panel #"+id+" .label").html(data.views+" Views, "+data.forks+" Forks, " + 
                          new Date(data.created).toDateString().substring(4) + ", " +
                          data.name + 
                          ("<br><a href='http://"+location.host+"/graffiti/"+id+"' target='_blank'>Graffiti/"+id+"</a>")+
                          (gist_id?", <a href='https://gist.github.com/"+gist_id+"' target='_blank'>Gist/"+gist_id+"</a>":""))
    }

    function start() {
        queryPieces()
        $.get("draw-help.html", function (data) {
            $("#help-view").append(data)
        })

        var srcId = 304
        var newId = 208
        var findId = 240
        var archiveId = 242
        var shareId = 211
        if (location.host.match(/^localhost/) !== null) {
            newId = 151
            findId = 151
            archiveId = 151
            shareId = 151
        }
            
        $.get("http://"+location.host+"/graffiti/"+newId, function (newButton) {
        $.get("http://"+location.host+"/graffiti/"+findId, function (openButton) {
        $.get("http://"+location.host+"/graffiti/"+archiveId, function (saveButton) {
        $.get("http://"+location.host+"/graffiti/"+shareId, function (shareButton) {
            showWorkspace()
            $(".button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.newCode()' title='New' href='#' style='margin-left: 260'>"+newButton+"</a>")
            $(".button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.showArchive()' title='Find' href='#'>"+openButton+"</a>")
            $(".button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.postPiece()' title='Archive' href='#'>"+saveButton+"</a>")
            $(".button-bar").append("<a class='button-bar-button' onclick='GraffitiCode.ui.postGist()' title='Share' href='#'>"+shareButton+"</a>")
            $.get("http://"+location.host+"/code/"+srcId, function (data) {
                updateSrc(data[0].id, data[0].src)
            })
        })
        })
        })
        })


    }

    function showEssay(name) {
        GraffitiCode.ui.doRecompile = false

        $(".button-bar").css("display", "none")
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#"+name+"-link").css("background-color", "#bbb")
        $("#"+name+"-link").css("font-weight", "700")

        if (GraffitiCode.essayName !== name) {            
            $.get(name+".html", function(data) {
                $(".essay-panel").html(data)
                GraffitiCode.essayData = data
                GraffitiCode.essayName = name
            })
        }
        else {
            $(".essay-panel").html(GraffitiCode.essayData)
        }
    }

    function showDemos() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("demos.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#demos-link").css("background-color", "#bbb")
        $("#demos-link").css("font-weight", "700")
    }

    function showTutorials() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("tutorials.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#tutorials-link").css("background-color", "#bbb")
        $("#tutorials-link").css("font-weight", "700")
    }

    function showNotes() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("notes.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#notes-link").css("background-color", "#bbb")
        $("#notes-link").css("font-weight", "700")
    }

    function showArchive() {
        $(".button-bar").css("display", "block")
        $(".button-bar-button").hide()
        $(".gallery-panel").css("display", "block")
        $(".essay-panel").css("display", "none")
        $(".edit-panel").css("display", "none")

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#archive-link").css("background-color", "#bbb")
        $("#archive-link").css("font-weight", "700")

    }

    function showDonate() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("donate.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#donate-link").css("background-color", "#bbb")
        $("#donate-link").css("font-weight", "700")
    }

    function showAbout() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("about.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#about-link").css("background-color", "#bbb")
        $("#about-link").css("font-weight", "700")
    }

    function showFeedback() {
        $(".gallery-panel").css("display", "none")
        $(".edit-panel").css("display", "none")
        $(".essay-panel").css("display", "block")
        $.get("feedback.html", function(data) {
            $(".essay-panel").html(data)
        })

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#feedback-link").css("background-color", "#bbb")
        $("#feddback-link").css("font-weight", "700")
    }

    function showWorkspace(id) {
        GraffitiCode.ui.doRecompile = true
        $(".gallery-panel").css("display", "none")
        $(".essay-panel").css("display", "none")

        $(".button-bar").show()
        $(".button-bar-button").show()
        $(".edit-panel").css("display", "block")

        $(".nav-link").css("background-color", "#ddd")
        $(".nav-link").css("font-weight", "400")

        $("#workspace-link").css("background-color", "#bbb")
        $("#workspace-link").css("font-weight", "700")
        showHelp()
    }

    function newCode() {
        editor.setValue("size 100 100.\n.")
        var srcId = 302
        $.get("http://"+location.host+"/code/"+srcId, function (data) {
            updateSrc(data[0].id, data[0].src)
        })
    }


    function showHelp() {
        $("#help-view").css("display", "block")
    }

    return {
	    postPiece: postPiece,
	    postGist: postGist,
	    compileCode: compileCode,
	    updateAST: updateAST,
	    updateSrc: updateSrc,
	    updateGraffito: updateGraffito,
        clickThumbnail: clickThumbnail,
        loadMoreThumbnails: loadMoreThumbnails,
        start: start,
        showEssay: showEssay,
        showArchive: showArchive,
        showWorkspace: showWorkspace,
        showDemos: showDemos,
        showTutorials: showTutorials,
        showNotes: showNotes,
        showDonate: showDonate,
        showAbout: showAbout,
        showFeedback: showFeedback,
        newCode: newCode,
    }
})()

