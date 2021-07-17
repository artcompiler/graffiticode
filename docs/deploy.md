Deploy
---

# Prerequistes (one time)
- Install `gcloud` ([instructions](https://cloud.google.com/sdk/docs/install))
- Intialize `gcloud` ([instructions](https://cloud.google.com/sdk/docs/initializing))
  - _NOTE_: During initialization you will be asked to choose a project. This will be the project Artcompiler IDE is deployed to.

# Deploy (many times)
```
make deploy
```

# How it works
The `deploy` Makefile target runs the `gcloud builds submit` command using the cloudbuild deploy config found [here](./../cloudbuild.deploy.json). This config runs 3 steps:
1. Build a docker image using the [Dockerfile](./../Dockerfile)
1. Push the image to the Google Container Registry
1. Deploy the image to [Google Cloud Run](https://cloud.google.com/run) ([services](https://console.cloud.google.com/run?project=graffiticode))
