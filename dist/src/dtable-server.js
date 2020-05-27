"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _eventManager = _interopRequireDefault(require("./manager/event-manager"));

var _dtableManager = _interopRequireDefault(require("./manager/dtable-manager"));

var _websocketManager = _interopRequireDefault(require("./manager/websocket-manager"));

var _httpService = _interopRequireDefault(require("./http-service"));

var _userManager = _interopRequireDefault(require("./manager/user-manager"));

var _snapshotManager = _interopRequireDefault(require("./manager/snapshot-manager"));

var _notificationManager = _interopRequireDefault(require("./manager/notification-manager"));

var _logger = _interopRequireDefault(require("./logger"));

var _commentManager = _interopRequireDefault(require("./manager/comment-manager"));

var _sysManager = _interopRequireDefault(require("./manager/sys-manager"));

var DTableServer =
/*#__PURE__*/
function () {
  function DTableServer() {
    (0, _classCallCheck2["default"])(this, DTableServer);
    this.eventManager = new _eventManager["default"]();
    this.userManager = new _userManager["default"]();
    this.commentManager = new _commentManager["default"]();
    this.snapshotManager = new _snapshotManager["default"]();
    this.notificationManager = new _notificationManager["default"]();
    this.dtableManager = new _dtableManager["default"](this);
    this.httpService = new _httpService["default"](this);
    this.webSocketManager = new _websocketManager["default"](this);
    this.sysManager = new _sysManager["default"](this);
  }

  (0, _createClass2["default"])(DTableServer, [{
    key: "start",
    value: function start(port) {
      this.httpService.server.listen(port, function () {
        return _logger["default"].info('listening on port ' + port);
      });
      this.dtableManager.start(); // start save timer

      this.webSocketManager.start(); // start socket listener

      this.eventManager.start(); // start events publisher
    }
  }, {
    key: "getDTableManager",
    value: function getDTableManager() {
      return this.dtableManager;
    }
  }, {
    key: "getWebSocketManager",
    value: function getWebSocketManager() {
      return this.webSocketManager;
    }
  }, {
    key: "getUserManager",
    value: function getUserManager() {
      return this.userManager;
    }
  }, {
    key: "getCommentManager",
    value: function getCommentManager() {
      return this.commentManager;
    }
  }, {
    key: "getNotificationManager",
    value: function getNotificationManager() {
      return this.notificationManager;
    }
  }, {
    key: "getSysManager",
    value: function getSysManager() {
      return this.sysManager;
    }
  }]);
  return DTableServer;
}();

var _default = DTableServer;
exports["default"] = _default;