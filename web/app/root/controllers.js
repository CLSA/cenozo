define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory',
    function( $scope, CnHomeModelFactory ) {
      $scope.model = CnHomeModelFactory.root;
    }
  ] );

} );
