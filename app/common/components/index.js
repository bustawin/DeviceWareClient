'use strict';

module.exports = angular.module('common.components',
    [
        require('./account').name,
        require('./authentication').name,
        require('./device').name,
        require('./device-list').name,
        require('./event').name,
        require('./events-per-device').name,
        require('./device-label').name,
        require('./nav').name,
        require('./place').name,
        require('./show-validation.js').name,
        require('./authentication').name,
        require('./tools').name,
        require('./forms').name,
        require('./geo').name
    ]);