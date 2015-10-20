define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationModelFactory', 'CnSession',
    function( $scope, CnApplicationModelFactory, CnSession ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationViewCtrl', [
    '$scope', '$state', 'CnApplicationModelFactory', 'CnSession',
    function( $scope, $state, CnApplicationModelFactory, CnSession ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
      $scope.showChildren = $state.params.identifier.split( '=' ).pop() == CnSession.application.name;
    }
  ] );

} );
