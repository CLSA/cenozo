define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ErrorCtrl', [
    '$scope', 'CnErrorModelFactory',
    function( $scope, CnErrorModelFactory ) {
      $scope.model = CnErrorModelFactory.root;
    }
  ] );

} );
