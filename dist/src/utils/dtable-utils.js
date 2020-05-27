"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _request = _interopRequireDefault(require("request"));

var _fs = _interopRequireDefault(require("fs"));

var _dbHelper = _interopRequireDefault(require("../db-helper"));

var _logger = _interopRequireDefault(require("../logger"));

var _dtableWebApi = _interopRequireDefault(require("./dtable-web-api"));

var DtableUtils =
/*#__PURE__*/
function () {
  function DtableUtils() {
    (0, _classCallCheck2["default"])(this, DtableUtils);
  }

  (0, _createClass2["default"])(DtableUtils, null, [{
    key: "loadDtableData",
    value: function loadDtableData(dtable_uuid, callback) {
      _dtableWebApi["default"].getDownloadTableURL(dtable_uuid).then(function (res) {
        var downloadLink = res.data.download_link;

        _request["default"].get(downloadLink, function (error, response, body) {
          if (error) {
            callback && callback(error);
            return;
          }

          if (response && response.statusCode === 200) {
            var dtableData = body;
            callback && callback(null, dtableData);
            return;
          }
        });
      })["catch"](function (error) {
        callback && callback(error);
        return;
      });
    }
  }, {
    key: "updateDtableData",
    value: function updateDtableData(dtable_uuid, tableData, callback) {
      _dtableWebApi["default"].getUpdateTableURL(dtable_uuid).then(function (res) {
        var updateLink = res.data.update_link;
        var fileName = res.data.file_name;

        var r = _request["default"].post(updateLink, function (error, response, body) {
          if (error) {
            callback && callback(error);
            return;
          }

          if (response && response.statusCode === 200) {
            callback && callback(null, fileName);
            return;
          }
        }); // https://www.npmjs.com/package/request


        var form = r.form();
        form.append('parent_dir', '/');
        form.append('replace', 1); // https://www.npmjs.com/package/form-data

        form.append('file', _fs["default"].createReadStream(tableData.path), {
          filename: fileName
        });
      })["catch"](function (error) {
        callback && callback(error);
        return;
      });
    }
  }, {
    key: "queryDtableOperations",
    value: function queryDtableOperations(dtable_uuid, start, count, callback) {
      var sql = "SELECT author, app, op_time, operation, op_id FROM operation_log WHERE\n              dtable_uuid='".concat(dtable_uuid, "' ORDER BY op_id DESC LIMIT ").concat(start, ", ").concat(count);
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          callback && callback(err);
        } // remove RowDataPacket


        results = JSON.stringify(results);
        results = JSON.parse(results);
        callback && callback(null, results);
      });
    }
  }, {
    key: "recordOperation",
    value: function recordOperation(dtable_uuid, version, operation, username, appName) {
      var sql = 'INSERT INTO `operation_log` \
              (dtable_uuid, op_id, op_time, operation, author, app) VALUES (?, ?, ?, ?, ?, ?)';
      var values = [dtable_uuid, version, Date.now(), JSON.stringify(operation), username, appName];
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Database error.');
        }

        if (results) {
          _logger["default"].debug('Success record operation log to database.');
        }
      }, values);
    }
  }, {
    key: "recordOpID",
    value: function recordOpID(dtable_uuid, version) {
      var sql = 'INSERT INTO `operation_checkpoint` (dtable_uuid, op_id) VALUES \
              (?, ?) ON DUPLICATE KEY UPDATE op_id = VALUES(op_id)';
      var values = [dtable_uuid, version];
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Database error.');
        }

        if (results) {
          _logger["default"].debug('Record op_id', version, 'to database.');
        }
      }, values);
    }
  }, {
    key: "listPendingOperationsByDTable",
    value: function listPendingOperationsByDTable(uuid, callback) {
      var sql = 'SELECT a.operation, a.op_id FROM operation_log AS a LEFT JOIN \
              operation_checkpoint AS b ON a.dtable_uuid=b.dtable_uuid WHERE \
              a.dtable_uuid="' + uuid + '" AND a.op_id>b.op_id ORDER BY a.op_id';
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Database error.');
        }

        if (results) {
          callback && callback(results);
        }
      });
    }
  }, {
    key: "listOperationsByDTable",
    value: function listOperationsByDTable(uuid, callback) {
      var sql = 'SELECT a.operation, a.op_id FROM operation_log AS a WHERE a.dtable_uuid="' + uuid + '"';
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Database error.');
        }

        if (results) {
          callback && callback(results);
        }
      });
    }
    /**
     * @param interval: expected to be a micro sec number eg: if you want query operation count in last 1 hour, interval should be 3600*1000
     * @param callback: callback method
     */

  }, {
    key: "queryOperationCount",
    value: function queryOperationCount(interval, callback) {
      var lastTimeStamp = interval !== -1 ? Date.now() - interval : -1;
      var sql = "SELECT count(1) AS count FROM operation_log WHERE op_time>=?";
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          _logger["default"].error(err);

          throw new Error('Databse error.');
        }

        if (results) {
          callback && callback(results[0].count);
        }
      }, [lastTimeStamp]);
    }
  }, {
    key: "getDtableDeletedRows",
    value: function getDtableDeletedRows(dtableUuid, start, count, callback) {
      var sql = "SELECT id, dtable_uuid, row_id, op_user, op_time, detail, op_app FROM\n              activities WHERE dtable_uuid=? AND TO_DAYS(NOW())-TO_DAYS(op_time)<=7\n              AND op_type='delete_row' ORDER BY id DESC LIMIT ".concat(start, ", ").concat(count, ";");
      (0, _dbHelper["default"])(sql, function (err, results) {
        if (err) {
          callback && callback(err, null);
          return;
        }

        callback && callback(null, results);
      }, [dtableUuid]);
    }
  }]);
  return DtableUtils;
}();

var _default = DtableUtils;
exports["default"] = _default;