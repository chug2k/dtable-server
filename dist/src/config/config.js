"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REDIS_PASSWORD = exports.REDIS_PORT = exports.REDIS_HOST = exports.DTABLE_WEB_SERVICE_URL = exports.PRIVATE_KEY = exports.CONFIG = void 0;

var _path = _interopRequireDefault(require("path"));

var _utils = require("../utils/utils");

var filePath = process.env.DTABLE_SERVER_CONFIG;

if (!filePath) {
  filePath = _path["default"].join(__dirname, '../../config/config.json');
}

var config = (0, _utils.loadJsonFile)(filePath);
var CONFIG = {
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port,
  connectionLimit: config.connection_limit
};
exports.CONFIG = CONFIG;
var PRIVATE_KEY = config.private_key;
exports.PRIVATE_KEY = PRIVATE_KEY;
var DTABLE_WEB_SERVICE_URL = config.dtable_web_service_url;
exports.DTABLE_WEB_SERVICE_URL = DTABLE_WEB_SERVICE_URL;
var REDIS_HOST = config.redis_host;
exports.REDIS_HOST = REDIS_HOST;
var REDIS_PORT = config.redis_port;
exports.REDIS_PORT = REDIS_PORT;
var REDIS_PASSWORD = config.redis_password;
exports.REDIS_PASSWORD = REDIS_PASSWORD;