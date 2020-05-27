"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _log4js = require("log4js");

var logger = (0, _log4js.getLogger)('dtable-server');
var logFile = '../dtable-server.log';

if (process.env.LOG_DIR) {
  logFile = _path["default"].join(process.env.LOG_DIR, 'dtable-server.log');
}

var logLevel = process.env.DTABLE_SERVER_LOG_LEVEL || 'info';
(0, _log4js.configure)({
  appenders: {
    logger: {
      type: 'file',
      filename: logFile
    }
  },
  categories: {
    "default": {
      appenders: ['logger'],
      level: logLevel
    }
  }
});
var _default = logger;
exports["default"] = _default;