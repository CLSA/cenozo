define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory',
    function( $scope, CnActivityModelFactory ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
