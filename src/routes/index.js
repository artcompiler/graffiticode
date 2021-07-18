const express = require('express');
const { provider } = require('./../static');
const { isNonEmptyString } = require('./../utils');

const { buildHandleGet, buildStaticRouter } = require('./static');

const handleGet = buildHandleGet({ isNonEmptyString, provider });
const newRouter = () => new express.Router();

exports.label = require('./label');
exports.stat = require('./stat');
exports.static = buildStaticRouter({ newRouter, handleGet });

