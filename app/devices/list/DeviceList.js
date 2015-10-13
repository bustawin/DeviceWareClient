/**
 * Created by busta on 6/8/2015.
 */
angular.module('DeviceList', ['Config', 'angular-advanced-searchbox','ui.router', 'checklist-model','ngAnimate','ui.bootstrap'])
    .constant('deviceListWidgetConfig',{
        defaultSearchParams : [
            { key: "_id", name: "id", placeholder: "id..." },
            { key: "hid", name: "hid", placeholder: "Hid..." },
            { key: "@type", name: "Type", placeholder: "City..." },
            { key: "max_results", name: "Max Results", placeholder: "N� of results..." }
        ]
    })
/**
 * @todo let the directive optionally change the state when user writes at search input. Do when restangular hits version 1.0 and
 * dynamic params do this easier.
 */
    .directive('deviceListWidget', ['$state','$stateParams','deviceListWidgetConfig','Restangular','$rootScope','$location','$modal',
        function($state,$stateParams,deviceListWidgetConfig,Restangular,$rootScope,$location,$modal){
            /**
             * Gets a new list of devices from the server and updates scope.
             */
            var getDevices = function(params, $scope){
                Restangular.all('devices').getList(params).then(function(devices){
                    $scope.devices = devices;
                });
            };
            var deviceSelected = function(device){
                $rootScope.$broadcast('deviceSelected@deviceListWidget',device);
            };
           return {
               templateUrl: 'app/devices/list/list.html',
               restrict: 'AE',
               scope: {
                   params: '='
               },
               link: function($scope, $element, $attrs){
                   $scope.selectedDevices = [];
                   $scope.availableSearchParams = deviceListWidgetConfig.defaultSearchParams;
                   /*$scope.$watchCollection(function(){return $scope.params;},function(newValue, oldValue){
                       getDevices({where: newValue},$scope);    //Whenever the state params change, we get new values (triggers at the beginning too)
                   });*/
                   $scope.$watchCollection(function(){return $scope.searchParams;},function(newValue, oldValue){
                       if(newValue != undefined) getDevices({where: newValue},$scope);
                   });

                   $scope.$on('refresh@deviceListWidget', function(){
                       getDevices($scope.searchParams, $scope);
                   });


                   $scope.deviceSelected = deviceSelected;

                   $scope.$watchCollection(function(){return $scope.selectedDevices}, function(newValues, oldValues){
                       $('device-list-widget input:checked').parents('tr').addClass('info');
                       $('device-list-widget input:not(checked)').parents('tr').removeClass('info');
                   });

                   $scope.openModal = function(type){
                       var modalInstance = $modal.open({
                           animation: true,
                           templateUrl: 'app/devices/list/modal.html',
                           controller: 'DevicesListModalCtrl',
                           size: 'lg',
                           keyboard: true,
                           windowClass: 'modal-xl',
                           backdrop : 'static',
                           resolve: {
                               devices: function(){return $scope.selectedDevices},
                               type: function(){return type}
                           }
                       });
                       modalInstance.result.then(function (selectedItem) {
                           $scope.selected = selectedItem;
                       }, function () {
                          // $log.info('Modal dismissed at: ' + new Date());
                       });
                   };
               }
       };
    }])
    .controller('DevicesListModalCtrl', ['$scope','$modalInstance','devices','type', function($scope,$modalInstance,devices,type){
        $scope.devices = devices;
        $scope.type = type;
        $scope.title = type;
        $scope.ok = function () {
            $modalInstance.close($scope.selected.item);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }])
    ;
/*
.controller('DeviceListCtrl', ['Restangular', function(Restangular){
    var self = this;
    var baseDevices = Restangular.all('devices');
    baseDevices.getList().then(function(devices){
        self.devices = devices;
    });
}]);
*/