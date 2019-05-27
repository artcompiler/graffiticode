default: build
	node app.js

test: build
	npm run test

build:
	make -C public/

