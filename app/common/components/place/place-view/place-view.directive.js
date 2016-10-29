function placeView (RecursionHelper, cerberusToView) {
  // if needed, this can be splitted into view (which gets the device) and theme (which just outputs the html given a device)
  return {
    templateUrl: window.COMPONENTS + '/place/place-view/place-view.directive.html',
    restrict: 'E',
    scope: {
      place: '=',
      teaser: '='
    },
    compile: function (element) {
      return RecursionHelper.compile(element, function ($scope, iElement, iAttrs, controller, transcludeFn) {
        $scope.$watchCollection('place', function () {
          $scope.model = cerberusToView.parse($scope.place)
        })
      })
    }
  }
}

module.exports = placeView
