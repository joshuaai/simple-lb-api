'use strict';
// create a reference to our server
const app = require('../server/server');
const chai = require('chai');
const expect = chai.expect;

module.exports = {
  app,
  expect,
};
