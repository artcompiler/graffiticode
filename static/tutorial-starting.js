$(document).ready(function () {
    var list = [263]
    $.ajax({
        type: "GET",
        url: "/code",
        data : {list: String(list)},
        dataType: "json",
        success: function(data) {
            $("#coloring2-example-graffito").append(
                "<a href='#' onclick='GraffitiCode.ui.showWorkspace(); " +
                "GraffitiCode.ui.updateSrc(263, " + d.src + ")'>" + 
                d.obj +
                "<br/>View in workspace</a>")
        },
        error: function(xhr, msg, err) {
            console.log(msg+" "+err)
        }
    })
})
