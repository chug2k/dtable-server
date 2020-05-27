"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _socket = _interopRequireDefault(require("socket.io"));

var _logger = _interopRequireDefault(require("../logger"));

var _auth = require("../utils/auth");

var _message = _interopRequireDefault(require("../utils/message"));

var _callbackMessage = require("../utils/callback-message");

var WebSocketManager =
/*#__PURE__*/
function () {
  function WebSocketManager(dtableServer) {
    (0, _classCallCheck2["default"])(this, WebSocketManager);
    this.dtableServer = dtableServer;
    this.dtableManager = dtableServer.dtableManager;
    this.server = dtableServer.httpService.server;
    this.io = null;
    this.userManager = dtableServer.userManager;
    this.connectCount = 0;
    this.operationCountSinceUp = 0;
    this.appConnectionSocketMap = new Map(); // {socket.id   => payload}

    this.appConnectionDTableMap = new Map(); // {dtable_uuid => {app-1, app-2, app-3...a set of app-name}}
  }

  (0, _createClass2["default"])(WebSocketManager, [{
    key: "start",
    value: function start() {
      var _this = this;

      this.io = (0, _socket["default"])(this.server);
      this.io.on('connection', function (socket) {
        _this.onConnected(socket);
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      this.io.disconnect();
    }
  }, {
    key: "onConnected",
    value: function onConnected(socket) {
      var _this2 = this;

      // socket is a changed object, can not be assigned a class variable.
      // this.socket = socket;
      _logger["default"].debug("websocket connected ok.");

      this.connectCount++;
      socket.on('join-room', function (dtable_uuid, accessToken, callback) {
        var _decodeAccessToken = (0, _auth.decodeAccessToken)(accessToken, dtable_uuid),
            payload = _decodeAccessToken.payload,
            error_type = _decodeAccessToken.error_type;

        if (!payload) {
          _logger["default"].error('join room failed' + ' : ' + _callbackMessage.ERROR_MESSAGE[error_type]);

          callback && callback(_message["default"].fail(error_type));
          return;
        }

        _this2.recordAppConnection(payload, socket);

        var username = payload.username,
            app_name = payload.app_name;

        if (!_this2.userManager.findUser(dtable_uuid, socket.id)) {
          var permission = payload.permission;

          _this2.userManager.addUser(dtable_uuid, socket.id, username, permission, app_name);

          _logger["default"].debug(username + ' join room ' + dtable_uuid);

          socket.join(dtable_uuid);

          _this2.dtableManager.getDtable(dtable_uuid, function (err, dtable) {
            if (err) {
              _logger["default"].error('Table data reload failed, error message:', err);

              callback && callback(_message["default"].fail(_callbackMessage.ERROR_TYPE.INTERNAL_ERROR));
            }

            if (dtable) {
              var dtableValue = dtable.value;
              callback && callback(_message["default"].success(_callbackMessage.SUCCESS_TYPE.JOINED_SUCCESSFULLY, dtableValue.version));
            } else {
              _logger["default"].debug('Loading data failed.');

              callback && callback(_message["default"].fail(_callbackMessage.ERROR_TYPE.INTERNAL_ERROR));
            }
          });
        } // can send message to other users
        // this.socket.to(dtable_uuid).emit('join room', 'user' + username + '正在阅读当前表格', this.rooms[dtable_uuid]);

      });
      socket.on('update-dtable', function (dtable_uuid, operation, callback) {
        var user = _this2.userManager.findUser(dtable_uuid, socket.id);

        var permission = user.permission;

        if (permission !== 'rw') {
          _logger["default"].error('You don\'t have permission to update the current table.');

          callback && callback(_message["default"].fail(_callbackMessage.ERROR_TYPE.PERMISSION_DENIED), false);
          return;
        }

        _logger["default"].debug('Received operation: ' + operation);

        var dtable = _this2.dtableManager.dtables.get(dtable_uuid);

        if (dtable) {
          var username = user.username,
              appName = user.appName;

          var _this2$dtableManager$ = _this2.dtableManager.execSocketOperation(username, appName, dtable_uuid, dtable, JSON.parse(operation)),
              isValid = _this2$dtableManager$.isValid;

          if (!isValid) {
            var error_type = _callbackMessage.ERROR_TYPE.OPERATION_INVALID;

            _logger["default"].error('Operation can not be execute :' + _callbackMessage.ERROR_MESSAGE[error_type]);

            callback && callback(_message["default"].fail(error_type), false);
            return;
          }

          _this2.operationCountSinceUp++;
          var nextVersion = dtable.value.version;
          socket.to(dtable_uuid).emit('update-dtable', operation, nextVersion);
          callback && callback(_message["default"].success(_callbackMessage.SUCCESS_TYPE.UPDATE_COMPLETED, nextVersion));
        } else {
          _logger["default"].error("DTable ".concat(dtable_uuid, " can't be loaded."));

          callback && callback(_message["default"].fail(_callbackMessage.ERROR_TYPE.INTERNAL_ERROR), false);
        }
      });
      socket.on('leave-room', function () {
        var dtable_uuid = socket.handshake.query.dtable_uuid;

        var user = _this2.userManager.findUser(dtable_uuid, socket.id);

        var username = user ? user.username : null;

        _logger["default"].debug(username + ' is leaving room ' + dtable_uuid);

        _this2.userManager.deleteUser(dtable_uuid, socket.id);
      });
      socket.on('disconnect', function () {
        var dtable_uuid = socket.handshake.query.dtable_uuid;

        var user = _this2.userManager.findUser(dtable_uuid, socket.id);

        var username = user ? user.username : null;

        _logger["default"].debug(username + " disconnect.");

        _this2.userManager.deleteUser(dtable_uuid, socket.id);

        _this2.connectCount--; // update app-socket-map and app-dtable-map

        if (_this2.appConnectionSocketMap.has(socket.id)) {
          if (_this2.appConnectionDTableMap.has(dtable_uuid)) {
            _this2.appConnectionDTableMap.get(dtable_uuid)["delete"](_this2.appConnectionSocketMap.get(socket.id).app_name);

            if (_this2.appConnectionDTableMap.get(dtable_uuid).size === 0) {
              _this2.appConnectionDTableMap["delete"](dtable_uuid);
            }
          }

          _this2.appConnectionSocketMap["delete"](socket.id);
        }
      });
    }
  }, {
    key: "getWebSocketsCount",
    value: function getWebSocketsCount() {
      return this.connectCount;
    }
  }, {
    key: "getOperationCountSinceUp",
    value: function getOperationCountSinceUp() {
      return this.operationCountSinceUp;
    }
  }, {
    key: "recordAppConnection",
    value: function recordAppConnection(payload, socket) {
      if (!payload.app_name) {
        return;
      }

      _logger["default"].debug('record app_name: ', payload.app_name, ' socket id: ', socket.id);

      this.appConnectionSocketMap.set(socket.id, payload);

      if (this.appConnectionDTableMap.get(payload.dtable_uuid)) {
        this.appConnectionDTableMap.get(payload.dtable_uuid).add(payload.app_name);
      } else {
        this.appConnectionDTableMap.set(payload.dtable_uuid, new Set([payload.app_name]));
      }
    }
  }, {
    key: "getAppConnectionCount",
    value: function getAppConnectionCount() {
      return this.appConnectionSocketMap.size;
    }
  }, {
    key: "getDTableConnectedApps",
    value: function getDTableConnectedApps(dtable_uuid) {
      if (this.appConnectionDTableMap.has(dtable_uuid)) {
        return Array.from(this.appConnectionDTableMap.get(dtable_uuid));
      }

      return [];
    }
  }]);
  return WebSocketManager;
}();

var _default = WebSocketManager;
exports["default"] = _default;