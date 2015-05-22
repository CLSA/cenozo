define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory',
    function( $scope, CnActivityModelFactory ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
