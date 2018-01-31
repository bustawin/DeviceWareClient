require('angular-ui-router')
require('restangular')

/**
 * @ngdoc module
 * @name common.components.authentication
 * @description
 * Authentication and session handling.
 *
 * Handles authenticating the user through the `session` service,
 * for example reading the account from the browser storage and
 * DeviceHub or managing the actual active database; and
 * protects views that require user authorization through
 * `auth-service` factory and `shield-states` run.
 */
module.exports = angular.module('common.components.authentication',
  [
    'restangular',
    'ui.router'
  ])
.service('session', require('./session.service.js'))
.factory('authService', require('./auth-service.factory.js'))
.run(require('./shield-states.run.js'))
.constant('AUTH_EVENTS', require('./AUTH_EVENTS.js'))
.constant('USER_ROLES', require('./USER_ROLES.js'))
.constant('MANAGERS', require('./MANAGERS.js'))
.factory('Role', require('./role.factory.js'))
