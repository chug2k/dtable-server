"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mysql = _interopRequireDefault(require("mysql"));

var _config = require("../config/config");

var mysql_config = {
  host: _config.CONFIG.host,
  user: _config.CONFIG.user,
  password: _config.CONFIG.password,
  database: _config.CONFIG.database,
  port: _config.CONFIG.port,
  connectionLimit: _config.CONFIG.connectionLimit === undefined ? 10 : _config.CONFIG.connectionLimit,
  timezone: '+00:00'
};

var pool = _mysql["default"].createPool(mysql_config);

function DBHelper(sql, callback) {
  var add = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  if (add !== null) {
    pool.query(sql, add, callback);
  } else {
    pool.query(sql, callback);
  }
}

var _default = DBHelper;
exports["default"] = _default;