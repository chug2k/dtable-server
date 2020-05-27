"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteDir = deleteDir;
exports.loadJsonFile = loadJsonFile;
exports.genJWT = genJWT;
exports.multiMiddleware = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _connectMultiparty = _interopRequireDefault(require("connect-multiparty"));

var _config = require("../config/config");

function deleteDir(path) {
  if (_fs["default"].existsSync(path)) {
    var info = _fs["default"].statSync(path);

    if (info.isDirectory()) {
      var data = _fs["default"].readdirSync(path);

      if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          delPath("".concat(path, "/").concat(data[i]));

          if (i == data.length - 1) {
            delPath("".concat(path));
          }
        }
      } else {
        _fs["default"].rmdirSync(path);
      }
    } else if (info.isFile()) {
      _fs["default"].unlinkSync(path);
    }
  }
}

function loadJsonFile(file) {
  var json = _fs["default"].readFileSync(file).toString();

  return JSON.parse(json);
}

function genJWT(dtable_uuid) {
  var token = _jsonwebtoken["default"].sign({
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
    dtable_uuid: dtable_uuid
  }, _config.PRIVATE_KEY);

  return token;
}

var multiMiddleware = (0, _connectMultiparty["default"])();
exports.multiMiddleware = multiMiddleware;