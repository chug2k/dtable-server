"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var UserManager =
/*#__PURE__*/
function () {
  function UserManager() {
    (0, _classCallCheck2["default"])(this, UserManager);
    this.users = [];
  }

  (0, _createClass2["default"])(UserManager, [{
    key: "addUser",
    value: function addUser(dtableUuid, socketId, username, permission, appName) {
      if (!this.users[dtableUuid]) {
        this.users[dtableUuid] = new Map();
      }

      this.users[dtableUuid].set(socketId, {
        username: username,
        permission: permission,
        appName: appName
      });
      return true;
    }
  }, {
    key: "deleteUser",
    value: function deleteUser(dtableUuid, socketId) {
      if (this.users[dtableUuid] && this.users[dtableUuid].has(socketId)) {
        this.users[dtableUuid]["delete"](socketId);

        if (this.users[dtableUuid].size === 0) {
          this.users[dtableUuid] = null;
          delete this.users[dtableUuid];
        }

        return true;
      }

      return false;
    }
  }, {
    key: "findUser",
    value: function findUser(dtableUuid, socketId) {
      if (this.users[dtableUuid] && this.users[dtableUuid].has(socketId)) {
        var username = this.users[dtableUuid].get(socketId);
        return username;
      }

      return null;
    }
  }, {
    key: "getSocketIdList",
    value: function getSocketIdList(dtableUuid, username) {
      var socketIdList = [];

      if (this.users[dtableUuid]) {
        this.users[dtableUuid].forEach(function (user, socketId) {
          if (user.username === username) {
            socketIdList.push(socketId);
          }
        });
        return socketIdList;
      }

      return socketIdList;
    }
  }]);
  return UserManager;
}();

var _default = UserManager;
exports["default"] = _default;