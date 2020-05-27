"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _slugid = _interopRequireDefault(require("slugid"));

var _dtableStore = require("dtable-store");

var _logger = _interopRequireDefault(require("../logger"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var OperationUtils =
/*#__PURE__*/
function () {
  function OperationUtils() {
    (0, _classCallCheck2["default"])(this, OperationUtils);
  }

  (0, _createClass2["default"])(OperationUtils, null, [{
    key: "checkOperation",
    value: function checkOperation(dtable, operation) {
      // check type
      var op_type = operation.op_type;

      var _this$_checkOperation = this._checkOperationType(operation),
          isValid = _this$_checkOperation.isValid,
          error_message = _this$_checkOperation.error_message;

      if (!isValid) {
        return {
          isValid: isValid,
          error_message: error_message
        };
      }

      switch (op_type) {
        case _dtableStore.OPERATION_TYPE.INSERT_ROW:
          {
            var _needParams = ['table_id', 'row_data'];

            var _params = Object.keys(operation);

            var _this$_checkOperation2 = this._checkOperationParams(_needParams, _params);

            isValid = _this$_checkOperation2.isValid;
            error_message = _this$_checkOperation2.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            }

            var _table_id = operation.table_id;
            return this._checkTable(dtable, _table_id);
          }

        case _dtableStore.OPERATION_TYPE.DELETE_ROW:
          {
            var _needParams2 = ['table_id', 'row_id'];

            var _params2 = Object.keys(operation);

            var _this$_checkOperation3 = this._checkOperationParams(_needParams2, _params2);

            isValid = _this$_checkOperation3.isValid;
            error_message = _this$_checkOperation3.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            }

            var _table_id2 = operation.table_id;

            var _this$_checkTable = this._checkTable(dtable, _table_id2);

            isValid = _this$_checkTable.isValid;
            error_message = _this$_checkTable.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            }

            var _row_id = operation.row_id;

            var _this$_checkRow = this._checkRow(dtable, _table_id2, _row_id);

            isValid = _this$_checkRow.isValid;
            error_message = _this$_checkRow.error_message;
            return {
              isValid: isValid,
              error_message: error_message
            };
          }

        case _dtableStore.OPERATION_TYPE.MODIFY_ROW:
          var needParams = ['table_id', 'row_id', 'updated'];
          var params = Object.keys(operation);

          var _this$_checkOperation4 = this._checkOperationParams(needParams, params);

          isValid = _this$_checkOperation4.isValid;
          error_message = _this$_checkOperation4.error_message;

          if (!isValid) {
            return {
              isValid: isValid,
              error_message: error_message
            };
          }

          var table_id = operation.table_id;

          var _this$_checkTable2 = this._checkTable(dtable, table_id);

          isValid = _this$_checkTable2.isValid;
          error_message = _this$_checkTable2.error_message;

          if (!isValid) {
            return {
              isValid: isValid,
              error_message: error_message
            };
          }

          var row_id = operation.row_id;

          var _this$_checkRow2 = this._checkRow(dtable, table_id, row_id);

          isValid = _this$_checkRow2.isValid;
          error_message = _this$_checkRow2.error_message;
          return {
            isValid: isValid,
            error_message: error_message
          };

        case _dtableStore.OPERATION_TYPE.INSERT_TABLE:
          {
            var _needParams3 = ['table_data'];

            var _params3 = Object.keys(operation);

            return this._checkOperationParams(_needParams3, _params3);
          }

        case _dtableStore.OPERATION_TYPE.ADD_LINK:
        case _dtableStore.OPERATION_TYPE.REMOVE_LINK:
          {
            var _needParams4 = ['table1_id', 'table2_id', 'table1_row_id', 'table2_row_id'];

            var _params4 = Object.keys(operation);

            var _this$_checkOperation5 = this._checkOperationParams(_needParams4, _params4);

            isValid = _this$_checkOperation5.isValid;
            error_message = _this$_checkOperation5.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            }

            var table1_id = operation.table1_id,
                table2_id = operation.table2_id; // check table1

            var _this$_checkTable3 = this._checkTable(dtable, table1_id);

            isValid = _this$_checkTable3.isValid;
            error_message = _this$_checkTable3.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            } // check table2


            var _this$_checkTable4 = this._checkTable(dtable, table2_id);

            isValid = _this$_checkTable4.isValid;
            error_message = _this$_checkTable4.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            }

            var table1_row_id = operation.table1_row_id,
                table2_row_id = operation.table2_row_id; // check row1

            var _this$_checkRow3 = this._checkRow(dtable, table1_id, table1_row_id);

            isValid = _this$_checkRow3.isValid;
            error_message = _this$_checkRow3.error_message;

            if (!isValid) {
              return {
                isValid: isValid,
                error_message: error_message
              };
            } // check row2


            var _this$_checkRow4 = this._checkRow(dtable, table2_id, table2_row_id);

            isValid = _this$_checkRow4.isValid;
            error_message = _this$_checkRow4.error_message;
            return {
              isValid: isValid,
              error_message: error_message
            };
          }

        default:
          return {
            isValid: true
          };
      }
    }
  }, {
    key: "encapsulateOperation",
    value: function encapsulateOperation(dtable, operation) {
      var op_type = operation.op_type;

      switch (op_type) {
        case _dtableStore.OPERATION_TYPE.INSERT_ROW:
          {
            var _op_type = operation.op_type,
                table_id = operation.table_id,
                row_id = operation.row_id,
                row_data = operation.row_data,
                row_insert_position = operation.row_insert_position;

            var table = _dtableStore.TableUtils.getTableById(dtable.value.tables, table_id); // Can be empty


            if (!row_id) {
              row_id = table.rows.length > 0 ? table.rows[table.rows.length - 1]._id : null;
            }

            row_data['_id'] = _slugid["default"].nice(); // Can be empty

            row_insert_position = row_insert_position ? row_insert_position : 'insert_below';
            return {
              op_type: _op_type,
              table_id: table_id,
              row_id: row_id,
              row_insert_position: row_insert_position,
              row_data: row_data
            };
          }

        case _dtableStore.OPERATION_TYPE.DELETE_ROW:
          {
            var _op_type2 = operation.op_type,
                _table_id3 = operation.table_id,
                _row_id2 = operation.row_id;

            var _table = _dtableStore.TableUtils.getTableById(dtable.value.tables, _table_id3);

            var row = _dtableStore.TableUtils.getRowById(_table, _row_id2);

            var upper_row_index = _table.rows.findIndex(function (row) {
              row._id === _row_id2;
            }) - 1;
            var upper_row_id = upper_row_index >= 0 ? _table.rows[upper_row_index] : null;
            return {
              op_type: _op_type2,
              table_id: _table_id3,
              row_id: _row_id2,
              deleted_row: row,
              upper_row_id: upper_row_id
            };
          }

        case _dtableStore.OPERATION_TYPE.MODIFY_ROW:
          {
            var _op_type3 = operation.op_type,
                _table_id4 = operation.table_id,
                _row_id3 = operation.row_id,
                updated = operation.updated;

            var _table2 = _dtableStore.TableUtils.getTableById(dtable.value.tables, _table_id4);

            var _row = _dtableStore.TableUtils.getRowById(_table2, _row_id3);

            return {
              op_type: _op_type3,
              table_id: _table_id4,
              row_id: _row_id3,
              updated: updated,
              old_row: _row
            };
          }

        case _dtableStore.OPERATION_TYPE.INSERT_TABLE:
          {
            var _op_type4 = operation.op_type,
                table_data = operation.table_data;
            return {
              op_type: _op_type4,
              table_data: table_data
            };
          }

        case _dtableStore.OPERATION_TYPE.ADD_LINK:
        case _dtableStore.OPERATION_TYPE.REMOVE_LINK:
          return operation;

        default:
          return operation;
      }
    }
  }, {
    key: "_checkOperationType",
    value: function _checkOperationType(operation) {
      var op_type = operation.op_type;
      var op_types = Object.values(_dtableStore.OPERATION_TYPE);

      if (!op_type || op_types.indexOf(op_type) === -1) {
        var error_message = {
          error_type: 'op_type_invalid',
          error_message: 'Operation type does not exist.'
        };
        return {
          isValid: false,
          error_message: error_message
        };
      }

      return {
        isValid: true
      };
    }
  }, {
    key: "_checkOperationParams",
    value: function _checkOperationParams(needParams, params) {
      var isValid = needParams.every(function (param) {
        return params.indexOf(param) > -1;
      });

      if (!isValid) {
        var error_message = {
          error_type: 'parameter_error',
          error_message: 'The parameter must contain' + _objectSpread({}, needParams) + '.'
        };
        return {
          isValid: false,
          error_message: error_message
        };
      }

      return {
        isValid: true
      };
    }
  }, {
    key: "_checkTable",
    value: function _checkTable(dtable, table_id) {
      var updatedTable = _dtableStore.TableUtils.getTableById(dtable.value.tables, table_id);

      if (!updatedTable) {
        var error_message = {
          error_type: 'table_not_exist',
          error_message: 'Table does not exist.'
        };
        return {
          isValid: false,
          error_message: error_message
        };
      }

      return {
        isValid: true
      };
    }
  }, {
    key: "_checkRow",
    value: function _checkRow(dtable, table_id, row_id) {
      var updatedTable = _dtableStore.TableUtils.getTableById(dtable.value.tables, table_id);

      var row = _dtableStore.TableUtils.getRowById(updatedTable, row_id);

      if (!row) {
        var error_message = {
          error_type: 'row_not_exist',
          error_message: 'Row does not exist.'
        };
        return {
          isValid: false,
          error_message: error_message
        };
      }

      return {
        isValid: true
      };
    }
  }]);
  return OperationUtils;
}();

var _default = OperationUtils;
exports["default"] = _default;