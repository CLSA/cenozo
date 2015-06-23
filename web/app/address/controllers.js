define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
