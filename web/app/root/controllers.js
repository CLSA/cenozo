define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory',
    function( $scope, CnHomeModelFactory ) {
      $scope.model = CnHomeModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
    }
  ] );

} );
