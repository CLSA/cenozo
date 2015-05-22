define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
