$(document).ready(function () {
    var list = [263]
    $.ajax({
        type: "GET",
        url: "/code",
        data : {list: String(list)},
        dataType: "json",
        success: function(data) {
	    for (var i = 0; i < data.length; i++) {
		var id = +data[i].id
		switch (id) {
		case 263:
		    $("#example-graffito-"+id).append(
			"<a href='#' onclick='GraffitiCode.ui.showWorkspace(); " +
			    "GraffitiCode.ui.updateSrc("+id+", \"" + data[i].src.replace(new RegExp("\n", "g"), "\\n") + "\")'>" + 
			    data[i].obj +
			    "<br/>View in workspace</a>")
		    GraffitiCode["example-editor-"+id].setValue("foo bar")
		    break
		}
	    }
        },
        error: function(xhr, msg, err) {
	    console.log(msg+" "+err)
        }
    })
})
