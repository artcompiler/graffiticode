Builder
---
A builder is a function that takes in an `id` and resolves to be the statically built html for the id.

## builders

### [`webpack`](https://webpack.js.org/)
Use webpack to bundle all assets into a single html file. This is accomplished by writing temporary files associated with the `id` to an in-memory file system and using this file system when bundling. The compiled object code for the `id` is retrieved as well as language assets (`viewer.js` and `style.css`). In addition to these assets a few common static view files are used to setup and load the assets in the browser.
