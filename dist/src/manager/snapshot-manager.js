"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _dbHelper = _interopRequireDefault(require("../db-helper"));

var _logger = _interopRequireDefault(require("../logger"));

var _dtableWebApi = _interopRequireDefault(require("../utils/dtable-web-api"));

var SnapshotManager =
/*#__PURE__*/
function () {
  function SnapshotManager() {
    (0, _classCallCheck2["default"])(this, SnapshotManager);
    this.snapshots = {};
  }

  (0, _createClass2["default"])(SnapshotManager, [{
    key: "snapshotDTable",
    value: function snapshotDTable(dtableUuid, dtableName) {
      var _this = this;

      this.getDTableLatestSnapshot(dtableUuid, function (err, latestCtime, latestCommitId) {
        if (err) {
          _logger["default"].error("DTable ".concat(dtableUuid, " get latest snapshot failed"));

          return;
        } else if (Date.now() < latestCtime + 24 * 3600 * 1000) {
          _logger["default"].debug("DTable ".concat(dtableUuid, " snapshot interval is less than one day"));

          return;
        } else {
          _dtableWebApi["default"].getTableLatestCommitId(dtableUuid).then(function (res) {
            var commitId = res.data.latest_commit_id;

            if (latestCommitId === commitId) {
              _logger["default"].debug("DTable ".concat(dtableUuid, " snapshot ").concat(commitId, " already exists"));

              return;
            } else {
              _this.recordDTableSnapshot(dtableUuid, dtableName, commitId);
            }
          })["catch"](function (error) {
            _logger["default"].error(error);
          });
        }
      });
    }
  }, {
    key: "getDTableLatestSnapshot",
    value: function getDTableLatestSnapshot(dtableUuid, callback) {
      var _this2 = this;

      if (this.snapshots[dtableUuid]) {
        var latestCtime = this.snapshots[dtableUuid].get('ctime');
        var latestCommitId = this.snapshots[dtableUuid].get('commitId');
        callback && callback(null, latestCtime, latestCommitId);
      } else {
        this.queryDTableSnapshot(dtableUuid, function (err, results) {
          if (err) {
            _logger["default"].error('query dtable snapshot failed');

            callback && callback(err);
          }

          if (results.length) {
            var _latestCommitId = results[0].commit_id;
            var _latestCtime = results[0].ctime;
            _this2.snapshots[dtableUuid] = new Map();

            _this2.snapshots[dtableUuid].set('commitId', _latestCommitId);

            _this2.snapshots[dtableUuid].set('ctime', _latestCtime);

            callback && callback(null, _latestCtime, _latestCommitId);
          } else {
            _this2.snapshots[dtableUuid] = new Map();
            var _latestCommitId2 = '';
            var _latestCtime2 = 0;
            callback && callback(null, _latestCtime2, _latestCommitId2);
          }
        });
      }
    }
  }, {
    key: "queryDTableSnapshot",
    value: function queryDTableSnapshot(dtableUuid, callback) {
      var sql = 'SELECT commit_id, ctime FROM dtable_snapshot WHERE \
              dtable_uuid="' + dtableUuid + '" ORDER BY ctime DESC LIMIT 1';
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          callback && callback(err);
        }

        if (results) {
          results = JSON.stringify(results);
          results = JSON.parse(results);
          callback && callback(null, results);
        }
      });
    }
  }, {
    key: "recordDTableSnapshot",
    value: function recordDTableSnapshot(dtableUuid, dtableName, commitId) {
      var _this3 = this;

      var sql = 'INSERT INTO `dtable_snapshot` (dtable_uuid, dtable_name, commit_id, ctime) VALUES (?, ?, ?, ?)';
      var dateNow = Date.now();
      var values = [dtableUuid, dtableName, commitId, dateNow];
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Database error.');
        }

        if (results) {
          _logger["default"].info("Record snapshot ".concat(commitId, " to database."));

          _this3.snapshots[dtableUuid].set('commitId', commitId);

          _this3.snapshots[dtableUuid].set('ctime', dateNow);
        }
      }, values);
    }
  }]);
  return SnapshotManager;
}();

var _default = SnapshotManager;
exports["default"] = _default;