SRC = $(wildcard src/*.js)
LIB = $(SRC:src/%.js=lib/%.js)
PUB = $(SRC:src/%.js=pub/%.js)

default:
	browserify -t babelify src/index.js > lib/index.js


