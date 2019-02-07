/**
 *
 * @param progressBar
 * @param $rootScope
 * @param {module:selection} selection
 * @param {module:resources} resources
 */
function lotsTreeNavigation (progressBar, $rootScope, selection, resources) {
  const PATH = require('./__init__').PATH
  // const PATH = 'common/components/resource/resource-list/lots-tree-navigation'

  /**
   * @ngdoc directive
   * @name lotsTreeNavigation
   * @restrict E
   * @element lots-tree-navigation
   * @param {expression} onSelection
   */

  return {
    template: require('./lots-tree-navigation.directive.html'),
    restrict: 'E',
    scope: {
      onSelection: '&'
    },
    link: {
      pre: $scope => {
        $scope.treeTemplateURL = PATH + '/lots-tree.html'

        /**
         * Finds nodes containing text and makes them visible
         * @param {string} text
         */
        $scope.makeNodesWithTextVisible = text => {
          /** @param {module:resources.LotNode} node */
          function visibleIfHasText (node) {
            let atLeastOneChildVisible = false
            node.nodes.forEach(child => {
              let childIsVisible = visibleIfHasText(child)
              if (childIsVisible) atLeastOneChildVisible = true
            })
            node.isVisible = !text || node.hasText(text) || atLeastOneChildVisible
            return node.isVisible
          }

          $scope.lots.tree.forEach(visibleIfHasText)
        }

        $scope.treeOptions = {
          dropped: $event => {
            // if element was not moved, use click event
            if ($event.source.index === $event.dest.index) {
              $scope.toggleLot($event.source.nodeScope.$modelValue, $event)
              return true
            }

            let lot = _.get($event, 'source.nodeScope.$modelValue')
            let previousParent = _.get($event, 'source.nodeScope.$parentNodeScope.node')
            let selectedParent = _.get($event, 'dest.nodesScope.node')

            if (!lot) {
              return false
            } else if (!selectedParent && !previousParent) {
              return false
            }
            const query = {
              id: lot._id
            }
            let promises = []
            if (previousParent) {
              promises.push(ResourceSettings('Lot').server.one(previousParent._id).all('children').remove(query))
            }
            if (selectedParent) {
              promises.push(ResourceSettings('Lot').server.one(selectedParent._id).all('children').post(null, query))
            }
            Promise.all(promises).then(() => {
              reload()
            })
          }
        }

        class LotsSelector extends selection.Selected {
          toggle (lot, $event) {
            $event.shiftKey = false // We avoid the shift key
            super.toggle(lot, undefined, $event, $scope.lots)
          }

          _after () {
            $scope.onSelection({lots: this})
          }
        }

        $scope.selected = new LotsSelector()

        /**
         * Creates a new lot.
         * @param {?string} parentLotId
         */
        function newLot (parentLotId = null) {
          const lot = new resources.Lot({
            name: 'New lot',
            parents: parentLotId ? [parentLotId] : undefined
          })
          lot.post().then(() => {
            if (parentLotId) reload()
            else $scope.lots.addToTree(lot.id)
          })
        }

        $scope.newLot = newLot

        $scope.newChildLot = parentLotId => {
          newLot(parentLotId)
        }

        $scope.newLot = $event => {
          $event && $event.preventDefault()
          $event && $event.stopPropagation()
          newLot()
        }

        function reload () {
          resources.Lot.server.get('', {params: {format: 'UiTree'}}).then(lots => {
            $scope.lots = lots
          })
        }

        reload()
        $scope.$on('lots:reload', () => {
          reload()
        })
      }
    }
  }
}

module.exports = lotsTreeNavigation
