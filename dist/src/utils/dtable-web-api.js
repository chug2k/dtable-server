"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _config = require("../config/config");

var _axios = _interopRequireDefault(require("axios"));

var _utils = require("./utils");

var DTableWebAPI =
/*#__PURE__*/
function () {
  function DTableWebAPI() {
    (0, _classCallCheck2["default"])(this, DTableWebAPI);
    this.req = _axios["default"].create();
    this.dtableWebServiceURL = _config.DTABLE_WEB_SERVICE_URL;
  }

  (0, _createClass2["default"])(DTableWebAPI, [{
    key: "getDownloadTableURL",
    value: function getDownloadTableURL(dtable_uuid) {
      var url = this.dtableWebServiceURL + 'api/v2.1/dtable-internal/get-file-download-link/';
      var params = {
        dtable_uuid: dtable_uuid
      };
      var token = (0, _utils.genJWT)(dtable_uuid);
      return this.req.get(url, {
        headers: {
          'Authorization': 'Token ' + token
        },
        params: params
      });
    }
  }, {
    key: "getUpdateTableURL",
    value: function getUpdateTableURL(dtable_uuid) {
      var url = this.dtableWebServiceURL + 'api/v2.1/dtable-internal/get-file-update-link/';
      var params = {
        dtable_uuid: dtable_uuid
      };
      var token = (0, _utils.genJWT)(dtable_uuid);
      return this.req.get(url, {
        headers: {
          'Authorization': 'Token ' + token
        },
        params: params
      });
    }
  }, {
    key: "getTableLatestCommitId",
    value: function getTableLatestCommitId(dtable_uuid) {
      var url = this.dtableWebServiceURL + 'api/v2.1/dtable-internal/get-latest-commit-id/';
      var params = {
        dtable_uuid: dtable_uuid
      };
      var token = (0, _utils.genJWT)(dtable_uuid);
      return this.req.get(url, {
        headers: {
          'Authorization': 'Token ' + token
        },
        params: params
      });
    }
  }, {
    key: "getTableRelatedUsers",
    value: function getTableRelatedUsers(dtable_uuid) {
      var url = this.dtableWebServiceURL + 'api/v2.1/dtable-internal/get-related-users/';
      var params = {
        dtable_uuid: dtable_uuid
      };
      var token = (0, _utils.genJWT)(dtable_uuid);
      return this.req.get(url, {
        headers: {
          'Authorization': 'Token ' + token
        },
        params: params
      });
    }
  }]);
  return DTableWebAPI;
}();

var dTableWebAPI = new DTableWebAPI();
var _default = dTableWebAPI;
exports["default"] = _default;