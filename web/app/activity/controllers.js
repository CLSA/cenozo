define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory', 'CnSession',
    function( $scope, CnActivityModelFactory, CnSession ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
