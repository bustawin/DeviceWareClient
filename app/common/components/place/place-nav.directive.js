function placeNavDirective (ResourceSettings, $rootScope, Notification) {
  return {
    templateUrl: window.COMPONENTS + '/place/place-nav.directive.html',
    restrict: 'E',
    scope: {},
    link: function ($scope) {
      var getPlaces = function () {
        ResourceSettings('Place').server.getList().then(function (data) { // Let's get the places
          $scope.places = data
          $scope.selected_id = null
          $rootScope.$broadcast('get@placeNav', data)
        })
      }
      getPlaces()
      $scope.broadcastSelectedPlace = function (placeId) {
        if ($scope.isSelected(placeId)) {
          $rootScope.$broadcast('unselectedPlace@placeNavWidget')
          $scope.selected_id = null
        } else {
          $rootScope.$broadcast('selectedPlace@placeNavWidget', placeId)
          $scope.selected_id = placeId
        }
      }
      $scope.$on('submitted@Place', getPlaces)
      $scope.$on('refresh@deviceHub', getPlaces)
      $scope.$on('selectedDevices@deviceList', function (event, devices) {
        $scope.devices = devices
      })

      $scope.moveDevices = function (place, newDevices) {
        if (_.find(newDevices, function (device) {
          return ResourceSettings(device['@type'])
            .isSubResource('Component')
        })) {
          Notification.error('You cannot move components; deselect them.')
          return
        }
        var ids = _.union(_.clone(place.devices) || [], _.map(newDevices, '_id'))
        if (_.isEqual(place.devices, ids)) {
          Notification.warning('All the devices are already in the place, so we are not moving them.')
          return
        }
        var dataToSend = {
          '@type': 'Place',
          'devices': ids,
          '_id': place._id
        }
        place.patch(dataToSend).then(function () {
          $rootScope.$broadcast('refresh@deviceList')
          place.devices = ids // We update the local copy of place with the new devices
          Notification.success('Devices moved to place ' + place.label + '.')
        }, function (data) {
          console.log(data)
          Notification.error('We could not move the computers.')
        })
      }
      $scope.isSelected = function (placeId) {
        return placeId === $scope.selected_id
      }
    }
  }
}

module.exports = placeNavDirective
