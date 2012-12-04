$(document).ready(function () {
    var list = [263]

    $.map(list, function (val, index) {
	GraffitiCode["example-editor-"+val] = CodeMirror(document.querySelector("#example-editor-"+val), {
	    mode:  "graffiti",
	    lineWrapping: "true",
	    lineNumbers: "true",
            readOnly: true,
	})
    }

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
		switch (id) {
		case 263:
		    $("#example-graffito-"+id).append(
			"<a href='#' onclick='GraffitiCode.ui.showWorkspace(); " +
			    "GraffitiCode.ui.updateSrc("+id+", \"" + srcEncoded + "\")'>" + 
			    data[i].obj +
			    "<br/>View in workspace</a>")
		    GraffitiCode["example-editor-"+id].setValue(src)
		    break
		}
	    }
        },
        error: function(xhr, msg, err) {
	    console.log(msg+" "+err)
        }
    })
})
