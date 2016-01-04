'use strict';

function loginController($scope, $state, authService) {
    $scope.credentials = {
        email: '',
        password: ''
    };
    $scope.saveInBrowser = false;
    $scope.login = function (credentials, saveInBrowser) {
        authService.login(credentials, saveInBrowser).then(function (user) {
            $state.go('index.devices.show');
        }, function () {
            alert("The email or password is incorrect " + String.fromCharCode(0xD83D, 0xDE22));
        });
    };
}

module.exports = loginController;