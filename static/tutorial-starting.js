$(document).ready(function () {
    var list = [263]
    $.ajax({
        type: "GET",
        url: "/code",
        data : {list: String(list)},
        dataType: "json",
        success: function(data) {
	    for (var i = 0; i < data.length; i++) {
		switch (+data[i].id) {
		case 263:
		    $("#coloring2-example-graffito").append(
			"<a href='#' onclick='GraffitiCode.ui.showWorkspace(); " +
			    "GraffitiCode.ui.updateSrc(263, " + d.src + ")'>" + 
			    data[i].obj +
			    "<br/>View in workspace</a>")
		    break
		}
	    }
        },
        error: function(xhr, msg, err) {
	    console.log(msg+" "+err)
        }
    })
})
