define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeListCtrl', [
    '$scope', 'CnEventTypeModelFactory', 'CnSession',
    function( $scope, CnEventTypeModelFactory, CnSession ) {
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeViewCtrl', [
    '$scope', 'CnEventTypeModelFactory', 'CnSession',
    function( $scope, CnEventTypeModelFactory, CnSession ) { 
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }   
  ] );

} );
