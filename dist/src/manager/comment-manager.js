"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _dbHelper = _interopRequireDefault(require("../db-helper"));

var CommentManager =
/*#__PURE__*/
function () {
  function CommentManager() {
    (0, _classCallCheck2["default"])(this, CommentManager);
  }

  (0, _createClass2["default"])(CommentManager, [{
    key: "getRowCommentCount",
    value: function getRowCommentCount(dtable_uuid, row_id, callback) {
      var sql = "SELECT count(1) AS count FROM dtable_row_comments WHERE dtable_uuid=? AND row_id=?;";
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, [dtable_uuid, row_id]);
    }
  }, {
    key: "listRowComments",
    value: function listRowComments(dtable_uuid, row_id, limit, offset, callback) {
      var sql = "SELECT id, author, comment, dtable_uuid, row_id, created_at, updated_at, resolved FROM dtable_row_comments \n                WHERE dtable_uuid=? AND row_id=? \n                ORDER BY created_at ASC LIMIT ? OFFSET ?;";
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, [dtable_uuid, row_id, limit, offset]);
    }
  }, {
    key: "getRowComment",
    value: function getRowComment(comment_id, callback) {
      var sql = "SELECT id, author, comment, dtable_uuid, row_id, created_at, updated_at, resolved\n                FROM dtable_row_comments WHERE id=?;";
      (0, _dbHelper["default"])(sql, function (err, results) {
        var comment = results.length === 0 ? null : results[0];
        callback && callback(err, comment);
      }, [comment_id]);
    }
  }, {
    key: "addRowComment",
    value: function addRowComment(username, dtable_uuid, row_id, comment, callback) {
      var sql = "INSERT INTO dtable_row_comments(author, comment, created_at, updated_at, dtable_uuid, row_id)\n                VALUES (?, ?, ?, ?, ?, ?);";
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, [username, comment, new Date(), new Date(), dtable_uuid, row_id]);
    }
  }, {
    key: "updateRowComment",
    value: function updateRowComment(username, comment_id, options, callback) {
      var comment = options.comment,
          resolved = options.resolved;
      var update_sqls = ["updated_at=?"];
      var params = [new Date()];

      if (comment) {
        update_sqls.push("comment=?");
        params.push(comment);
      }

      if (resolved) {
        update_sqls.push("resolved=?");
        params.push(resolved);
      }

      var final_update_sql = update_sqls.join(', ');
      var sql = "UPDATE dtable_row_comments SET ".concat(final_update_sql, " WHERE id=?");
      params.push(comment_id);
      (0, _dbHelper["default"])(sql, function (err) {
        callback && callback(err);
      }, params);
    }
  }, {
    key: "deleteRowComment",
    value: function deleteRowComment(comment_id, callback) {
      var sql = "DELETE FROM dtable_row_comments WHERE id=?";
      (0, _dbHelper["default"])(sql, function (err) {
        callback && callback(err);
      }, [comment_id]);
    }
  }, {
    key: "listRowCommentsWithinDays",
    value: function listRowCommentsWithinDays(dtable_uuid, days, callback) {
      var t = new Date();
      t.setDate(t.getDate() - days);
      var sql = "SELECT id, author, comment, dtable_uuid, row_id, created_at, updated_at, resolved FROM dtable_row_comments\n                WHERE dtable_uuid=? AND created_at>=?\n                ORDER BY created_at ASC;";
      (0, _dbHelper["default"])(sql, function (err, results) {
        callback && callback(err, results);
      }, [dtable_uuid, t]);
    }
  }]);
  return CommentManager;
}();

var _default = CommentManager;
exports["default"] = _default;