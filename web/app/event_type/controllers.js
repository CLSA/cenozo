define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeListCtrl', [
    '$scope', 'CnEventTypeModelFactory',
    function( $scope, CnEventTypeModelFactory ) {
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
