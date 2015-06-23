define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
