define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentAddCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentListCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentViewCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
