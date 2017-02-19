/**
 * Loads and shows a resource
 */
function resource (RecursionHelper, ResourceSettings) {
  return {
    templateUrl: window.COMPONENTS + '/resource/resource/resource.directive.html',
    restrict: 'E',
    scope: {
      resource: '=',
      type: '=' // big / medium / small
    },
    compile: function (element) {
      return RecursionHelper.compile(element, function ($scope, iElement, iAttrs, controller, transcludeFn) {
        $scope.resource = $scope.resource || {}
        let rSettings = ResourceSettings($scope.resource['@type'])
        $scope.isEvent = rSettings.isSubResource('Event')
        getResource()

        function getResource () {
          if (rSettings.authorized) {
            rSettings.server.one($scope.resource._id).get().then(function (resource) {
              _.assign($scope.resource, resource)
            }).catch(function (error) {
              $scope.error = true
              throw error
            })
          } else {
            $scope.error = true
          }
        }
      })
    }
  }
}

module.exports = resource
