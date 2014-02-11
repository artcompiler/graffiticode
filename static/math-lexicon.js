exports.wordMap = {
    "function": [
	"triangle",
	"rectangle",
	"ellipse",
	"text",
    ]
}

exports.lexiconType = "math";
exports.globalLexicon = {
    "let" : { "tk": 0x12, "cls": "keyword" },
    "if" : { "tk": 0x05, "cls": "keyword" },
    "then" : { "tk": 0x06, "cls": "keyword" },
    "else" : { "tk": 0x07, "cls": "keyword" },
    "case" : { "tk": 0x0F, "cls": "keyword" },
    "of" : { "tk": 0x10, "cls": "keyword" },
    "end" : { "tk": 0x11, "cls": "keyword", "length": 0 },

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
    "ten" : { "tk": 0x02, "cls": "function", "length": 0 },
    "eleven" : { "tk": 0x02, "cls": "function", "length": 0 },
    "twelve" : { "tk": 0x02, "cls": "function", "length": 0 },
    "thirteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "fourteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "fifteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "sixteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "seventeen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "eighteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "nineteen" : { "tk": 0x02, "cls": "function", "length": 0 },
    "twenty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "thirty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "forty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "fifty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "sixty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "seventy" : { "tk": 0x02, "cls": "function", "length": 0 },
    "eighty" : { "tk": 0x02, "cls": "function", "length": 0 },
    "ninety" : { "tk": 0x02, "cls": "function", "length": 0 },

    "print" : { "tk": 0x01, "cls": "function", "length": 1 },

    "pi" : { "tk": 0x01, "name": "PI", "cls": "val", "length": 0,
	     "val": { "tag": "NUM", "elts": [Math.PI] } },

    "true" : { "tk": 0x14, "cls": "val", "length": 0 },
    "false" : { "tk": 0x14, "cls": "val", "length": 0 },
    "_" : { "tk": 0x14, "cls": "val", "length": 0 },

    // TK_BINOP = 0x0E
    "divide" : { "tk": 0x0E, "name": "DIV", "cls": "operator", "length": 0 },
    "div" : { "tk": 0x0E, "name": "DIV", "cls": "operator", "length": 0 },
    "mul" : { "tk": 0x0E, "name": "MUL", "cls": "operator", "length": 0 },
    "times" : { "tk": 0x0E, "name": "MUL", "cls": "operator", "length": 0 },
    "minus" : { "tk": 0x0E, "name": "SUB", "cls": "operator", "length": 0 },
    "sub" : { "tk": 0x0E, "name": "SUB", "cls": "operator", "length": 0 },
    "plus" : { "tk": 0x0E, "name": "ADD", "cls": "operator", "length": 0 },
    "add" : { "tk": 0x0E, "name": "ADD", "cls": "operator", "length": 0 },
    "mod" : { "tk": 0x0E, "name": "MOD", "cls": "operator", "length": 0 },
    "or" : { "tk": 0x0E, "name": "OR", "cls": "operator", "length": 0 },
    "and" : { "tk": 0x0E, "name": "AND", "cls": "operator", "length": 0 },
    "eq" : { "tk": 0x0E, "name": "EQ", "cls": "operator", "length": 0 },
    "ne" : { "tk": 0x0E, "name": "NE", "cls": "operator", "length": 0 },
    "lt" : { "tk": 0x0E, "name": "LT", "cls": "operator", "length": 0 },
    "gt" : { "tk": 0x0E, "name": "GT", "cls": "operator", "length": 0 },
    "le" : { "tk": 0x0E, "name": "LE", "cls": "operator", "length": 0 },
    "ge" : { "tk": 0x0E, "name": "GE", "cls": "operator", "length": 0 },
    "pow" : { "tk": 0x0E, "name": "POW", "cls": "operator", "length": 0 },

    "deg" : { "tk": 0x0A, "cls": "operator", "length": 0 }

}
