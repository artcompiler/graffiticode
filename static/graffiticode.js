/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* copyright (c) 2014, Jeff Dyer */

exports.gc = (function () {

  // {src, ast} -> {id, obj}
  function compileCode(ast) {
    ast = JSON.stringify(ast);
    exports.id = 0;
    var src = editor.getValue();
    $.ajax({
      type: "PUT",
      url: "/compile",
      data: {
        "ast": ast,
        "type": exports.lexiconType,
        "language": exports.language,
      },
      dataType: "text",
      success: function(data) {
        updateGraffito(data, src, ast);
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err);
      }
    });
  }

  // {src, obj} -> {id}
  function postPiece(next) {
    // if there are no changes then don't post
    if (exports.parent === exports.id) {
      return;
    }
    var img = exports.viewer.capture();
    var user = $("#username").data("user");
    var src = exports.src.replace(/\\/g, "\\\\");
    var pool = exports.pool;
    var obj = exports.obj;
    var parent = exports.parent;
    var language = exports.language;
    $.ajax({
      type: "POST",
      url: "/code",
      data: {
        src: src,
        ast: pool,
        obj: obj,
        img: img.replace(/\\/g, "\\\\"),
        user: user ? user.id : 1,
        parent: parent,
        language: language,
        label: "show",
      },
      dataType: "json",
      success: function(data) {
        exports.id = data.id
        exports.gist_id = data.gist_id
        addPiece(data, src, obj, img, false)
        if (next) {
          next()
        }
      },
      error: function(xhr, msg, err) {
        console.log("Unable to submit code. Probably due to a SQL syntax error");
      }
    });
  }
  
  // {src, obj} -> {id}
  function postGist() {
    // if we already have a gist_id, then don't post
    if (exports.gist_id) {
      return;
    }
    // make sure piece is committed before gisting
    if (exports.id === 0) {
      postPiece(postGist);
      return;
    }
    var user = $("#username").data("user");
    var id = exports.id;
    var src = exports.src;
    var pool = exports.pool;
    var obj = exports.obj;
    var parent = exports.parent;
    $.ajax({
      type: "POST",
      url: "/gist",
      data: {
        id: id,
        src: src.replace(/\t/g,"    "),
        ast: pool,
        obj: obj,
        user: user ? user.id : 1,
        parent: parent,
      },
      dataType: "json",
      success: function(data) {
        var gist_id = exports.gist_id = data.gist_id;
        $(".gallery-panel #"+id+" .label").html(pieceData.views+" Views, "+pieceData.forks+" Forks, " + 
          new Date(pieceData.created).toDateString().substring(4) + ", " +
          pieceData.name + 
          ("<br><a href='http://"+location.host+"/graffiti/"+id+"' target='_blank'>Graffiti/"+id+"</a>") +
          (gist_id?", <a href='https://gist.github.com/" + gist_id + "' target='_blank'>Gist/" + gist_id +
           "</a>":""))
      },
      error: function(xhr, msg, err) {
        console.log("postGist() msg="+msg+" err="+err);
      }
    });
  }
  
  // get a list of piece ids that match a search criterial
  // {} -> [{id}]
  function queryPieces() {
    $.ajax({
      type: "GET",
      url: "/pieces/" + exports.language,
      data: {},
      dataType: "json",
      success: function(data) {
        var pieces = []
        for (var i = 0; i < data.length; i++) {
          pieces[i] = data[i].id
        }
        exports.pieces = pieces
        exports.nextThumbnail = 0
        loadMoreThumbnails(true)
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err)
      }
    });
  }

  // {id} -> {id, src, obj}
  function getPiece(id) {
    $.ajax({
      type: "GET",
      url: "/code/"+id,
      dataType: "json",
      success: function(data) {
        data = data[0]
        addPiece(data, data.src, data.obj, data.img, false)
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err)
      }
    })
  }

  var loadIncrement = 2;

  // {} -> [{id, src, obj}]
  function loadMoreThumbnails(firstLoad) {
    var start = exports.nextThumbnail;
    var end = exports.nextThumbnail = start + (firstLoad ? 50 : loadIncrement);
    var len = exports.pieces.length;
    if (start >= len || exports.currentThumbnail >= len) {
      return;
    }
    if (end > len) {
      end = len;
    }
    var list = exports.pieces.slice(start, end);
    $.ajax({
      type: "GET",
      url: "/code",
      data : {list: String(list)},
      dataType: "json",
      success: function(data) {
        for (var i = 0; i < data.length; i++) {
          var d = data[i];
          exports.currentThumbnail = start + i;  // keep track of the current thumbnail in case of async
          addPiece(d, d.src, d.obj, d.img, true);
        }
      },
      error: function(xhr, msg, err) {
        console.log(msg+" "+err);
      }
    });
  }

  function updateAST(data) {
    //  astCodeMirror.setValue(data)
  }

  // The source should always be associated with an id
  function updateSrc(id, src) {
    exports.id = id;
    exports.parent = exports.id;
    var data = $(".gallery-panel #" + id).data(".label", "all");
    if (data) {
      exports.gist_id = data.gist_id;
      if (!src) {
        var src = data.src;
      }
    }
    if (src) {
      editor.setValue(src.split("\\n").join("\n"));
    }
  }

  function updateObj(obj) {
    objCodeMirror.setValue(obj);
  }

  function updateGraffito(obj, src, pool) {
    return exports.viewer.update(obj, src, pool);
  }

  function start() {
    queryPieces();
    var newId = 208;
    var findId = 240;
    var archiveId = 242;
    var shareId = 211;
    $.get("http://"+location.host+"/graffiti/"+newId, function (newButton) {
      $.get("http://"+location.host+"/graffiti/"+findId, function (openButton) {
        $.get("http://"+location.host+"/graffiti/"+archiveId, function (saveButton) {
          showWorkspace();
          $(".button-bar").append("<a class='button-bar-button' onclick='exports.gc.newCode()' title='New' href='#'>"+newButton+"</a>");
          $(".button-bar").append("<a class='button-bar-button' onclick='exports.gc.showArchive()' title='Browse' href='#'>"+openButton+"</a>");
          $(".button-bar").append("<a class='button-bar-button' onclick='exports.gc.postPiece()' title='Save' href='#'>"+saveButton+"</a>");
          var srcId = exports.pieces[0];  // Display the last piece
          srcId = srcId ? srcId : 627;
          $.get("http://"+location.host+"/code/"+srcId, function (data) {
            updateSrc(data[0].id, data[0].src);
          });
        });
      });
    });
  }

  function showEssay(name) {
    exports.doRecompile = false;
    $(".button-bar").css("display", "none");
    $(".gallery-panel").css("display", "none");
    $(".edit-panel").css("display", "none");
    $(".essay-panel").css("display", "block");
    $(".nav-link").css("background-color", "#ddd");
    $(".nav-link").css("font-weight", "400");
    $("#"+name+"-link").css("background-color", "#bbb");
    $("#"+name+"-link").css("font-weight", "700");
    if (exports.essayName !== name) {
      $.get(name+".html", function (data) {
        $(".essay-panel").html(data);
        exports.essayData = data;
        exports.essayName = name;
      });
    } else {
      $(".essay-panel").html(exports.essayData);
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

  function showWorkspace(id) {
    exports.doRecompile = true;
    $(".gallery-panel").css("display", "none");
    $(".essay-panel").css("display", "none");
    $(".button-bar").show();
    $(".button-bar-button").show();
    $(".edit-panel").css("display", "block");
    $(".nav-link").css("background-color", "#ddd");
    $(".nav-link").css("font-weight", "400");
    $("#workspace-link").css("background-color", "#bbb");
    $("#workspace-link").css("font-weight", "700");
    showHelp();
  }

  function showArchive() {
    $(".button-bar").css("display", "block");
    $(".button-bar-button").hide();
    $(".gallery-panel").css("display", "block");
    $(".essay-panel").css("display", "none");
    $(".edit-panel").css("display", "none");
    $(".nav-link").css("background-color", "#ddd");
    $(".nav-link").css("font-weight", "400");
    $("#archive-link").css("background-color", "#bbb");
    $("#archive-link").css("font-weight", "700");
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

  function newCode() {
    var srcId = 627;
    $.get("http://"+location.host+"/code/"+srcId, function (data) {
      updateSrc(data[0].id, data[0].src)
    });
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
    hideThumbnail: hideThumbnail,
    loadMoreThumbnails: loadMoreThumbnails,
    start: start,
    showEssay: showEssay,
    showArchive: showArchive,
    showWorkspace: showWorkspace,
    showDemos: showDemos,
    showTutorials: showTutorials,
    showNotes: showNotes,
    showAbout: showAbout,
    showFeedback: showFeedback,
    newCode: newCode,
  };
})();
