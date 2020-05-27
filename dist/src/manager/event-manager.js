"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _redis = _interopRequireDefault(require("redis"));

var _dtableStore = require("dtable-store");

var _config = require("../config/config");

var _logger = _interopRequireDefault(require("../logger"));

var EventManager =
/*#__PURE__*/
function () {
  function EventManager() {
    (0, _classCallCheck2["default"])(this, EventManager);
    this.publishTypes = [_dtableStore.OPERATION_TYPE.INSERT_ROW, _dtableStore.OPERATION_TYPE.DELETE_ROW, _dtableStore.OPERATION_TYPE.DELETE_ROWS, _dtableStore.OPERATION_TYPE.MODIFY_ROW, _dtableStore.OPERATION_TYPE.MODIFY_ROWS];
    this.redisConfig = {
      port: _config.REDIS_PORT,
      host: _config.REDIS_HOST
    };
    this.passWord = _config.REDIS_PASSWORD;
    this.eventPublisher = null;
  }

  (0, _createClass2["default"])(EventManager, [{
    key: "start",
    value: function start() {
      this.eventPublisher = _redis["default"].createClient(this.redisConfig);

      if (this.passWord) {
        eventPublisher.auth(this.passWord);
      }

      this.eventPublisher.on("error", function (err) {
        _logger["default"].error(err);
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      this.eventPublisher.quit();
    }
  }, {
    key: "publishEvents",
    value: function publishEvents(dtable_uuid, dtable, operation, username, appName) {
      var _this = this;

      if (this.publishTypes.indexOf(operation.op_type) === -1) {
        return;
      }

      var table_id = operation.table_id;

      var table = _dtableStore.TableUtils.getTableById(dtable.value.tables, table_id);

      var table_name = table.name;

      if (operation.op_type === 'modify_rows') {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          var _loop = function _loop() {
            row_id = _step.value;

            var row = _dtableStore.TableUtils.getRowById(table, row_id);

            var row_data = [];
            var row_name = row['0000'] ? row['0000'] : '';
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = table.columns[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var column = _step2.value;

                if (operation.updated[row_id][column.key] !== undefined) {
                  if (column.key === '0000') {
                    row_name = operation.updated[row_id][column.key];
                  }

                  var value = operation.updated[row_id][column.key];
                  var old_value = operation.old_rows[row_id][column.key] ? operation.old_rows[row_id][column.key] : '';
                  var column_data = column.data ? column.data : {};
                  var cell_data = {
                    column_key: column.key,
                    column_name: column.name,
                    column_type: column.type,
                    column_data: column_data,
                    value: value,
                    old_value: old_value
                  };

                  if (column.type === 'link') {
                    cell_data = _this.getFormattedLinkCellData(dtable, column, cell_data, value, old_value);
                  }

                  row_data.push(cell_data);
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

            if (row_data.length === 0) {
              return {
                v: void 0
              };
            }

            var message = {
              dtable_uuid: dtable_uuid,
              row_id: row_id,
              op_user: username,
              op_type: 'modify_row',
              op_time: Date.now() / 1000,
              table_id: operation.table_id,
              table_name: table_name,
              row_name: row_name,
              row_data: row_data,
              op_app: appName
            };

            _this.eventPublisher.publish('table-events', JSON.stringify(message), function (err, reply) {
              if (err) {
                _logger["default"].error(err);
              }

              if (reply) {
                _logger["default"].debug("Publish an user activity:", JSON.stringify(message));
              }
            });
          };

          for (var _iterator = operation.row_ids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _ret = _loop();

            if ((0, _typeof2["default"])(_ret) === "object") return _ret.v;
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

        return;
      }

      if (operation.op_type === 'delete_rows') {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          var _loop2 = function _loop2() {
            row_id = _step3.value;

            var row = _dtableStore.TableUtils.getRowById(table, row_id);

            var row_data = [];
            row_name = row['0000'] ? row['0000'] : '';
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = table.columns[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var column = _step4.value;
                var value = row[column.key] ? row[column.key] : '';
                var column_data = column.data ? column.data : {};
                var cell_data = {
                  column_key: column.key,
                  column_name: column.name,
                  column_type: column.type,
                  column_data: column_data,
                  value: value
                };

                if (column.type === 'link') {
                  cell_data = _this.getFormattedLinkCellData(dtable, column, cell_data, value);
                }

                row_data.push(cell_data);
              }
            } catch (err) {
              _didIteratorError4 = true;
              _iteratorError4 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                  _iterator4["return"]();
                }
              } finally {
                if (_didIteratorError4) {
                  throw _iteratorError4;
                }
              }
            }

            var message = {
              dtable_uuid: dtable_uuid,
              row_id: row_id,
              op_user: username,
              op_type: 'delete_row',
              op_time: Date.now() / 1000,
              table_id: operation.table_id,
              table_name: table_name,
              row_name: row_name,
              row_data: row_data,
              op_app: appName
            };

            _this.eventPublisher.publish('table-events', JSON.stringify(message), function (err, reply) {
              if (err) {
                _logger["default"].error(err);
              }

              if (reply) {
                _logger["default"].debug("Publish an user activity:", JSON.stringify(message));
              }
            });
          };

          for (var _iterator3 = operation.row_ids[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            _loop2();
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

        return;
      }

      var row_id = operation.row_id;

      if (operation.row_data) {
        row_id = operation.row_data._id;
      }

      var row = _dtableStore.TableUtils.getRowById(table, row_id);

      var row_data = [];
      var row_name = '';

      if (operation.op_type === 'insert_row') {
        row_name = operation.row_data['0000'] ? operation.row_data['0000'] : '';
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = table.columns[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var column = _step5.value;
            var value = operation.row_data[column.key] ? operation.row_data[column.key] : '';
            var column_data = column.data ? column.data : {};
            var cell_data = {
              column_key: column.key,
              column_name: column.name,
              column_type: column.type,
              column_data: column_data,
              value: value
            };

            if (column.type === 'link') {
              cell_data = this.getFormattedLinkCellData(dtable, column, cell_data, value);
            }

            row_data.push(cell_data);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
              _iterator5["return"]();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }

      if (operation.op_type === 'delete_row') {
        row_name = row['0000'] ? row['0000'] : '';
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = table.columns[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _column = _step6.value;

            var _value = row[_column.key] ? row[_column.key] : '';

            var _column_data = _column.data ? _column.data : {};

            var _cell_data = {
              column_key: _column.key,
              column_name: _column.name,
              column_type: _column.type,
              column_data: _column_data,
              value: _value
            };

            if (_column.type === 'link') {
              _cell_data = this.getFormattedLinkCellData(dtable, _column, _cell_data, _value);
            }

            row_data.push(_cell_data);
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
              _iterator6["return"]();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }

      if (operation.op_type === 'modify_row') {
        row_name = row['0000'] ? row['0000'] : '';
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = table.columns[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var _column2 = _step7.value;

            if (operation.updated[_column2.key] !== undefined) {
              if (_column2.key === '0000') {
                row_name = operation.updated[_column2.key];
              }

              var _value2 = operation.updated[_column2.key];
              var old_value = row[_column2.key] ? row[_column2.key] : '';

              var _column_data2 = _column2.data ? _column2.data : {};

              var _cell_data2 = {
                column_key: _column2.key,
                column_name: _column2.name,
                column_type: _column2.type,
                column_data: _column_data2,
                value: _value2,
                old_value: old_value
              };

              if (_column2.type === 'link') {
                _cell_data2 = this.getFormattedLinkCellData(dtable, _column2, _cell_data2, _value2, old_value);
              }

              row_data.push(_cell_data2);
            }
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
              _iterator7["return"]();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        if (row_data.length === 0) {
          return;
        }
      }

      var message = {
        dtable_uuid: dtable_uuid,
        row_id: row_id,
        op_user: username,
        op_type: operation.op_type,
        op_time: Date.now() / 1000,
        table_id: operation.table_id,
        table_name: table_name,
        row_name: row_name,
        row_data: row_data,
        op_app: appName
      };
      this.eventPublisher.publish('table-events', JSON.stringify(message), function (err, reply) {
        if (err) {
          _logger["default"].error(err);
        }

        if (reply) {
          _logger["default"].debug("Publish an user activity:", JSON.stringify(message));
        }
      });
    }
  }, {
    key: "getFormattedLinkCellData",
    value: function getFormattedLinkCellData(dtable, column, cell_data, value) {
      var old_value = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

      var link_table = _dtableStore.TableUtils.getTableById(dtable.value.tables, column.data.other_table_id);

      var new_cell_data = cell_data;
      var link_value = [];
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = value[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _link_row_id = _step8.value;

          var _link_row = _dtableStore.TableUtils.getRowById(link_table, _link_row_id);

          var _link_row_name = _link_row["0000"] ? _link_row["0000"] : '';

          link_value.push((0, _defineProperty2["default"])({}, _link_row_id, _link_row_name));
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
            _iterator8["return"]();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }

      new_cell_data.value = link_value;

      if (old_value !== null) {
        var link_old_value = [];
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = old_value[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var link_row_id = _step9.value;

            var link_row = _dtableStore.TableUtils.getRowById(link_table, link_row_id);

            var link_row_name = link_row["0000"] ? link_row["0000"] : '';
            link_old_value.push((0, _defineProperty2["default"])({}, link_row_id, link_row_name));
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
              _iterator9["return"]();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }

        new_cell_data.old_value = link_old_value;
      }

      return new_cell_data;
    }
  }]);
  return EventManager;
}();

var _default = EventManager;
exports["default"] = _default;