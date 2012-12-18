if (!this.GraffitiCode) {
    GraffitiCode = {}
}

GraffitiCode.wordMap = {
    "method": [
	"triangle",
	"rectangle",
	"ellipse",
	"text",
    ]
}

GraffitiCode.globalLexicon = {
    "let" : { "tk": 0x12, "cls": "keyword" },
    "if" : { "tk": 0x05, "cls": "keyword" },
    "then" : { "tk": 0x06, "cls": "keyword" },
    "else" : { "tk": 0x07, "cls": "keyword" },
    "match" : { "tk": 0x0F, "cls": "keyword" },
    "with" : { "tk": 0x10, "cls": "keyword", "length": 0 },
    "end" : { "tk": 0x11, "cls": "keyword", "length": 0 },
    "or" : { "tk": 0x13, "cls": "keyword", "length": 0 },
    "is" : { "tk": 0x09, "cls": "operator", "length": 1 },
    "equal" : { "tk": 0x01, "cls": "operator", "length": 0 },

    "zero" : { "tk": 0x02, "cls": "number", "length": 0 },
    "one" : { "tk": 0x02, "cls": "number", "length": 0 },
    "two" : { "tk": 0x02, "cls": "number", "length": 0 },
    "three" : { "tk": 0x02, "cls": "number", "length": 0 },
    "four" : { "tk": 0x02, "cls": "number", "length": 0 },
    "five" : { "tk": 0x02, "cls": "number", "length": 0 },
    "six" : { "tk": 0x02, "cls": "number", "length": 0 },
    "seven" : { "tk": 0x02, "cls": "number", "length": 0 },
    "eight" : { "tk": 0x02, "cls": "number", "length": 0 },
    "nine" : { "tk": 0x02, "cls": "number", "length": 0 },
    "ten" : { "tk": 0x02, "cls": "method", "length": 0 },
    "eleven" : { "tk": 0x02, "cls": "method", "length": 0 },
    "twelve" : { "tk": 0x02, "cls": "method", "length": 0 },
    "thirteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "fourteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "fifteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "sixteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "seventeen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "eighteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "nineteen" : { "tk": 0x02, "cls": "method", "length": 0 },
    "twenty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "thirty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "forty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "fifty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "sixty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "seventy" : { "tk": 0x02, "cls": "method", "length": 0 },
    "eighty" : { "tk": 0x02, "cls": "method", "length": 0 },
    "ninety" : { "tk": 0x02, "cls": "method", "length": 0 },

    "print" : { "tk": 0x01, "cls": "method", "length": 1 },

    "size" : { "tk": 0x01, "name": "SIZE", "cls": "method", "length": 2 },
    "background" : { "tk": 0x01, "name": "BACKGROUND", "cls": "method", "length": 1 },

    "text" : { "tk": 0x01, "name": "TEXT", "cls": "method", "length": 1 },
    "tri" :      { "tk": 0x01, "name": "TRI", "cls": "method", "length": 6 },
    "triangle" : { "tk": 0x01, "name": "TRI", "cls": "method", "length": 6 },
    "triside" : { "tk": 0x01, "name": "TRISIDE", "cls": "method", "length": 3 },
    "rectangle" : { "tk": 0x01, "name": "RECT", "cls": "method", "length": 2 },
    "ellipse" : { "tk": 0x01, "name": "ELLIPSE", "cls": "method", "length": 2 },
    "bezier" : { "tk": 0x01, "name": "BEZIER", "cls": "method", "length": 8 },
    "curve" : { "tk": 0x01, "name": "BEZIER", "cls": "method", "length": 8 },
    "grid" : { "tk": 0x01, "name": "GRID", "cls": "method", "length": 4 },
    "line" : { "tk": 0x01, "name": "LINE", "cls": "method", "length": 2 },
    "point" : { "tk": 0x01, "name": "POINT", "cls": "method", "length": 0 },

    "path" : { "tk": 0x01, "name": "PATH", "cls": "method", "length": 1 },
    "closepath" : { "tk": 0x01, "name": "CLOSEPATH", "cls": "method", "length": 0 },
    "moveto" : { "tk": 0x01, "name": "MOVETO", "cls": "method", "length": 3 },
    "lineto" : { "tk": 0x01, "name": "LINETO", "cls": "method", "length": 3 },
    "curveto" : { "tk": 0x01, "name":  "CURVETO", "cls": "method", "length": 7 },


    "translate" : { "tk": 0x01, "name": "TRANSLATE", "cls": "method", "length": 3 },
    "scale" : { "tk": 0x01, "name": "SCALE", "cls": "method", "length": 2 },
    "rotate" : { "tk": 0x01, "name": "ROTATE", "cls": "method", "length": 2 },
    "skewx" : { "tk": 0x01, "name": "SKEWX", "cls": "method", "length": 2 },
    "skewy" : { "tk": 0x01, "name": "SKEWY", "cls": "method", "length": 2 },
    "rgb" : { "tk": 0x01, "name": "RGB", "cls": "method", "length": 3 },
    "rgba" : { "tk": 0x01, "name": "RGBA", "cls": "method", "length": 4 },
    "fill" : { "tk": 0x01, "name": "FILL", "cls": "method", "length": 2 },
    "stroke" : { "tk": 0x01, "name": "STROKE", "cls": "method", "length": 2 },
    "color" : { "tk": 0x01, "name": "COLOR", "cls": "method", "length": 2 },
    "font-size" : { "tk": 0x01, "name": "FSIZE", "cls": "method", "length": 2 },
    "random" : { "tk": 0x01, "name": "RAND", "cls": "method", "length": 2 },

    "divide" : { "tk": 0x0E, "name": "DIV", "cls": "operator", "length": 0 },
    "div" : { "tk": 0x0E, "name": "DIV", "cls": "operator", "length": 0 },
    "mul" : { "tk": 0x0E, "name": "MUL", "cls": "operator", "length": 0 },
    "times" : { "tk": 0x0E, "name": "MUL", "cls": "operator", "length": 0 },
    "minus" : { "tk": 0x0E, "name": "SUB", "cls": "operator", "length": 0 },
    "sub" : { "tk": 0x0E, "name": "SUB", "cls": "operator", "length": 0 },
    "plus" : { "tk": 0x0E, "name": "ADD", "cls": "operator", "length": 0 },
    "add" : { "tk": 0x0E, "name": "ADD", "cls": "operator", "length": 0 },

    "deg" : { "tk": 0x0A, "cls": "operator", "length": 0 }
}
