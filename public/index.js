var lastCls="C1"
//var mouseIsUp = true
var baseName
var isDetail = false
var pathStack = []
var src
var dataURL = "/todos"
var path = []
var urlPrefix
var urlSuffix = ".svg.svg"

jQuery( function() {


    urlPrefix = dataURL + "?" + rootName + ".l4_"

    $('#svg-viewer').svg({onLoad: drawFirst});
    
    function drawFirst(svg) {
	var view = $('#svg-viewer');
	path.push("M1")
	path.push("C1")
	var url = makeURL(urlPrefix, path, urlSuffix)
	pathStack.push(path.slice())
	loadSVG(view, url)    
    }

});

function adjustPath(cls, path, force) {
    var newPath = []
    // If there is no node of the same class as cls, then append,
    // Otherwise, unwind the path to the parent of the same kind class and append.
    for (var i=0; i<path.length; i++) {
	if (path[i].indexOf(cls.charAt(0)) >= 0) {
	    break;
	}
	else {
	    newPath.push(path[i])
	}
    }
    newPath.push(cls)

    // only change path if not changing level or are increasing levels and explicitly forcing
    if (newPath.length === path.length || (force /*&& newPath.length > path.length*/)) {
	pathStack.push(path.slice())
	return newPath
    }
    else {
	return path
    }
}

function makeURL(prefix, path, suffix) {
    return prefix + path.join("_") + suffix
}

function init(evt) {
    $(evt.target).bind('mouseover', doMouseOver);
    $(evt.target).bind('mouseup'  , doMouseUp);
    $(evt.target).bind('mousedown', doMouseDown);
}
   
var lastTarget, lastColor

function moveTo(cls) {
    if (cls !== lastCls) {
	lastCls = cls;
	var view = $('#svg-viewer')
	var tks = getTksFromNd(cls)
	var chs = getChsFromTks(tks)
	var coords = getCoordsFromChs(chs)   // coords = {ln: ..., col: ...}
	
	var start = coords.length?coords[0]: {ln: 0, col: 0}
	var end = coords.length?coords[coords.length-1]: {ln: 0, col: 1}
	//alert(start.ln+" "+start.col+" "+end.ln+" "+end.col);
	editor.setSelection({line: start.ln, ch: start.col}, {line: end.ln, ch: end.col})
	var pos = editor.charCoords({line: start.ln, ch: start.col}, "local");
	pos.y -= 100
	editor.scrollTo(pos.x, pos.y)
	
	window.notes.render()
	
	//		if (isDetail) {
	//		    return   // if in detailed view don't change view without click
	//		}
	
	var suffix = ""
	lastCls = cls
	path = adjustPath(cls, path, false)
	var url = makeURL(urlPrefix, path, urlSuffix)
	
	
	loadSVG(view, url)
	
    }
}

function doMouseOver(e) {
    if (e.shiftKey && e.target instanceof SVGPathElement) {
	var target = $(e.target)
	moveTo(target.attr('class'))
    }

    function loadDone () {
	$('#file-name').text(fileName)
    }
    
}

function doMouseDown(e) {
    if (e.target instanceof SVGPathElement) {
	var target = $(e.target)
	var cls = target.attr('class');
	var view = $('#svg-viewer');
	// If the class equals the last class, then use the default drill down
	if (path.indexOf(cls) >= 0) {
	    cls = "E"  // only true if lastCls is a "C*"
	}
	isDetail = true;
	path = adjustPath(cls, path, true)
	var url = makeURL(urlPrefix, path, urlSuffix)
	moveTo(target.attr('class'))
	loadSVG(view, url)
	lastCls = cls;
    }
    else {
	goBack(e)
    }
    
    function loadDone () {
	$('#file-name').text(fileName)
    }
    
}

function doMouseUp(e) {
	//if (e.target instanceof SVGPathElement) {
	//	mouseIsUp = true;
	//}

}

function onCursorActivity(e) {
    var chs = codeCoords()
    console.log("start="+chs[0]+" stop="+chs[1])
    var tks = getTksFromChs(chs)
    console.log("tks="+tks);
    var nds = getNdsFromTks(tks)
    console.log("nds="+nds);
    //moveTo(nds[0])
}

function codeCoords() {
    var start = editor.getCursor(true)
    var stop = editor.getCursor(false)
    var startChs = getChsFromLn(start.line)[0] + +start.ch
    var stopChs = getChsFromLn(stop.line)[0] + +stop.ch
    return [startChs, stopChs]
}


var tkToLnMap
var tkToNdMap

// nodes consist of tokens
function getTksFromNd(node) {
	return nodes[node]
}

// tokens consist of characters
function getChsFromTks(tks) {
	var chs = [ ]
	jQuery.each(tks, function (index, value) {
		var b = tokenBreaks[value]
		if (b) {
			for (var i= b[0]; i <= b[1]; i++) {
				chs.push(i)
			}
		}
	})
	return chs
}

function getCoordsFromChs(chs) {
	//FIXME optimize
	var coords = [ ]
	// for each character
	jQuery.each(chs, function (index, ch) {
		// for each link break
		jQuery.each(lineBreaks, function (ln, lineBreak) {
			// if character is less then current line break, then we have found the line
			// that character reside on. The column is the character position minus the
			// previous break.
			if (ch < lineBreak) {
				coords.push({ln: ln, col: ch - lineBreaks[ln-1]})
				return false  // terminate
			}
		})
	})
	return coords
}

function getChsFromLn(ln) {
	// line breaks start at the second line, first line is at zero
	var start = 0
	if (ln > 0) {
		start = lineBreaks[ln-1]
	}
	var end = lineBreaks[ln]-1
	return [+start, +end]
}

function getTksFromChs(chs) {
	// FIXME this could be way more efficient
	var tks = []
	for (var i=0; i<tokenBreaks.length; i++) {
		tStart = tokenBreaks[i][0]
		tEnd = tokenBreaks[i][1]
		cStart = chs[0]
		cEnd = chs[1]
		if (tStart >= cStart && tStart < cEnd ||
		    tEnd >= cStart && tEnd < cEnd) {
			tks.push(i)
		}
	}
	return tks
}

function getNdsFromTks(tks) {
    //console.log("getNdsFromTks() tks="+tks)
    if (!tkToNdMap) {
	tkToNdMap = [];
	jQuery.each(nodes, function(index, value) {
	    var nd = index
	    var tks = value
	    jQuery.each(tks, function (index, value) {
		if (!tkToNdMap[value]) {
		    tkToNdMap[value] = [ ]
		}
		tkToNdMap[value].push(nd)
	    })
	})
    }
    var nds = [ ]
    var lastCount = 0
    var lastDiff = 0x7fffffff
    var lastNode = ""
    jQuery.each(tks, function(index, tk) {
	var nn = tkToNdMap[tk]
	console.log("nn="+nn)
	// find the node with the largest intersection with the selection
	jQuery.each(nn, function(index, value) {
	    var tks2 = getTksFromNd(value)
	    var diff = matchTks(tks, tks2)
	    if (diff >= 0 && diff < lastDiff) {
		lastDiff = diff
		lastNode = value
		//console.log("node="+value+" diff="+diff)
	    }
	});
    });
    console.log("lastNode="+lastNode+" lastDiff="+lastDiff)
    nds.push(lastNode)
    lastCount = 0
    lastDiff = 0x7fffffff
    lastNode = ""
    return nds
}

// return a measure of the fit between two token lists.
// tks1 is the smaller of the two lists. A lower result
// is better.
function matchTks(tks1, tks2) {
    var diff = -1
    var t1 = tks1.join()
    var t2 = tks2.join()
    if (t2.indexOf(t1) >= 0) {
	diff = t2.length - t1.length
    }
    return diff
}


function goBack(e) {
    var view = $('#svg-viewer');
    if (pathStack.length > 0) {
	path = pathStack.pop()
    }

    var url = makeURL(urlPrefix, path, urlSuffix)
    loadSVG(view, url)
    
    function loadDone () {
	$('#file-name').text(url)
    }
    
}

function loadSVG(target, filename) {
    $.ajax({
        url: filename,
//	crossDomain: "true",
        dataType: "text",
        success: success,
        error: error
    })

    function error(e) {
    }
    
    function success(data) {
        d3.select("#svg-viewer").html(data)
	$('#file-name').text(filename)
    }
}

/*
function loadSVG(target, filename) {
    $.ajaxSetup({
	//crossDomain: "true",
        dataType: "xml",
        //complete: onRequestCompleted,
	error: error
    })

    $.get(filename, success);

    function error(e) {
	alert("error")
    }
    
    function success(data) {
	alert(data)
        d3.select("#svg-viewer").html(data)
	function success (e) {
	    $('#file-name').text(filename)
	}
    }

    function onRequestCompleted(xhr,textStatus) {
	if (xhr.status == 302) {
	    location.href = xhr.getResponseHeader("Location");
	}
    }

}
*/

function loadText() {
    $.ajax({
        url: rootName,
        dataType: "text",
        success: success
    })
    
    function success(data) {
        editor.setValue(data)
		src = data
    }
}

var tokenBreaks = []
function loadTokens() {
    $.ajax({
        url: rootName + ".tokens",
        dataType: "text",
        success: success
    })

    function success(data) {
        var rows = data.split("\n")
        for (var i=0; i < rows.length; i++) {
	    var t = rows[i].split(" ")
	    if (t[0] && t[1]) {
		tokenBreaks.push([+t[0], +t[1]])
	    }
	}
    }
}

// each entry contains an tuple of (pos, token)	        
var lineBreaks = [ ]
function loadLines() {
    $.ajax({
        url: rootName + ".lines",
        dataType: "text",
        success: success
    })

    function success(data) {
        var rows = data.split("\n")
        for (var i=0; i < rows.length; i++) {
			var t = rows[i].split(" ")
			lineBreaks[i] = t[0]   // [char, token]
		}
    }
}

   
var nodes = { }
function loadNodes() {
    $.ajax({
        url: rootName + ".l4.nodes",
        dataType: "text",
        success: success
    })

    function success(data) {
        var rows = data.split("\n")
        for (var i=0; i < rows.length; i++) {
			var row = rows[i]
			if (row) {
				var node = row.split(" ")
				nodes[node[0]] = node[1].split(",")   // name -> [tk1, ..., tkN]
			}
		}
    }
}

	        

