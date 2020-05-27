"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _dtableUtils = _interopRequireDefault(require("../utils/dtable-utils"));

var SysManager =
/*#__PURE__*/
function () {
  function SysManager(dtableServer) {
    (0, _classCallCheck2["default"])(this, SysManager);
    this.dtableServer = dtableServer;
  }
  /**
   * get dtable server infos
   * @param operationsInterval: period interval
   * @param callback: callback method
   */


  (0, _createClass2["default"])(SysManager, [{
    key: "getSysInfos",
    value: function getSysInfos(callback) {
      var infos = {};
      var webSocketManager = this.dtableServer.getWebSocketManager();
      infos['web_socket_count'] = webSocketManager.getWebSocketsCount();
      infos['app_connection_count'] = webSocketManager.getAppConnectionCount();
      infos['operation_count_since_up'] = webSocketManager.getOperationCountSinceUp();
      var dtableManager = this.dtableServer.getDTableManager();
      var lastDTableSavingInfo = dtableManager.getLastDTableSavingInfo();
      infos['last_dtable_saving_count'] = lastDTableSavingInfo.count;
      infos['last_dtable_saving_start_time'] = lastDTableSavingInfo.startTime;
      infos['last_dtable_saving_end_time'] = lastDTableSavingInfo.endTime;
      infos['loaded_dtables_count'] = dtableManager.getDTableLoadedCount();

      _dtableUtils["default"].queryOperationCount(60 * 60 * 1000, function (count) {
        infos['last_period_operations_count'] = count;
        callback && callback(infos);
      });
    }
  }]);
  return SysManager;
}();

var _default = SysManager;
exports["default"] = _default;