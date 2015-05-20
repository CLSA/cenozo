define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ErrorCtrl', [
    '$scope', '$window', 'CnErrorModelFactory',
    function( $scope, $window, CnErrorModelFactory ) {
      $scope.model = CnErrorModelFactory.root;
      $scope.back = function() { $window.history.back(); };
      $scope.reload = function() { $window.location.reload(); };
    }
  ] );

} );
