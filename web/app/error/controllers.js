define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ErrorCtrl', [
    '$scope', '$window', 'CnErrorModelFactory',
    function( $scope, $window, CnErrorModelFactory ) {
      $scope.model = CnErrorModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
      $scope.back = function() { $window.history.back(); };
      $scope.reload = function() { $window.location.reload(); };
    }
  ] );

} );
