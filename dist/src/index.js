"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _dtableServer = _interopRequireDefault(require("./dtable-server"));

var _logger = _interopRequireDefault(require("./logger"));

var port = process.env.PORT || 5000;

_logger["default"].info('Starting dtable server process:', process.pid);

process.on('uncaughtException', function (err, origin) {
  _logger["default"].error(err, origin);
});
var dtableServer = new _dtableServer["default"]();
dtableServer.start(port);