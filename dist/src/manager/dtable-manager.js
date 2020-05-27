"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _fs = _interopRequireDefault(require("fs"));

var _moment = _interopRequireDefault(require("moment"));

var _uuid = require("uuid");

var _dtableStore = require("dtable-store");

var _defaultDtable = require("../model/default-dtable");

var _dtable2 = _interopRequireDefault(require("../model/dtable"));

var _dtableUtils = _interopRequireDefault(require("../utils/dtable-utils"));

var _logger = _interopRequireDefault(require("../logger"));

var _dtableWebApi = _interopRequireDefault(require("../utils/dtable-web-api"));

var _operationUtils = _interopRequireDefault(require("../utils/operation-utils"));

var _callbackMessage = require("../utils/callback-message");

var _utils = require("../utils/utils");

var _dbHelper = _interopRequireDefault(require("../db-helper"));

var DTableManager =
/*#__PURE__*/
function () {
  function DTableManager(dtableServer) {
    (0, _classCallCheck2["default"])(this, DTableManager);
    this.dtableServer = dtableServer;
    this.eventManager = dtableServer.eventManager;
    this.snapshotManager = dtableServer.snapshotManager;
    this.dtables = new Map();
    this.options = [];
    this.saveTimer = null;
    this.isSaving = false;
    this.lastSavingInfo = {
      count: 0,
      startTime: null,
      endTime: null
    };
  }

  (0, _createClass2["default"])(DTableManager, [{
    key: "start",
    value: function start() {
      var _this = this;

      this.saveTimer = setInterval(function () {
        _this.saveDtable();
      }, 300000);
      process.on('SIGTERM', function () {
        _logger["default"].info('Exiting server process:', process.pid);

        _this.saveDtable();

        setInterval(function () {
          process.kill(process.pid, 'SIGKILL');
        }, 10000);
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      clearInterval(this.saveTimer);
    }
  }, {
    key: "isDtableExist",
    value: function isDtableExist(uuid) {
      return this.dtables.get(uuid);
    }
  }, {
    key: "canOpApply",
    value: function canOpApply(dtable_uuid, operation) {
      var dtable = this.dtables.get(dtable_uuid);
      var tables = dtable.value.tables;
      return _dtableStore.TableUtils.canOpApply(tables, operation);
    }
  }, {
    key: "addDtable",
    value: function addDtable(uuid, dtable) {
      // After reloading the data, you need to update the data in memory
      var table = new _dtable2["default"](dtable);
      this.dtables.set(uuid, table);
    }
  }, {
    key: "removeDtable",
    value: function removeDtable(uuid) {
      if (this.dtables.has(uuid)) {
        this.dtables["delete"](uuid);
      }
    }
  }, {
    key: "getDtable",
    value: function getDtable(uuid, callback, lang) {
      var _this2 = this;

      if (this.dtables.has(uuid)) {
        var dtable = this.dtables.get(uuid);
        callback && callback(null, dtable);
      } else {
        _dtableUtils["default"].loadDtableData(uuid, function (err, results) {
          if (err) {
            var errorType = _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED;
            var error = {
              'error_type': errorType,
              'error_message': "dtable_uuid: ".concat(uuid, " - ") + _callbackMessage.ERROR_MESSAGE[errorType]
            };
            callback && callback(error);
            return;
          }

          if (!results) {
            // init data
            results = JSON.stringify((0, _defaultDtable.generatorDefaultData)());

            _this2.addDtable(uuid, results);

            _dtableUtils["default"].listOperationsByDTable(uuid, function (operations) {
              if (operations.length === 0) {
                // Encapsulating a socket operation
                var operation = {
                  op_type: _dtableStore.OPERATION_TYPE.UPDATE_DEFAULT_DATA,
                  table_id: '0000',
                  view_id: '0000',
                  column_key: '0000',
                  lang: lang
                };

                _this2.execInitDataOperation(uuid, operation, 'system');

                var _dtable = _this2.dtables.get(uuid);

                callback && callback(null, _dtable);
              } else {
                _this2.applyPendingOperations(uuid, operations, function () {
                  var dtable = _this2.dtables.get(uuid);

                  callback && callback(null, dtable);
                });
              }
            });
          } else {
            _this2.addDtable(uuid, results);

            _dtableUtils["default"].listPendingOperationsByDTable(uuid, function (operations) {
              _this2.applyPendingOperations(uuid, operations, function () {
                var dtable = _this2.dtables.get(uuid);

                callback && callback(null, dtable);
              });
            });
          }
        });
      }
    }
  }, {
    key: "saveDtable",
    value: function saveDtable() {
      var _this3 = this;

      if (this.isSaving) {
        _logger["default"].debug('Last save task not completed.');

        return;
      }

      var startTime = Date.now();
      this.isSaving = true;
      var actions = [];
      var keys = this.dtables.keys();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var key = _step.value;

          var dtable = _this3.dtables.get(key);

          var meta = dtable.getMeta();

          if (meta.need_save) {
            var action = function action() {
              return new Promise(function (resolve) {
                var version = dtable.value.version;
                var dtableUuid = key;
                var dtableData = dtable.serializeTablesData();
                var filePath = '/tmp/' + (0, _uuid.v4)();

                _fs["default"].writeFile(filePath, dtableData, {
                  flag: 'w+'
                }, function (err) {
                  if (err) {
                    _logger["default"].error('file write err: ', err);

                    (0, _utils.deleteDir)(filePath);
                    resolve();
                  } else {
                    _dtableUtils["default"].updateDtableData(dtableUuid, {
                      path: filePath
                    }, function (error, dtableName) {
                      if (error) {
                        _logger["default"].error(error);
                      }

                      if (dtableName) {
                        _logger["default"].debug("dtable data update success.");

                        _dtableUtils["default"].recordOpID(dtableUuid, version);

                        _this3.snapshotManager.snapshotDTable(dtableUuid, dtableName);
                      } else {
                        _logger["default"].error("This can't happen. DTable saved but no dtableName is empty.");
                      }

                      (0, _utils.deleteDir)(filePath);
                      resolve();
                    });

                    dtable.setMeta({
                      need_save: false
                    });
                  }
                });
              });
            };

            actions.push(action());
          }
        };

        for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      Promise.all(actions).then(function () {
        var count = actions.length;
        _this3.isSaving = false;
        _this3.lastSavingInfo.count = count;
        _this3.lastSavingInfo.startTime = startTime;
        _this3.lastSavingInfo.endTime = Date.now();

        _logger["default"].debug("".concat(count, " dtables saved."));
      });
    }
  }, {
    key: "updateDTable",
    value: function updateDTable(dtable, operation) {
      var op = new _dtableStore.Operation(operation);
      var value = dtable.value;
      var newValue = op.apply(value);
      var nextVersion = dtable.value.version + 1;
      newValue = Object.assign({}, newValue, {
        version: nextVersion
      });
      dtable.setValue(newValue);
    }
  }, {
    key: "execHttpOperation",
    value: function execHttpOperation(username, appName, dtable_uuid, dtable, operation) {
      // valid
      var _OperationUtils$check = _operationUtils["default"].checkOperation(dtable, operation),
          isValid = _OperationUtils$check.isValid,
          error_message = _OperationUtils$check.error_message;

      if (!isValid) {
        return {
          isValid: isValid,
          error_message: error_message
        };
      } // Encapsulation operation


      var newOperation = _operationUtils["default"].encapsulateOperation(dtable, operation); // send event message


      this.eventManager.publishEvents(dtable_uuid, dtable, newOperation, username, appName); // execute

      this.updateDTable(dtable, operation); // record

      var version = dtable.value.version;

      _dtableUtils["default"].recordOperation(dtable_uuid, version, newOperation, username, appName); // broadcast


      var execOperation = JSON.stringify(newOperation);
      var webSocketManager = this.dtableServer.webSocketManager;
      webSocketManager.io["in"](dtable_uuid).emit('update-dtable', execOperation, version);
      return {
        isValid: true
      };
    }
  }, {
    key: "execSocketOperation",
    value: function execSocketOperation(username, appName, dtable_uuid, dtable, operation) {
      // valid
      var isValid = this.canOpApply(dtable_uuid, operation);

      if (!isValid) {
        return {
          isValid: isValid
        };
      }

      var newOperation = operation; // send event message

      this.eventManager.publishEvents(dtable_uuid, dtable, newOperation, username, appName); // execute

      this.updateDTable(dtable, newOperation); // record

      var version = dtable.value.version;

      _dtableUtils["default"].recordOperation(dtable_uuid, version, newOperation, username, appName);

      return {
        isValid: true
      };
    }
  }, {
    key: "execInitDataOperation",
    value: function execInitDataOperation(dtable_uuid, operation, username) {
      var dtable = this.dtables.get(dtable_uuid);
      var op = new _dtableStore.Operation(operation);

      if (dtable && dtable.value && dtable.value.tables) {
        this.updateDTable(dtable, operation);
        var version = dtable.value.version;

        _dtableUtils["default"].recordOperation(dtable_uuid, version, operation, username);

        return version;
      } else {
        _logger["default"].error("DTable data loading error, please check your code to solve the error.");

        throw new Error('Dtable data is error.');
      }
    }
  }, {
    key: "applyPendingOperations",
    value: function applyPendingOperations(uuid, results, callback) {
      if (results.length) {
        _logger["default"].debug('DTable', uuid, 'applying pending operations...');

        var dtable = this.dtables.get(uuid);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = results[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var result = _step2.value;
            var op = new _dtableStore.Operation(JSON.parse(result.operation));
            var version = result.op_id;

            if (dtable && dtable.value && dtable.value.tables) {
              var canOpApply = this.canOpApply(uuid, op);

              if (canOpApply) {
                var value = dtable.value;
                var newValue = op.apply(value);
                newValue = Object.assign({}, newValue, {
                  version: version
                });
                dtable.setValue(newValue);
              }
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        _logger["default"].debug('DTable', uuid, 'applyed pending operations.');
      }

      callback && callback();
    }
  }, {
    key: "getDTableLoadedCount",
    value: function getDTableLoadedCount() {
      return this.dtables.size;
    }
  }, {
    key: "getLastDTableSavingInfo",
    value: function getLastDTableSavingInfo() {
      return this.lastSavingInfo;
    }
  }, {
    key: "getRelatedUsers",
    value: function getRelatedUsers(dtable_uuid, callback) {
      _dtableWebApi["default"].getTableRelatedUsers(dtable_uuid).then(function (res) {
        callback && callback(null, res.data.user_list);
      })["catch"](function (error) {
        if (error.response) {
          if (error.response.data && error.response.data.error_msg) {
            callback && callback(new Error(error.response.data.error_msg), null);
          } else {
            var errorMsg = 'dtable-web server error: ' + error.response.status;
            callback && callback(new Error(errorMsg), null);
          }
        } else {
          callback && callback(error, null);
        }
      });
    }
  }, {
    key: "listTableViewRows",
    value: function listTableViewRows(dtable, table, view) {
      // if view is grouped, getViewRows return extracted rows from group, regardless group structure
      var rows = _dtableStore.Views.getViewRows(view, table);

      return this.convertRows(dtable, table, view, rows);
    }
  }, {
    key: "listTableViewGroupedRows",
    value: function listTableViewGroupedRows(dtable, table, view) {
      var _this4 = this;

      var groupedRows = _dtableStore.Views.getGroupedRows(view, table);

      groupedRows.map(function (group) {
        group.rows = _this4.convertRows(dtable, table, view, group.rows);
      });
      return groupedRows;
    }
  }, {
    key: "convertRows",
    value: function convertRows(dtable, table, view, rows) {
      var formulaColumns = _dtableStore.Views.getAllFormulaColumns(_dtableStore.Views.getColumns(view, table));

      var formulaResults = {};

      if (formulaColumns && formulaColumns.length > 0) {
        _dtableStore.Views.updateFormulaRows(view, table, formulaColumns, rows);

        formulaResults = _dtableStore.Views.getFormulaRows(view);
      }

      return rows.map(function (row) {
        return _dtableStore.RowUtils.convertRow(row, dtable.value, table, view, formulaResults);
      });
    }
  }, {
    key: "listTableViewFilteredRows",
    value: function listTableViewFilteredRows(dtable, table, view, filters, filterConjunction) {
      var originalRows = _dtableStore.Views.getViewRows(view, table);

      var filteredRows = _dtableStore.RowUtils.filterRows(originalRows, table, filters, filterConjunction);

      return this.convertRows(dtable, table, view, filteredRows);
    }
  }, {
    key: "insertRowToTable",
    value: function insertRowToTable(username, appName, dtableUuid, dtable, options, callback) {
      var table_name = options.table_name,
          anchor_row_id = options.anchor_row_id,
          row = options.row,
          row_insert_position = options.row_insert_position; // resource check

      var table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, table_name);

      if (!table) {
        var _error_message = {
          error_type: 'table_not_exist',
          error_message: "table ".concat(table_name, " not found")
        };
        callback && callback(false, _error_message);
        return;
      }

      var operation = {
        op_type: _dtableStore.OPERATION_TYPE.INSERT_ROW,
        table_id: table._id,
        row_id: anchor_row_id,
        row_data: _dtableStore.RowUtils.convertRowBack(row, table),
        // Convert view data to operation data
        row_insert_position: row_insert_position
      };

      var _this$execHttpOperati = this.execHttpOperation(username, appName, dtableUuid, dtable, operation),
          isValid = _this$execHttpOperati.isValid,
          error_message = _this$execHttpOperati.error_message;

      callback && callback(isValid, error_message);
    }
  }, {
    key: "modifyTableRow",
    value: function modifyTableRow(username, appName, dtableUuid, dtable, options, callback) {
      var table_name = options.table_name,
          row_id = options.row_id,
          row = options.row; // resource check

      var table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, table_name);

      if (!table) {
        var _error_message2 = {
          error_type: 'table_not_exist',
          error_message: "table ".concat(table_name, " not found")
        };
        callback && callback(false, _error_message2);
        return;
      } // Encapsulation init operation


      var operation = {
        op_type: _dtableStore.OPERATION_TYPE.MODIFY_ROW,
        table_id: table._id,
        row_id: row_id,
        updated: _dtableStore.RowUtils.convertRowBack(row, table) // Convert view data to operation data

      };

      var _this$execHttpOperati2 = this.execHttpOperation(username, appName, dtableUuid, dtable, operation),
          isValid = _this$execHttpOperati2.isValid,
          error_message = _this$execHttpOperati2.error_message;

      callback && callback(isValid, error_message);
    }
  }, {
    key: "deleteTableRow",
    value: function deleteTableRow(username, appName, dtableUuid, dtable, options, callback) {
      var table_name = options.table_name,
          row_id = options.row_id; // resource check

      var table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, table_name);

      if (!table) {
        var _error_message3 = {
          error_type: 'table_not_exist',
          error_message: "table ".concat(table_name, " not found")
        };
        callback && callback(false, _error_message3);
        return;
      } // Encapsulation init operation


      var operation = {
        op_type: _dtableStore.OPERATION_TYPE.DELETE_ROW,
        table_id: table._id,
        row_id: row_id
      };

      var _this$execHttpOperati3 = this.execHttpOperation(username, appName, dtableUuid, dtable, operation),
          isValid = _this$execHttpOperati3.isValid,
          error_message = _this$execHttpOperati3.error_message;

      callback && callback(isValid, error_message);
    }
  }, {
    key: "addLinkToTableRow",
    value: function addLinkToTableRow(username, appName, dtableUuid, dtable, linkParams, callback) {
      var table_name = linkParams.table_name,
          other_table_name = linkParams.other_table_name,
          table_row_id = linkParams.table_row_id,
          other_table_row_id = linkParams.other_table_row_id; // resource check

      var table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, table_name);

      var otherTable = _dtableStore.TableUtils.getTableByName(dtable.value.tables, other_table_name);

      if (!table || !otherTable) {
        var _error_message4 = {
          error_type: 'table_not_exist',
          error_message: "table ".concat(table_name, " or ").concat(other_table_name, " not found")
        };
        callback && callback(false, _error_message4);
        return;
      }

      var operation = _dtableStore.LinksUtils.transLinkOptions(table._id, otherTable._id, table_row_id, other_table_row_id);

      operation = Object.assign({}, operation, {
        op_type: _dtableStore.OPERATION_TYPE.ADD_LINK
      });

      var _this$execHttpOperati4 = this.execHttpOperation(username, appName, dtableUuid, dtable, operation),
          isValid = _this$execHttpOperati4.isValid,
          error_message = _this$execHttpOperati4.error_message;

      callback && callback(isValid, error_message);
    }
  }, {
    key: "deleteTableById",
    value: function deleteTableById(dtable, tableId) {
      _dtableStore.TableUtils.deleteTable(dtable.value.tables, tableId);
    }
  }, {
    key: "deleteLinkFromTableRow",
    value: function deleteLinkFromTableRow(username, appName, dtableUuid, dtable, linkParams, callback) {
      var table_name = linkParams.table_name,
          other_table_name = linkParams.other_table_name,
          table_row_id = linkParams.table_row_id,
          other_table_row_id = linkParams.other_table_row_id; // resource check

      var table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, table_name);

      var otherTable = _dtableStore.TableUtils.getTableByName(dtable.value.tables, other_table_name);

      if (!table || !otherTable) {
        var _error_message5 = {
          error_type: 'table_not_exist',
          error_message: "table ".concat(table_name, " or ").concat(other_table_name, " not found")
        };
        callback && callback(false, _error_message5);
        return;
      }

      var operation = _dtableStore.LinksUtils.transLinkOptions(table._id, otherTable._id, table_row_id, other_table_row_id);

      operation = Object.assign({}, operation, {
        op_type: _dtableStore.OPERATION_TYPE.REMOVE_LINK
      });

      var _this$execHttpOperati5 = this.execHttpOperation(username, appName, dtableUuid, dtable, operation),
          isValid = _this$execHttpOperati5.isValid,
          error_message = _this$execHttpOperati5.error_message;

      callback && callback(isValid, error_message);
    }
  }, {
    key: "getRowActivities",
    value: function getRowActivities(dtableUuid, rowId, limit, offset, callback) {
      var sql = "SELECT id, dtable_uuid, row_id, op_user, op_type, op_time, detail FROM activities\n               WHERE dtable_uuid=? and row_id=? ORDER BY op_time DESC LIMIT ? OFFSET ?";
      (0, _dbHelper["default"])(sql, function (err, activities) {
        if (err) {
          callback && callback(err, null);
          return;
        }

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = activities[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var activity = _step3.value;
            activity.detail = JSON.parse(activity.detail);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
              _iterator3["return"]();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        var count_sql = "SELECT count(1) AS count FROM activities WHERE dtable_uuid=? and row_id=?";
        (0, _dbHelper["default"])(count_sql, function (err, results) {
          if (err) {
            callback && callback(err, null);
            return;
          }

          callback && callback(err, activities, results[0].count);
        }, [dtableUuid, rowId]);
      }, [dtableUuid, rowId, limit, offset]);
    }
  }, {
    key: "insertTableWithRawColumnsAndRows",
    value: function insertTableWithRawColumnsAndRows(dtable, dtable_uuid, table_name, raw_columns, raw_rows, lang, username) {
      var table_id = (0, _dtableStore.generatorTableId)(dtable.value.tables);
      var params = {
        table_id: table_id,
        table_name: table_name,
        lang: lang
      };
      var table_data = new _dtableStore.GridTable(params); // columns

      var columns = [];
      raw_columns.forEach(function (col, index) {
        var new_column_key = index === 0 ? '0000' : (0, _dtableStore.generatorColumnKey)(columns);
        var new_column = new _dtableStore.GridColumn({
          column_key: new_column_key,
          column_type: _dtableStore.CellType.TEXT,
          column_name: col
        });
        columns.push(new_column);
      });
      table_data.columns = columns; // rows

      var rows = [];
      raw_rows.forEach(function (row) {
        var new_row = new _dtableStore.GridRow();
        var creator = username;
        var last_modifier = username;
        var createTime = (0, _moment["default"])().utc().toISOString(true);
        var modifyTime = createTime;
        var row_data = {};
        columns.forEach(function (col, index) {
          row_data[col.key] = row[index];
        });
        new_row = Object.assign({}, new_row, row_data, {
          _creator: creator,
          _last_modifier: last_modifier,
          _ctime: createTime,
          _mtime: modifyTime
        });
        rows.push(new_row);
        table_data.id_row_map[new_row._id] = new_row;
      });
      table_data.rows = rows; // operation

      var operation = {
        op_type: _dtableStore.OPERATION_TYPE.INSERT_TABLE,
        table_data: table_data
      };
      this.execHttpOperation(username, null, dtable_uuid, dtable, operation);
    }
  }]);
  return DTableManager;
}();

var _default = DTableManager;
exports["default"] = _default;