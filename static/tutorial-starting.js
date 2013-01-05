$(document).ready(function () {
    var list = [252, 254, 258, 262, 263, 280, 281]

    $.map(list, function (val, index) {
	exports["example-editor-"+val] = CodeMirror(document.querySelector("#example-editor-"+val), {
	    mode:  "graffiti",
	    lineWrapping: "true",
	    lineNumbers: "true",
            readOnly: true,
	})
    })

    $.ajax({
        type: "GET",
        url: "/code",
        data : {list: String(list)},
        dataType: "json",
        success: function(data) {
	    for (var i = 0; i < data.length; i++) {
		var id = +data[i].id
		var src = data[i].src
		var srcEncoded = src.replace(new RegExp("\n", "g"), "\\n")
		$("#example-graffito-"+id).append(
		    "<a href='#' onclick='exports.gc.showWorkspace(); " +
			"exports.gc.updateSrc("+id+", \"" + srcEncoded + "\")'>" + 
			data[i].obj +
			"<br/>View in workspace</a>")
		exports["example-editor-"+id].setValue(src)
	    }
        },
        error: function(xhr, msg, err) {
	    console.log(msg+" "+err)
        }
    })
})
