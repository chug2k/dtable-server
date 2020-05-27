"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _convertDtable = require("./convert-dtable");

var DTable =
/*#__PURE__*/
function () {
  function DTable(dtableString) {
    (0, _classCallCheck2["default"])(this, DTable);
    this.uuid = '';
    this.meta = {
      last_access: '',
      need_save: false,
      last_save_time: ''
    };
    this.value = this.deseralizeDTable(dtableString);
  }

  (0, _createClass2["default"])(DTable, [{
    key: "setValue",
    value: function setValue(value) {
      var last_access = new Date().getTime();
      this.value = value;
      var need_save = true;
      this.setMeta({
        last_access: last_access,
        need_save: need_save
      });
    }
  }, {
    key: "setMeta",
    value: function setMeta(meta) {
      meta = Object.assign({}, this.meta, meta);
      this.meta = meta;
    }
  }, {
    key: "getMeta",
    value: function getMeta() {
      return this.meta;
    }
  }, {
    key: "optimizeStorage",
    value: function optimizeStorage() {
      var value = {};
      value.version = this.value.version;
      value.format_version = this.value.format_version;
      value.statistics = this.value.statistics;
      value.links = this.value.links;
      value.description = this.value.description;
      value.plugin_settings = this.value.plugin_settings;
      value.settings = this.value.settings;
      value.tables = this.value.tables.map(function (table) {
        var newTable = {
          _id: table._id,
          name: table.name,
          rows: table.rows,
          columns: table.columns,
          views: table.views,
          id_row_map: {}
        };
        return newTable;
      });
      return value;
    }
  }, {
    key: "serializeTablesData",
    value: function serializeTablesData() {
      var value = this.optimizeStorage();
      return JSON.stringify(value);
    }
  }, {
    key: "normalizeDTable",
    value: function normalizeDTable(dtable) {
      if (!dtable['format_version']) {
        dtable['format_version'] = 0;
      }

      if (!dtable['tables']) {
        throw new Error('The tables data must be exist.');
      }

      if (dtable['format_version'] === 0) {
        (0, _convertDtable.convertDTableToVersion1)(dtable);
        this.meta.need_save = true;
      }

      if (dtable['format_version'] === 1) {
        (0, _convertDtable.convertDTableToVersion2)(dtable);
        this.meta.need_save = true;
      }

      if (dtable['format_version'] === 2) {
        (0, _convertDtable.convertDTableToVersion3)(dtable);
      }

      if (dtable['format_version'] === 3) {
        (0, _convertDtable.convertDTableToVersion4)(dtable);
      }

      (0, _convertDtable.normalizeDTableVersion1)(dtable);
      return dtable;
    }
  }, {
    key: "deseralizeDTable",
    value: function deseralizeDTable(dtableString) {
      var dtable = JSON.parse(dtableString);
      this.value = this.normalizeDTable(dtable);
      return this.value;
    }
  }]);
  return DTable;
}();

var _default = DTable;
exports["default"] = _default;