define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
