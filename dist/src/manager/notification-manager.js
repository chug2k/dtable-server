"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.MSG_TYPE_ROW_COMMENT = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _dbHelper = _interopRequireDefault(require("../db-helper"));

var MSG_TYPE_ROW_COMMENT = 'row_comment';
exports.MSG_TYPE_ROW_COMMENT = MSG_TYPE_ROW_COMMENT;

var NotificationManager =
/*#__PURE__*/
function () {
  function NotificationManager() {
    (0, _classCallCheck2["default"])(this, NotificationManager);
  }

  (0, _createClass2["default"])(NotificationManager, [{
    key: "listNotifications",
    value: function listNotifications(username, dtable_uuid, limit, count, callback) {
      var sql = "SELECT id, username, msg_type, created_at, detail, seen FROM dtable_notifications\n              WHERE username=? AND dtable_uuid=? ORDER BY created_at DESC LIMIT ?, ?";
      var values = [username, dtable_uuid, limit, count];
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, values);
    }
  }, {
    key: "getNotification",
    value: function getNotification(username, notification_id, callback) {
      var sql = "SELECT id, username, msg_type, created_at, detail, seen FROM dtable_notifications\n              WHERE id=? AND username=?";
      var values = [notification_id, username];
      (0, _dbHelper["default"])(sql, function (err, results) {
        var notification = results.length === 0 ? null : results[0];
        callback && callback(err, notification);
      }, values);
    }
  }, {
    key: "addNotification",
    value: function addNotification(username, dtable_uuid, msg_type, detail, callback) {
      var sql = "INSERT INTO dtable_notifications(username, dtable_uuid, msg_type, created_at, detail)\n              VALUES (?, ?, ?, ?, ?)";
      var values = [username, dtable_uuid, msg_type, new Date(), detail];
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, values);
    }
  }, {
    key: "updateNotifications",
    value: function updateNotifications(username, dtable_uuid, seen, callback) {
      var sql = "UPDATE dtable_notifications SET seen=? WHERE username=? AND dtable_uuid=?";
      var values = [seen, username, dtable_uuid];
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, values);
    }
  }, {
    key: "updateNotification",
    value: function updateNotification(username, notification_id, seen, callback) {
      var sql = "UPDATE dtable_notifications SET seen=? WHERE id=? AND username=?";
      var values = [seen, notification_id, username];
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, values);
    }
  }, {
    key: "deleteNotifications",
    value: function deleteNotifications(username, dtable_uuid, callback) {
      var sql = "DELETE FROM dtable_notifications WHERE username=? AND dtable_uuid=?";
      var values = [username, dtable_uuid];
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, values);
    }
  }]);
  return NotificationManager;
}();

var _default = NotificationManager;
exports["default"] = _default;