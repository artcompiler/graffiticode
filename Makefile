default:
	make -C public/
	node app.js

test:
	node app.js test ${lang}
