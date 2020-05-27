"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _fs = _interopRequireDefault(require("fs"));

var _http = _interopRequireDefault(require("http"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _express = _interopRequireDefault(require("express"));

var _csv = _interopRequireDefault(require("csv"));

var _iconvLite = _interopRequireDefault(require("iconv-lite"));

var _detectCharacterEncoding = _interopRequireDefault(require("detect-character-encoding"));

var _dtableStore = require("dtable-store");

var _auth = require("./utils/auth");

var _dtableUtils = _interopRequireDefault(require("./utils/dtable-utils"));

var _callbackMessage = require("./utils/callback-message");

var _logger = _interopRequireDefault(require("./logger"));

var _notificationManager = require("./manager/notification-manager");

var _utils = require("./utils/utils");

var HttpService =
/*#__PURE__*/
function () {
  function HttpService(dtableServer) {
    (0, _classCallCheck2["default"])(this, HttpService);
    this.dtableServer = dtableServer;
    this.app = (0, _express["default"])();
    this.server = _http["default"].Server(this.app);
    this.init();
  }

  (0, _createClass2["default"])(HttpService, [{
    key: "init",
    value: function init() {
      var _this = this;

      var appContext = this.dtableServer;
      var app = this.app;
      app.use(_bodyParser["default"].urlencoded({
        extended: false
      }));
      app.use(_bodyParser["default"].json()); // Access-Control-Allow-Origin

      app.all("*", function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
        res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");

        if (req.method.toLowerCase() == 'options') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
      app.get('/ping/', function (req, res) {
        res.send("pong");
        return;
      });
      app.get('/dtables/:dtable_uuid', function (req, res) {
        // permission check
        var lang = req.query.lang;
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var resp = dtable.serializeTablesData();
          res.send(resp);
          return;
        }, lang);
      });
      app.get('/api/v1/dtables/:dtable_uuid/metadata/', function (req, res) {
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var metadata = {};
          var tables = [];
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = dtable.value.tables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var data = _step.value;
              var table = {
                _id: data._id,
                name: data.name,
                is_header_locked: data.is_header_locked,
                columns: data.columns,
                views: data.views
              };
              tables.push(table);
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

          metadata['tables'] = tables;
          var resp = {
            'metadata': metadata
          };
          res.send(resp);
          return;
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/rows/', function (req, res) {
        // list view's rows by dtable_uuid, table_name and view_name
        // if no view_name is given, return rows of 'Default View'
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          } // get rows by table_id and view_id, if table_id and view_id is provided


          var _req$query = req.query,
              tableName = _req$query.table_name,
              viewName = _req$query.view_name,
              tableId = _req$query.table_id,
              viewId = _req$query.view_id,
              grouping = _req$query.grouping;
          var table, view; // params check

          if (grouping && grouping != 'true' && grouping != 'false' && grouping != '') {
            res.status(400).send({
              "error_msg": "grouping invalid"
            });
            return;
          }

          if (!tableId && !tableName) {
            res.status(400).send({
              "error_msg": "params invalid"
            });
            return;
          }

          if (tableId) {
            table = _dtableStore.TableUtils.getTableById(dtable.value.tables, tableId);
          } else {
            table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, tableName);
          }

          if (!table) {
            res.status(404).send({
              "error_msg": "table not found"
            });
            return;
          } // if no view if specified, return rows of first view in views array, 
          // which is initialized as default view


          if (!viewId && !viewName) {
            view = table.views[0];
          }

          if (viewId) {
            view = _dtableStore.Views.getViewById(table.views, viewId);
          }

          if (viewName) {
            view = _dtableStore.Views.getViewByName(table.views, viewName);
          }

          if (!view) {
            res.status(404).send({
              "error_msg": "view not found"
            });
            return;
          }

          if (grouping === 'true') {
            if (!_dtableStore.Views.isGroupView(view)) {
              // require grouped rows, but view itself is not grouped, return err
              res.status(400).send({
                "error_msg": "table not support group"
              });
              return;
            }

            res.send({
              'groups': dtableManager.listTableViewGroupedRows(dtable, table, view)
            });
            return;
          } else {
            res.send({
              'rows': dtableManager.listTableViewRows(dtable, table, view)
            });
            return;
          }
        });
      });
      app.post('/api/v1/dtables/:dtable_uuid/rows/', function (req, res) {
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var operations = req.body;
            dtableManager.insertRowToTable(username, app_name, dtable_uuid, dtable, operations, function (isValid, error_message) {
              if (!isValid) {
                res.status(400).send(error_message);
                return;
              }

              res.send({
                "success": true
              });
              return;
            });
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app.put('/api/v1/dtables/:dtable_uuid/rows/', function (req, res) {
        // update a row
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var operations = req.body;
            dtableManager.modifyTableRow(username, app_name, dtable_uuid, dtable, operations, function (isValid, error_message) {
              if (!isValid) {
                res.status(400).send(error_message);
                return;
              }

              res.send({
                "success": true
              });
              return;
            });
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app["delete"]('/api/v1/dtables/:dtable_uuid/rows/', function (req, res) {
        // delete a row
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var operations = req.body;
            dtableManager.deleteTableRow(username, app_name, dtable_uuid, dtable, operations, function (isValid, error_message) {
              if (!isValid) {
                res.status(400).send(error_message);
                return;
              }

              res.send({
                "success": true
              });
              return;
            });
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app.post('/api/v1/dtables/:dtable_uuid/links/', function (req, res) {
        // update row's links
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var linkParams = req.body;
            dtableManager.addLinkToTableRow(username, app_name, dtable_uuid, dtable, linkParams, function (isValid, error_message) {
              if (!isValid) {
                res.status(400).send(error_message);
                return;
              }

              res.send({
                "success": true
              });
              return;
            });
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app["delete"]('/api/v1/dtables/:dtable_uuid/links/', function (req, res) {
        // delete row's links
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var linkParams = req.body;
            dtableManager.deleteLinkFromTableRow(username, app_name, dtable_uuid, dtable, linkParams, function (isValid, error_message) {
              if (!isValid) {
                res.status(400).send(error_message);
                return;
              }

              res.send({
                "success": true
              });
              return;
            });
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/filtered-rows/', function (req, res) {
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var _req$query2 = req.query,
              tableName = _req$query2.table_name,
              viewName = _req$query2.view_name;
          var _req$body = req.body,
              filters = _req$body.filters,
              filterConjunction = _req$body.filter_conjunction;
          var table, view; // params check

          if (!tableName) {
            res.status(400).send({
              "error_msg": "table_name invalid"
            });
            return;
          }

          table = _dtableStore.TableUtils.getTableByName(dtable.value.tables, tableName);

          if (!table) {
            res.status(404).send({
              "error_msg": "table not found"
            });
            return;
          }

          if (!filters) {
            res.status(404).send({
              "error_msg": "filters required."
            });
            return;
          }

          if (filters.length > 1) {
            // if given more than 1 filters but conjunction is not valid, return err
            if (!filterConjunction || filterConjunction != 'Or' && filterConjunction != 'And') {
              res.status(404).send({
                "error_msg": "filter_conjunction invalid"
              });
              return;
            }
          } else {
            // if only one filter, dtable-store required a default conjunction
            filterConjunction = 'And';
          } // if no view if specified, return rows of first view in views array, 
          // which is initialized as default view


          if (!viewName) {
            view = table.views[0];
          } else {
            view = _dtableStore.Views.getViewByName(table.views, viewName);
          }

          if (!view) {
            res.status(404).send({
              "error_msg": "view not found"
            });
            return;
          }

          filters.map(function (filter) {
            var column = _dtableStore.TableUtils.getTableColumnByName(table, filter.column_name);

            if (!column) {
              res.status(400).send({
                "error_msg": "column ".concat(filter.column_name, " not found")
              });
              return;
            }

            filter.column_key = column.key;
          });
          res.send({
            'rows': dtableManager.listTableViewFilteredRows(dtable, table, view, filters, filterConjunction)
          });
          return;
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/operations', function (req, res) {
        // parameters check
        var _req$query3 = req.query,
            page = _req$query3.page,
            count = _req$query3.count;
        if (!page) page = 1;
        if (!count) count = 25; // permission check

        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get data from the current table.'
          });
          return;
        }

        _dtableUtils["default"].queryDtableOperations(dtable_uuid, (page - 1) * count, count, function (err, results) {
          if (err) {
            _logger["default"].error(err);

            res.sendStatus(500);
            return;
          }

          res.send({
            "operations": results
          });
          return;
        });
      });
      app.post('/api/v1/dtables/:dtable_uuid/operations', function (req, res) {
        // parameters check
        var operation = req.body;

        if (!operation) {
          res.status(400).send({
            "error_msg": 'operation invalid'
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload || payload.permission !== 'rw') {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to update the current table.'
          });
          return;
        }

        var username = payload.username,
            app_name = payload.app_name;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          try {
            var _dtableManager$execHt = dtableManager.execHttpOperation(username, app_name, dtable_uuid, dtable, operation),
                isValid = _dtableManager$execHt.isValid,
                error_message = _dtableManager$execHt.error_message;

            if (!isValid) {
              res.status(400).send(error_message);
              return;
            }

            res.send({
              "success": true
            });
            return;
          } catch (error) {
            _logger["default"].error(error);

            res.sendStatus(500);
            return;
          }
        });
      });
      app["delete"]('/api/v1/dtables/:dtable_uuid/comments/:comment_id/', function (req, res) {
        // params check
        var _req$params = req.params,
            dtable_uuid = _req$params.dtable_uuid,
            comment_id = _req$params.comment_id;

        if (isNaN(comment_id)) {
          res.status(400).send({
            'error_msg': 'comment_id invalid'
          });
          return;
        }

        comment_id = parseInt(comment_id); // permission check

        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            'error_msg': 'You don\'t have permission to delete comment'
          });
          return;
        } // resource check and exec sql


        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var commentManager = appContext.getCommentManager();
          commentManager.getRowComment(comment_id, function (err, comment) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' query such comment: ', comment_id, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            if (!comment) {
              res.status(404).send({
                'error_msg': "comment ".concat(comment_id, " not found")
              });
              return;
            }

            if (comment.dtable_uuid !== dtable_uuid || comment.author !== payload.username) {
              res.status(403).send({
                'error_msg': 'You don\'t have permission to delete comment'
              });
              return;
            }

            commentManager.deleteRowComment(comment_id, function (err) {
              if (err) {
                _logger["default"].error('user: ', payload.username, ' delete comment: ', comment_id, ' error: ', err);

                res.sendStatus(500);
                return;
              }

              res.send({
                'success': true
              });
            });
          });
        });
      });
      app.put('/api/v1/dtables/:dtable_uuid/comments/:comment_id/', function (req, res) {
        // params check
        var _req$params2 = req.params,
            dtable_uuid = _req$params2.dtable_uuid,
            comment_id = _req$params2.comment_id;
        var options = req.body.options;

        if (!options || !options.comment && !options.resolved || options.resolved && options.resolved !== 1 || options.comment && typeof options.comment !== 'string') {
          res.status(400).send({
            'error_msg': 'options invalid'
          });
          return;
        }

        if (isNaN(comment_id)) {
          res.status(400).send({
            'error_msg': 'comment_id invalid'
          });
          return;
        }

        comment_id = parseInt(comment_id); // permission check

        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            'error_msg': 'You don\'t have permission to update the comment'
          });
          return;
        } // resource check and exec sql


        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var commentManager = appContext.getCommentManager();
          commentManager.getRowComment(comment_id, function (err, comment) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' query comment: ', comment_id, ' when PUT comment error: ', err);

              res.sendStatus(500);
              return;
            }

            if (!comment) {
              res.status(404).send({
                "error_msg": "comment ".concat(comment_id, " not found")
              });
              return;
            }

            if (comment.dtable_uuid !== dtable_uuid) {
              res.status(403).send({
                'error_msg': 'You don\'t have permission to update the comment'
              });
              return;
            }

            if (comment.author !== payload.username && options.comment) {
              res.status(403).send({
                'error_msg': 'You don\'t have permission to edit comment'
              });
              return;
            }

            commentManager.updateRowComment(payload.username, comment_id, options, function (err) {
              if (err) {
                _logger["default"].error('user: ', payload.username, ' update comment: ', comment_id, ' with options: ', options, ' error: ', err);

                res.sendStatus(500);
                return;
              }

              res.send({
                'success': true
              });
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/comments/:comment_id/', function (req, res) {
        // params check
        var _req$params3 = req.params,
            dtable_uuid = _req$params3.dtable_uuid,
            comment_id = _req$params3.comment_id;

        if (isNaN(comment_id)) {
          res.status(400).send({
            'error_msg': 'comment_id invalid'
          });
          return;
        }

        comment_id = parseInt(comment_id); // permission check

        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            'error_msg': 'You don\'t have permission to read comment'
          });
          return;
        } // resouce check and query db


        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var commentManager = appContext.getCommentManager();
          commentManager.getRowComment(comment_id, function (err, comment) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' query single comment: ', comment_id, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            if (!comment) {
              res.status(404).send({
                'error_msg': "comment ".concat(comment_id, " not found")
              });
              return;
            }

            if (comment.dtable_uuid !== dtable_uuid) {
              res.status(403).send({
                'error_msg': 'You don\'t have permission to get the comment'
              });
              return;
            }

            res.send(comment);
          });
        });
      });
      app.post('/api/v1/dtables/:dtable_uuid/comments/', function (req, res) {
        // params check
        var _req$query4 = req.query,
            table_id = _req$query4.table_id,
            row_id = _req$query4.row_id;

        if (!table_id || !row_id) {
          res.status(400).send({
            'error_msg': 'table_id or row_id invalid'
          });
          return;
        }

        var comment = req.body.comment;

        if (!comment) {
          res.status(400).send({
            'error_msg': 'comment invalid'
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            'error_msg': 'You don\'t have permission to comment the row'
          });
          return;
        } // resource check and exec sql


        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var commentManager = appContext.getCommentManager();
          commentManager.addRowComment(payload.username, dtable_uuid, row_id, comment, function (err) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' in dtable: ', dtable_uuid, ' row: ', row_id, ' create comment: ', comment, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            var table = _dtableStore.TableUtils.getTableById(dtable.value.tables, table_id);

            var row = _dtableStore.TableUtils.getRowById(table, row_id);

            var to_users = row['_participants'] ? row['_participants'] : [];
            var notificationManager = appContext.getNotificationManager();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              var _loop = function _loop() {
                var to_user = _step2.value;
                if (to_user.email === payload.username) return "continue";
                var detail = {
                  author: payload.username,
                  table_id: table_id,
                  row_id: row_id,
                  comment: comment
                };
                notificationManager.addNotification(to_user.email, dtable_uuid, _notificationManager.MSG_TYPE_ROW_COMMENT, JSON.stringify(detail), function (err, results) {
                  if (err) {
                    _logger["default"].error('add row_comment notification failed:', err);
                  }

                  var userManager = appContext.getUserManager();
                  var socketIdList = userManager.getSocketIdList(dtable_uuid, to_user.email);
                  var webSocketManager = appContext.getWebSocketManager();
                  var notification = {
                    id: results.insertId,
                    username: to_user.email,
                    dtable_uuid: dtable_uuid,
                    created_at: new Date(),
                    msg_type: _notificationManager.MSG_TYPE_ROW_COMMENT,
                    detail: detail
                  };
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    for (var _iterator3 = socketIdList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var socketId = _step3.value;
                      webSocketManager.io.to(socketId).emit('new-notification', JSON.stringify(notification));
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
                });
              };

              for (var _iterator2 = to_users[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _ret = _loop();

                if (_ret === "continue") continue;
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

            res.send({
              'success': true
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/comments/', function (req, res) {
        // params check
        var _req$query5 = req.query,
            page = _req$query5.page,
            per_page = _req$query5.per_page,
            row_id = _req$query5.row_id;

        if (!row_id) {
          res.status(400).send({
            'error_msg': 'row_id invalid'
          });
        }

        page = isNaN(page) ? 1 : parseInt(page);
        page = page > 0 ? page : 1;
        per_page = isNaN(per_page) ? 10 : parseInt(per_page);
        per_page = per_page > 0 ? per_page : 10; // permission check

        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to read comments.'
          });
          return;
        } // exec sql and resp


        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var offset = (page - 1) * per_page;
          var commentManager = appContext.getCommentManager();
          commentManager.listRowComments(dtable_uuid, row_id, per_page, offset, function (err, results) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' query comments in dtable: ', dtable_uuid, ' row: ', row_id, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            res.send(results);
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/comments-count/', function (req, res) {
        // permission check
        var row_id = req.query.row_id;
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s comments.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var count = 0;
          var commentManager = appContext.getCommentManager();
          commentManager.getRowCommentCount(dtable_uuid, row_id, function (err, results) {
            if (err) {
              _logger["default"].error('user: ', payload.username, ' query comments-count in dtable: ', dtable_uuid, ' row: ', row_id, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            count = results[0].count;
            res.send({
              count: count
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/comments-within-days/', function (req, res) {
        var dtable_uuid = req.params.dtable_uuid;
        var days = req.query.days;

        if (days && isNaN(days)) {
          res.status(400).send({
            'error_msg': 'days is invalid.'
          });
          return;
        }

        days = days && parseInt(days) > 0 ? parseInt(days) : 3; // permission check

        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to read comments.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var commentManager = appContext.getCommentManager();
          commentManager.listRowCommentsWithinDays(dtable_uuid, days, function (err, comments) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            res.send({
              comments: comments
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/related-users/', function (req, res) {
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get users.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          dtableManager.getRelatedUsers(dtable_uuid, function (err, users) {
            if (err) {
              _logger["default"].error('get dtable related-users: ', dtable_uuid, ' error: ', err);

              res.sendStatus(500);
              return;
            }

            res.send({
              user_list: users
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/activities/', function (req, res) {
        var dtable_uuid = req.params.dtable_uuid;
        var _req$query6 = req.query,
            page = _req$query6.page,
            per_page = _req$query6.per_page,
            row_id = _req$query6.row_id;

        if (!row_id) {
          res.status(400).send({
            'error_msg': 'row_id is invalid.'
          });
        }

        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get activities.'
          });
          return;
        }

        page = isNaN(page) || parseInt(page) <= 0 ? 1 : parseInt(page);
        per_page = isNaN(per_page) || parseInt(per_page) <= 0 ? 10 : parseInt(per_page);
        var offset = (page - 1) * per_page;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error('get dtable: ', dtable_uuid, ' error: ', err);

            res.sendStatus(500);
            return;
          }

          dtableManager.getRowActivities(dtable_uuid, row_id, per_page, offset, function (err, activities, total_count) {
            if (err) {
              _logger["default"].error('get row: ', row_id, ' activities error: ', err);

              res.sendStatus(500);
              return;
            }

            res.send({
              activities: activities,
              total_count: total_count
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/deleted-rows/', function (req, res) {
        // parameters check
        var _req$query7 = req.query,
            page = _req$query7.page,
            per_page = _req$query7.per_page;
        if (!page) page = 1;
        if (!per_page) per_page = 25;
        page = parseInt(page);
        per_page = parseInt(per_page);

        if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
          res.status(400).send({
            "error_msg": "page or per_page invalid."
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to get deleted rows.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          _dtableUtils["default"].getDtableDeletedRows(dtable_uuid, (page - 1) * per_page, per_page, function (err, results) {
            if (err) {
              _logger["default"].error('get deleted rows error: ', err);

              res.sendStatus(500);
              return;
            }

            var deleted_rows = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = results[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var result = _step4.value;
                result.detail = JSON.parse(result.detail);
                deleted_rows.push(result);
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

            res.send({
              deleted_rows: deleted_rows
            });
          });
        });
      });
      app.get('/api/v1/dtables/:dtable_uuid/notifications/', function (req, res) {
        // parameters check
        var _req$query8 = req.query,
            page = _req$query8.page,
            per_page = _req$query8.per_page;
        if (!page) page = 1;
        if (!per_page) per_page = 25;
        page = parseInt(page);
        per_page = parseInt(per_page);

        if (isNaN(page) || isNaN(per_page) || page < 1 || per_page < 1) {
          res.status(400).send({
            "error_msg": "page or per_page invalid."
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s notifications.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var notificationManager = appContext.getNotificationManager();
          notificationManager.listNotifications(payload.username, dtable_uuid, (page - 1) * per_page, per_page, function (err, results) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            var notification_list = [];
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
              for (var _iterator5 = results[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var result = _step5.value;
                result.detail = JSON.parse(result.detail);
                notification_list.push(result);
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

            res.send({
              notification_list: notification_list
            });
          });
        });
      });
      app.post('/api/v1/dtables/:dtable_uuid/notifications/', function (req, res) {
        // parameters check
        var _req$body2 = req.body,
            to_user = _req$body2.to_user,
            msg_type = _req$body2.msg_type,
            detail = _req$body2.detail;

        if (!to_user || !msg_type || !detail) {
          res.status(400).send({
            "error_msg": "parameters invalid."
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s notifications.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var notificationManager = appContext.getNotificationManager();
          notificationManager.addNotification(to_user, dtable_uuid, msg_type, JSON.stringify(detail), function (err, results) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            var userManager = appContext.getUserManager();
            var socketIdList = userManager.getSocketIdList(dtable_uuid, to_user.email);
            var webSocketManager = appContext.getWebSocketManager();
            var notification = {
              id: results.insertId,
              username: to_user.email,
              dtable_uuid: dtable_uuid,
              created_at: new Date(),
              msg_type: _notificationManager.MSG_TYPE_ROW_COMMENT,
              detail: detail
            };
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
              for (var _iterator6 = socketIdList[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var socketId = _step6.value;
                webSocketManager.io.to(socketId).emit('new-notification', JSON.stringify(notification));
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

            res.send({
              success: true
            });
          });
        });
      });
      app.put('/api/v1/dtables/:dtable_uuid/notifications/', function (req, res) {
        // parameters check
        var seen = req.body.seen;

        if (String(seen) === "true") {
          seen = true;
        } else if (String(seen) === 'false') {
          seen = false;
        } else {
          res.status(400).send({
            "error_msg": "seen invalid."
          });
          return;
        } // permission check


        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s notifications.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var notificationManager = appContext.getNotificationManager();
          notificationManager.updateNotifications(payload.username, dtable_uuid, seen, function (err, results) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            res.send({
              success: true
            });
          });
        });
      });
      app.put('/api/v1/dtables/:dtable_uuid/notifications/:notification_id/', function (req, res) {
        // parameters check
        var _req$params4 = req.params,
            dtable_uuid = _req$params4.dtable_uuid,
            notification_id = _req$params4.notification_id;
        notification_id = parseInt(notification_id);

        if (isNaN(notification_id)) {
          res.status(400).send({
            'error_msg': 'notification_id invalid'
          });
          return;
        }

        var seen = req.body.seen;

        if (String(seen) === "true") {
          seen = true;
        } else if (String(seen) === 'false') {
          seen = false;
        } else {
          res.status(400).send({
            "error_msg": "seen invalid."
          });
          return;
        } // permission check


        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s notifications.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var notificationManager = appContext.getNotificationManager();
          notificationManager.getNotification(payload.username, notification_id, function (err, notification) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            if (!notification) {
              res.status(404).send({
                'error_msg': "notification ".concat(notification_id, " not found.")
              });
              return;
            }

            notificationManager.updateNotification(payload.username, notification_id, seen, function (err, results) {
              if (err) {
                _logger["default"].error(err);

                res.sendStatus(500);
                return;
              }

              res.send({
                success: true
              });
            });
          });
        });
      });
      app["delete"]('/api/v1/dtables/:dtable_uuid/notifications/', function (req, res) {
        // permission check
        var dtable_uuid = req.params.dtable_uuid;
        var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access the table\'s notifications.'
          });
          return;
        }

        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (err, dtable) {
          if (err) {
            _logger["default"].error(err.error_message);

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
              res.status(404).send(err.error_message);
              return;
            }

            if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
              res.status(500).send(err.error_message);
              return;
            }
          }

          var notificationManager = appContext.getNotificationManager();
          notificationManager.deleteNotifications(payload.username, dtable_uuid, function (err, results) {
            if (err) {
              _logger["default"].error(err);

              res.sendStatus(500);
              return;
            }

            res.send({
              success: true
            });
          });
        });
      });
      app.post('/api/v1/:dtable_uuid/import-csv/', _utils.multiMiddleware, function (req, res) {
        try {
          var dtable_uuid = req.params.dtable_uuid;
          var payload = (0, _auth.decodeAuthorization)(req.headers.authorization, dtable_uuid);

          if (!payload || payload.permission !== 'rw') {
            res.status(403).send({
              'error_msg': 'You don\'t have permission to import table'
            });
            return;
          }

          var username = payload.username; // if is_create_base is true, init Table1 should be deleted after import

          var _req$body3 = req.body,
              table_name = _req$body3.table_name,
              lang = _req$body3.lang,
              is_create_base = _req$body3.is_create_base;

          if (!table_name) {
            res.status(400).send({
              'error_msg': 'table_name is invalid.'
            });
            return;
          }

          if (!lang) {
            lang = 'en';
          }

          if (!req.files || !req.files.csv_file || req.files.csv_file instanceof Array) {
            _logger["default"].info("req.files error. \nreq.files: %o", req.files);

            res.status(400).send({
              'error_msg': 'No csv file.'
            });
            return;
          }

          var filePath = req.files.csv_file.path;

          if (!_fs["default"].existsSync(filePath)) {
            _logger["default"].error('can\'t find file: ', filePath, ' but it is uplaoded.');

            res.status(500).send({
              'error_msg': 'Internal Server Error.'
            });
            return;
          } // resource check and insert


          var dtableManager = appContext.getDTableManager();
          dtableManager.getDtable(dtable_uuid, function (err, dtable) {
            if (err) {
              _logger["default"].error(err.error_message);

              if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_NOT_FOUND) {
                res.status(404).send(err.error_message);
                return;
              }

              if (err.error_type === _callbackMessage.ERROR_TYPE.DTABLE_LOAD_FAILED) {
                res.status(500).send(err.error_message);
                return;
              }
            }

            var buffer = _fs["default"].readFileSync(filePath);

            var originalEncoding = (0, _detectCharacterEncoding["default"])(buffer);
            var isOriginEncodingUTF8 = true;

            if (originalEncoding.encoding !== 'UTF-8' && originalEncoding.encoding !== 'utf-8') {
              _logger["default"].info('originalEncoding: %o', originalEncoding);

              isOriginEncodingUTF8 = false;
            } // read file


            var stream = _fs["default"].createReadStream(filePath);

            if (!isOriginEncodingUTF8) {
              stream = stream.pipe(_iconvLite["default"].decodeStream(originalEncoding.encoding)).pipe(_iconvLite["default"].encodeStream('utf-8'));
            }

            stream.pipe(_csv["default"].parse({
              skip_empty_lines: true
            }, function (err, records) {
              if (err) {
                res.status(400).send({
                  'error_msg': 'File error'
                });
                return;
              }

              if (records.length === 0) {
                res.status(400).send({
                  'error_msg': 'File is empty.'
                });
                return;
              }

              var raw_cols = records[0].slice();
              var raw_rows = records.slice(1, 10001); // recored 10,000 rows

              try {
                _this.dtableServer.dtableManager.insertTableWithRawColumnsAndRows(dtable, dtable_uuid, table_name, raw_cols, raw_rows, lang, username);
              } catch (err) {
                _logger["default"].error('insert table error: ', err);

                res.sendStatus(500);
                return;
              }

              for (var file_field in req.files) {
                if (req.files[file_field] instanceof Array) {
                  var _iteratorNormalCompletion7 = true;
                  var _didIteratorError7 = false;
                  var _iteratorError7 = undefined;

                  try {
                    for (var _iterator7 = req.files[file_field][Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                      var file = _step7.value;

                      _logger["default"].info('get file: ', file);

                      if (_fs["default"].existsSync(file.path)) _fs["default"].unlinkSync(file.path);
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
                } else {
                  _logger["default"].info('get file: ', req.files[file_field]);

                  if (_fs["default"].existsSync(req.files[file_field].path)) _fs["default"].unlinkSync(req.files[file_field].path);
                }
              }

              if (is_create_base) {
                _this.dtableServer.dtableManager.deleteTableById(dtable, "0000");
              }

              res.status(200).send({
                success: true
              });
              return;
            }));
          });
        } catch (err) {
          _logger["default"].error(err);

          for (var file_field in req.files) {
            if (req.files[file_field] instanceof Array) {
              var _iteratorNormalCompletion8 = true;
              var _didIteratorError8 = false;
              var _iteratorError8 = undefined;

              try {
                for (var _iterator8 = req.files[file_field][Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                  var file = _step8.value;

                  _logger["default"].info('get file: ', file);

                  if (_fs["default"].existsSync(file.path)) _fs["default"].unlinkSync(file.path);
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
            } else {
              _logger["default"].info('get file: ', req.files[file_field]);

              if (_fs["default"].existsSync(req.files[file_field].path)) _fs["default"].unlinkSync(req.files[file_field].path);
            }
          }

          res.status(400).send({
            'error_msg': 'Internal Server Error.'
          });
        }
      }); // internal APIs

      app.get('/api/v1/internal/:dtable_uuid/connected-apps/', function (req, res) {
        var payload = (0, _auth.decodeAdminAuthorization)(req.headers.authorization);

        if (!payload) {
          res.status(403).send({
            "error_msg": "You don't have permission to access."
          });
          return;
        }

        var dtable_uuid = req.params.dtable_uuid;
        var dtableManager = appContext.getDTableManager();
        dtableManager.getDtable(dtable_uuid, function (error, dtable) {
          if (error) {
            _logger["default"].error(error);

            res.status(500).send({
              "error_msg": "Internal Server Error."
            });
            return;
          }

          var webSocketManager = appContext.getWebSocketManager();
          var connectedApps = webSocketManager.getDTableConnectedApps(dtable_uuid);
          res.send({
            "connected_apps": connectedApps
          });
        });
      }); // internal admin APIs

      app.get('/api/v1/admin/sys-info/', function (req, res) {
        var payload = (0, _auth.decodeAdminAuthorization)(req.headers.authorization);

        if (!payload) {
          res.status(403).send({
            "error_msg": 'You don\'t have permission to access.'
          });
          return;
        }

        var sysManager = appContext.getSysManager();
        sysManager.getSysInfos(function (infos) {
          res.send(infos);
        });
      });
    }
  }]);
  return HttpService;
}();

var _default = HttpService;
exports["default"] = _default;