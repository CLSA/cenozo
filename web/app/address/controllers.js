define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
