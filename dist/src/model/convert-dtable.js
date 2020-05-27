"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertDTableToVersion4 = exports.convertDTableToVersion3 = exports.convertDTableToVersion2 = exports.convertDTableToVersion1 = exports.normalizeDTableVersion1 = void 0;

var _dtableStore = require("dtable-store");

function setIdRowMap(table) {
  var idRowMap = {};
  table.rows.map(function (r) {
    if (!idRowMap[r._id]) {
      idRowMap[r._id] = r;
    }
  });
  return idRowMap;
}

function normalizeTable(table, tables) {
  table['id_row_map'] = setIdRowMap(table);

  if (!Array.isArray(table.columns)) {
    table.columns = [];
  } else {
    table.columns = table.columns.filter(function (column) {
      return column;
    });
  }

  if (!Array.isArray(table.rows)) {
    table.rows = [];
  } else {
    table.rows = table.rows.filter(function (row) {
      return row;
    });
  }

  if (!Array.isArray(table.views)) {
    table.views = []; // need optimized
  } else {
    table.views = table.views.map(function (view) {
      view.rows = [];
      view.formula_rows = {};
      view.groups = [];
      view.filter_conjunction = view.filter_conjunction ? view.filter_conjunction : 'And';

      if (!Array.isArray(view.hidden_columns)) {
        view.hidden_columns = [];
      } else {
        view.hidden_columns = view.hidden_columns.filter(function (column_key) {
          return table.columns.find(function (column) {
            return column.key === column_key;
          });
        });
      }

      if (!Array.isArray(view.sorts)) {
        view.sorts = [];
      } else {
        view.sorts = view.sorts.filter(function (sort) {
          if (sort && sort.column_key) {
            return table.columns.find(function (column) {
              return column.key === sort.column_key;
            });
          }

          return false;
        });
      }

      if (!Array.isArray(view.filters)) {
        view.filters = [];
      } else {
        view.filters = view.filters.filter(function (filter) {
          if (filter && filter.column_key) {
            return table.columns.find(function (column) {
              return column.key === filter.column_key;
            });
          }

          return false;
        });
      }

      if (!Array.isArray(view.groupbys)) {
        view.groupbys = [];
      } else {
        view.groupbys = view.groupbys.filter(function (groupby) {
          if (groupby && groupby.column_key) {
            return table.columns.find(function (column) {
              return column.key === groupby.column_key;
            });
          }

          return false;
        });
      }

      return view;
    });
  }
}

var normalizeDTableVersion1 = function normalizeDTableVersion1(dtable) {
  if (!dtable['version']) {
    dtable['version'] = 1;
  }

  if (!dtable['statistics']) {
    dtable['statistics'] = [];
  }

  if (dtable['statistics'].length !== 0) {
    dtable['statistics'] = dtable['statistics'].filter(function (stat) {
      return !!stat;
    });
  }

  if (!dtable['links']) {
    dtable['links'] = [];
  }

  var tables = dtable.tables;
  tables.forEach(function (table) {
    normalizeTable(table, tables);
  });
};

exports.normalizeDTableVersion1 = normalizeDTableVersion1;

var convertDTableToVersion1 = function convertDTableToVersion1(dtable) {
  // update format_version
  dtable.format_version = 1; // delete forms

  if (dtable['forms']) {
    delete dtable.forms;
  } // delete storage_version


  if (dtable.storage_version) {
    delete dtable.storage_version;
  } // optimized sort data struct


  dtable.tables.forEach(function (table) {
    if (table.Id2Row) {
      delete table.Id2Row;
    }

    table.views = table.views.map(function (view) {
      if (!Array.isArray(view.sorts)) {
        view.sorts = [];
      } else {
        view.sorts = view.sorts.map(function (sort) {
          if (sort && sort.columnKey) {
            return {
              column_key: sort.columnKey,
              sort_type: sort.sortType
            };
          }

          return sort;
        });
      }

      return view;
    });
  });
};

exports.convertDTableToVersion1 = convertDTableToVersion1;

var convertDTableToVersion2 = function convertDTableToVersion2(dtable) {
  // update format_version
  dtable.format_version = 2;
  dtable.tables.forEach(function (table) {
    // change _tid to id
    table._id = table._tid ? table._tid : (0, _dtableStore.generatorTableId)(dtable.tables);
    delete table._tid; // change title to name

    table.name = table.title;
    delete table.title; // change view _vid to _id

    table.views = table.views.map(function (view) {
      view._id = view._vid;
      delete view._vid;
      return view;
    });
    return table;
  });
};

exports.convertDTableToVersion2 = convertDTableToVersion2;

var convertDTableToVersion3 = function convertDTableToVersion3(dtable) {
  // update format_version
  dtable.format_version = 3;
  dtable.tables.forEach(function (table) {
    // update columns
    table.columns = table.columns.map(function (column) {
      if (column.type === 'single-select' || column.type === 'multiple-select') {
        if (column.data && column.data.options) {
          column.data.options = column.data.options.map(function (option) {
            return {
              id: option.ID,
              name: option.name,
              color: option.color
            };
          });
        }
      }

      return column;
    });
    return table;
  });
};

exports.convertDTableToVersion3 = convertDTableToVersion3;

var convertDTableToVersion4 = function convertDTableToVersion4(dtable) {
  // update format_version
  dtable.format_version = 4;
  dtable.tables.forEach(function (table) {
    // repair view id bug
    table.views = table.views.map(function (view) {
      view._id = view._id ? view._id : (0, _dtableStore.generatorViewId)(table.views);
      return view;
    });
  });
};

exports.convertDTableToVersion4 = convertDTableToVersion4;