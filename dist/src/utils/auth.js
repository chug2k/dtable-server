"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeAdminAuthorization = decodeAdminAuthorization;
exports.decodeAuthorization = decodeAuthorization;
exports.decodeAdminAccessToken = decodeAdminAccessToken;
exports.decodeAccessToken = decodeAccessToken;

var _logger = _interopRequireDefault(require("../logger"));

var _callbackMessage = require("./callback-message");

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _config = require("../config/config");

function decodeAdminAuthorization(authorization) {
  if (!authorization || authorization.split(' ').length !== 2 || authorization.split(' ')[0] !== 'Token') {
    return null;
  }

  var accessToken = authorization.split(' ')[1];

  var _decodeAdminAccessTok = decodeAdminAccessToken(accessToken),
      payload = _decodeAdminAccessTok.payload;

  return payload;
}

function decodeAuthorization(authorization, dtable_uuid) {
  if (!authorization || authorization.split(' ').length !== 2 || authorization.split(' ')[0] !== 'Token') {
    return null;
  }

  var accessToken = authorization.split(' ')[1];

  var _decodeAccessToken = decodeAccessToken(accessToken, dtable_uuid),
      payload = _decodeAccessToken.payload;

  return payload;
}

function decodeAdminAccessToken(accessToken) {
  var result = {
    payload: null,
    error_type: _callbackMessage.ERROR_TYPE.PERMISSION_DENIED
  };

  _jsonwebtoken["default"].verify(accessToken, _config.PRIVATE_KEY, {
    algorithms: ['HS256']
  }, function (err, decode) {
    if (err) {
      _logger["default"].error(err.message);

      result = {
        payload: null,
        error_type: _callbackMessage.ERROR_TYPE.TOKEN_EXPIRED
      };
    }

    if (decode) {
      if (!decode.admin) {
        result = {
          payload: null,
          error_type: _callbackMessage.ERROR_TYPE.PERMISSION_DENIED
        };
      } else {
        result = {
          payload: decode
        };
      }
    }
  });

  return result;
}

function decodeAccessToken(accessToken, dtable_uuid) {
  var result = {
    payload: null,
    error_type: _callbackMessage.ERROR_TYPE.PERMISSION_DENIED
  };

  _jsonwebtoken["default"].verify(accessToken, _config.PRIVATE_KEY, {
    algorithms: ['HS256']
  }, function (err, decode) {
    if (err) {
      _logger["default"].error(err.message);

      result = {
        payload: null,
        error_type: _callbackMessage.ERROR_TYPE.TOKEN_EXPIRED
      };
    }

    if (decode) {
      if (decode.dtable_uuid !== dtable_uuid) {
        _logger["default"].error('You don\'t have permission to get data from the current table.');

        result = {
          payload: null,
          error_type: _callbackMessage.ERROR_TYPE.PERMISSION_DENIED
        };
      } else {
        result = {
          payload: decode
        };
      }
    }
  });

  return result;
}