define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventTypeListCtrl', [
    '$scope', 'CnEventTypeModelFactory',
    function( $scope, CnEventTypeModelFactory ) {
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
