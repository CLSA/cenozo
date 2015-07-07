define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CohortListCtrl', [
    '$scope', 'CnCohortModelFactory', 'CnSession',
    function( $scope, CnCohortModelFactory, CnSession ) {
      $scope.model = CnCohortModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
