define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory', 'CnSession',
    function( $scope, CnHomeModelFactory, CnSession ) {
      $scope.model = CnHomeModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
    }
  ] );

} );
