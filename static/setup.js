	//This function is called when scripts/helper/util.js is loaded.
	//If util.js calls define(), then this function is not fired until
	//util's dependencies have loaded, and the util argument will hold
	//the module value for "helper/util".
	$(document).ready(function () {
	    var theme = "default"
	    editor = CodeMirror(document.querySelector("#edit-view"), {
		mode:  "graffiti",
		lineWrapping: "true",
		lineNumbers: "true",
		indentWithTabs: "true",
		theme: theme,
		//	onCursorActivity: function (editor) {
		//            CodeMirror.handleCursorEvent(editor)
		//	},
		onUpdate: function() {
		    //            updateDisplay()
		},
	    })
	    
	    // position divs vertically
	    function updateDisplay() {
		var h = $("#edit-view").height()
		var offset = $("#edit-view").offset()
		offset.top += h + 20
		$("#graff-view").offset(offset)
	    }
	    
	    objCodeMirror = CodeMirror(document.querySelector("#obj-view"), {
		value: "",
		mode: {name: "xml", alignCDATA: true},
		lineWrapping: "true",
		lineNumbers: "true",
		readOnly: "true",
		theme: theme,
	    })
	    
	    $(document).scroll(function (data) {
		if ($(".gallery-panel").css('display') === 'none') {
		    return
		}
		var pos = window.innerHeight + document.body.scrollTop
		var bottom = document.body.height
		var height = $(".gallery-panel").height()
		//       console.log("scroll() pos="+pos+" heigth="+height)
		if (pos > height) {
		    exports.gc.loadMoreThumbnails(false)
		}
	    })
	    
	    //    updateDisplay()
	    exports.gc.start()
	})