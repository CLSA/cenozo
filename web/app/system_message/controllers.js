define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
