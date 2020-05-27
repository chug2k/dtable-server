"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SUCCESS_MESSAGE = exports.SUCCESS_TYPE = exports.ERROR_MESSAGE = exports.ERROR_TYPE = void 0;
var ERROR_TYPE = {
  OPERATION_INVALID: 'operation_invalid',
  PERMISSION_DENIED: 'permission_denied',
  INTERNAL_ERROR: 'internal_error',
  TOKEN_EXPIRED: 'token_expired',
  DTABLE_NOT_FOUND: 'dtable_not_found',
  DTABLE_LOAD_FAILED: 'dtable_load_failed'
};
exports.ERROR_TYPE = ERROR_TYPE;
var ERROR_MESSAGE = {
  'operation_invalid': 'Operation invalid',
  'permission_denied': 'Permission denied',
  'internal_error': 'Internal error',
  'token_expired': 'Token expired',
  'dtable_not_found': 'Dtable not found',
  'dtable_load_failed': 'Dtable load failed'
};
exports.ERROR_MESSAGE = ERROR_MESSAGE;
var SUCCESS_TYPE = {
  JOINED_SUCCESSFULLY: 'joined_successfully',
  UPDATE_COMPLETED: 'update_completed'
};
exports.SUCCESS_TYPE = SUCCESS_TYPE;
var SUCCESS_MESSAGE = {
  'joined_successfully': 'Joined successfully',
  'update_completed': 'Update completed'
};
exports.SUCCESS_MESSAGE = SUCCESS_MESSAGE;