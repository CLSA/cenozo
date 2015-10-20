define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ErrorCtrl', [
    '$scope', '$window', 'CnErrorModelFactory', 'CnSession',
    function( $scope, $window, CnErrorModelFactory, CnSession ) {
      $scope.model = CnErrorModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
      $scope.back = function() { $window.history.back(); };
      $scope.reload = function() { $window.location.reload(); };
    }
  ] );

} );
