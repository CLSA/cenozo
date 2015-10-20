define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneModelFactory', 'CnSession',
    function( $scope, CnPhoneModelFactory, CnSession ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneModelFactory', 'CnSession',
    function( $scope, CnPhoneModelFactory, CnSession ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneViewCtrl', [
    '$scope', 'CnPhoneModelFactory', 'CnSession',
    function( $scope, CnPhoneModelFactory, CnSession ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
