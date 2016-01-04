'use strict';

var CONSTANTS = (function() {
    return {
        appName: 'DeviceHub',
        url: 'http://127.0.0.1:5000',
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    };
}());

module.exports = CONSTANTS;