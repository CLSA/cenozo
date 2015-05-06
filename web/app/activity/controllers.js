define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory',
    function( $scope, CnActivityModelFactory ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
