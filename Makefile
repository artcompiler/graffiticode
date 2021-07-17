default:
	npm start

test: build
	npm run test

build:
	npm run build

deploy: $(eval SHELL:=/bin/bash)
	gcloud builds submit \
		--config cloudbuild.deploy.json \
		--substitutions=COMMIT_SHA="$$(git rev-parse HEAD)"
