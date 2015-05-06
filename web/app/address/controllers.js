define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressAddCtrl', [
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
  cnCachedProviders.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory',
    function( $scope, CnAddressModelFactory ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
