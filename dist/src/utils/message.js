"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _callbackMessage = require("./callback-message");

var Message =
/*#__PURE__*/
function () {
  function Message() {
    (0, _classCallCheck2["default"])(this, Message);
  }

  (0, _createClass2["default"])(Message, null, [{
    key: "success",
    value: function success(type, dtableVersion) {
      var message = {
        status: 1,
        message: _callbackMessage.SUCCESS_MESSAGE[type],
        dtable_version: dtableVersion
      };
      return message;
    }
  }, {
    key: "fail",
    value: function fail(type) {
      var message = {
        status: 0,
        error_type: type,
        message: _callbackMessage.ERROR_MESSAGE[type]
      };
      return message;
    }
  }]);
  return Message;
}();

var _default = Message;
exports["default"] = _default;